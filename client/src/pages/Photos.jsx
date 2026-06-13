import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Image, Upload, Download, CheckCircle, Circle, Sparkles, Heart } from "lucide-react";
import { API_BASE } from "../context/AuthContext";

export default function Photos() {
  const { apiCall } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Select Mode State
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingIndividually, setDownloadingIndividually] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const downloadFile = async (url, title) => {
    try {
      const downloadName = title || "memory";
      const proxyUrl = `/api/media/download-file?url=${encodeURIComponent(url)}&name=${encodeURIComponent(downloadName)}`;
      const res = await apiCall(proxyUrl);
      if (!res.ok) throw new Error("Proxy download error");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const extension = url.split(".").pop().split("?")[0] || "jpg";
      a.download = `${downloadName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  const handleDownloadIndividually = async () => {
    if (selectedIds.size === 0) return;
    setDownloadingIndividually(true);
    try {
      const selectedPhotos = photos.filter(p => selectedIds.has(p._id || p.id));
      for (const photo of selectedPhotos) {
        await downloadFile(photo.fileUrl, photo.title || photo.fileName);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error("Individual sequential download failed:", err);
    } finally {
      setDownloadingIndividually(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await apiCall("/api/media?type=photo");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      } else {
        setError("Failed to fetch photo archives.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error loading photos.");
    } finally {
      setLoading(false);
    }
  };

  // Group photos by Year -> Month Name
  const getGroupedPhotos = () => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const grouped = {};

    photos.forEach(photo => {
      const date = new Date(photo.mediaDate);
      const year = date.getFullYear();
      const month = months[date.getMonth()];

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(photo);
    });

    // Sort years descending
    const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => b - a);
    
    // Sort months within year chronologically descending
    const monthOrderMap = {};
    months.forEach((m, idx) => { monthOrderMap[m] = idx; });

    const result = [];
    sortedYears.forEach(year => {
      const sortedMonths = Object.keys(grouped[year]).sort((a, b) => monthOrderMap[b] - monthOrderMap[a]);
      sortedMonths.forEach(month => {
        result.push({
          year,
          month,
          items: grouped[year][month].sort((a, b) => new Date(b.mediaDate) - new Date(a.mediaDate))
        });
      });
    });

    return result;
  };

  const handleSelectToggle = (id) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map(p => p._id || p.id)));
    }
  };

  const handleDownloadZip = async () => {
    if (selectedIds.size === 0) return;
    setDownloadingZip(true);
    try {
      const res = await apiCall("/api/media/download-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "our-love-photos.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        // Reset selections
        setSelectedIds(new Set());
        setSelectMode(false);
      } else {
        alert("Failed to build download bundle.");
      }
    } catch (err) {
      console.error("Zip download error:", err);
      alert("Error compiling ZIP archive.");
    } finally {
      setDownloadingZip(false);
    }
  };

  const groupedTimeline = getGroupedPhotos();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 skeleton"></div>
        <div className="h-64 skeleton"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-[var(--text-primary)]">
      {/* Gallery Header */}
      <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-6 shadow-[5px_5px_0px_0px_var(--shadow-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] border-2 border-[var(--border)] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_var(--shadow-color)] heartbeat">
            <Image size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight">
              Our Photos
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[var(--text-secondary)]">
              Our Photo Album • {photos.length} photos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds(new Set());
            }}
            className={`btn-ghost text-xs uppercase ${selectMode ? "bg-[var(--color-secondary)] text-[var(--text-primary)]" : ""}`}
            style={{ padding: "0.5rem 1.25rem" }}
          >
            {selectMode ? "Cancel Select" : "Select Album Collection"}
          </button>
          
          <Link
            to="/photos/upload"
            className="btn-primary text-xs uppercase shadow-[2.5px_2.5px_0px_0px_var(--shadow-color)]"
            style={{ padding: "0.5rem 1.25rem" }}
          >
            <Upload size={14} strokeWidth={2.5} />
            Upload Photo
          </Link>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_var(--shadow-color)]">
          <Image size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="font-display font-black text-base uppercase text-[var(--text-primary)] mb-2">No photos captured yet</h3>
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-6">Let's upload our first beautiful memory snapshot together!</p>
          <Link to="/photos/upload" className="btn-primary text-xs uppercase">
            Upload Photo
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedTimeline.map((group, idx) => (
            <div key={`${group.year}-${group.month}-${idx}`} className="space-y-4">
              {/* Year & Month Banner */}
              <div className="flex items-center gap-4">
                <h3 className="font-display font-black text-lg uppercase tracking-wider text-[var(--text-primary)] whitespace-nowrap bg-[var(--bg-card)] border-2 border-[var(--border)] px-3 py-1 rounded shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                  {group.month} {group.year}
                </h3>
                <div className="flex-1 border-t-3 border-[var(--border)]"></div>
              </div>

              {/* Photo grid (using the same card design as Favorites) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {group.items.map((photo) => {
                  const isSelected = selectedIds.has(photo._id || photo.id);
                  
                  const CardContent = (
                    <>
                      {/* Photo Thumbnail Container */}
                      <div className="h-40 bg-[var(--bg-primary)] border-b-2 border-[var(--border)] overflow-hidden relative">
                        <img
                          src={photo.fileUrl}
                          alt={photo.title || photo.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=200&fit=crop";
                          }}
                        />

                        {/* Select Circle Overlays */}
                        {selectMode && (
                          <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 border border-[var(--border)] shadow z-10">
                            {isSelected ? (
                              <CheckCircle size={14} className="text-[var(--color-primary)]" strokeWidth={3} />
                            ) : (
                              <Circle size={14} className="text-[var(--text-muted)]" strokeWidth={2.5} />
                            )}
                          </div>
                        )}

                        <span className="absolute top-2 right-2 bg-[var(--color-secondary)] border border-[var(--border)] text-[7px] font-black tracking-widest uppercase py-0.5 px-2 rounded shadow-[1px_1px_0px_0px_var(--shadow-color)] text-[var(--text-primary)]">
                          {photo.mediaType}
                        </span>

                        {photo.favorite && (
                          <span className="absolute top-2 left-2 bg-[var(--color-primary)] text-white border border-[var(--border)] text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_var(--shadow-color)] flex items-center gap-1">
                            Loved 💖
                          </span>
                        )}

                        {!selectMode && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              downloadFile(photo.fileUrl, photo.title || photo.fileName);
                            }}
                            className="absolute bottom-2 right-2 bg-white/95 text-[var(--text-primary)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--border)] rounded-full p-1.5 shadow-[1.5px_1.5px_0px_0px_var(--shadow-color)] z-10 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                            title="Download memory"
                          >
                            <Download size={12} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>

                      {/* Detail fields info */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div className="leading-tight">
                          <h4 className="font-display font-black text-xs uppercase text-[var(--text-primary)] truncate">
                            {photo.title || photo.fileName}
                          </h4>
                          <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase mt-0.5">
                            {new Date(photo.mediaDate).toLocaleDateString()}
                          </p>
                        </div>

                        {photo.story ? (
                          <p className="text-[9px] font-medium text-[var(--text-primary)] line-clamp-2 bg-[var(--bg-primary)] p-1.5 rounded border border-[var(--border)] italic">
                            "{photo.story}"
                          </p>
                        ) : (
                          <span className="text-[8px] font-black text-[var(--color-primary)] uppercase">No story context</span>
                        )}
                      </div>
                    </>
                  );

                  const cardClass = `group flex flex-col bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-lg shadow-[3px_3px_0px_0px_var(--shadow-color)] no-underline transition-all overflow-hidden ${
                    selectMode
                      ? (isSelected ? "border-[var(--color-primary)] scale-98 shadow-[1.5px_1.5px_0px_0px_var(--color-primary)] bg-[var(--bg-primary)]" : "cursor-pointer hover:border-[var(--color-accent)]")
                      : "hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_var(--color-primary)]"
                  }`;

                  if (selectMode) {
                    return (
                      <div
                        key={photo._id || photo.id}
                        onClick={() => handleSelectToggle(photo._id || photo.id)}
                        className={cardClass}
                      >
                        {CardContent}
                      </div>
                    );
                  } else {
                    return (
                      <Link
                        key={photo._id || photo.id}
                        to={`/media/${photo._id || photo.id}`}
                        className={cardClass}
                      >
                        {CardContent}
                      </Link>
                    );
                  }
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Select Mode Action Panel at bottom */}
      {selectMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-4 shadow-[6px_6px_0px_0px_var(--shadow-color)] flex items-center gap-4 z-50 animate-fade-in w-max">
          <span className="text-xs font-black uppercase text-[var(--text-primary)]">
            Selected: <span className="text-[var(--color-primary)]">{selectedIds.size}</span> / {photos.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="btn-ghost text-[10px] uppercase py-1.5 px-3"
            >
              {selectedIds.size === photos.length ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={selectedIds.size === 0 || downloadingZip}
              className="btn-primary text-[10px] uppercase py-1.5 px-4 shadow-[2px_2px_0px_0px_var(--shadow-color)] cursor-pointer"
            >
              {downloadingZip ? "Compiling..." : "Download ZIP Bundle"}
              <Download size={10} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleDownloadIndividually}
              disabled={selectedIds.size === 0 || downloadingIndividually}
              className="btn-primary bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-[10px] uppercase py-1.5 px-4 shadow-[2px_2px_0px_0px_var(--shadow-color)] cursor-pointer"
            >
              {downloadingIndividually ? "Downloading..." : "Download Individually"}
              <Download size={10} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
