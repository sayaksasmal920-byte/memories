import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Image, Upload, Download, CheckCircle, Circle, Sparkles, FolderHeart } from "lucide-react";
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

  useEffect(() => {
    fetchPhotos();
  }, []);

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
        a.download = "memoryvault-photos.zip";
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
    <div className="space-y-8 animate-fade-in">
      {/* Gallery Header */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F472B6] border-2 border-[#1E293B] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]">
            <Image size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight">
              Photo Archive
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[#5C6F84]">
              Timeline gallery • {photos.length} photos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds(new Set());
            }}
            className={`btn-ghost text-xs uppercase ${selectMode ? "bg-[#FBBF24] border-[#1E293B]" : ""}`}
            style={{ padding: "0.5rem 1.25rem" }}
          >
            {selectMode ? "Cancel Select" : "Select Bundle"}
          </button>
          
          <Link
            to="/photos/upload"
            className="btn-primary text-xs uppercase shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]"
            style={{ padding: "0.5rem 1.25rem" }}
          >
            <Upload size={14} strokeWidth={2.5} />
            Upload Photo
          </Link>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
          <Image size={48} className="mx-auto text-[#94A3B8] mb-4" />
          <h3 className="font-display font-black text-base uppercase text-[#1E293B] mb-2">No photos logged</h3>
          <p className="text-xs font-bold text-[#5C6F84] uppercase mb-6">Upload your first vintage memory photograph</p>
          <Link to="/photos/upload" className="btn-primary text-xs uppercase">
            Upload Photo Node
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedTimeline.map((group, idx) => (
            <div key={`${group.year}-${group.month}-${idx}`} className="space-y-4">
              {/* Year & Month Banner */}
              <div className="flex items-center gap-4">
                <h3 className="font-display font-black text-lg uppercase tracking-wider text-[#1E293B] whitespace-nowrap bg-[#FFFDF9] border-2 border-[#1E293B] px-3 py-1 rounded shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                  {group.month} {group.year}
                </h3>
                <div className="flex-1 border-t-3 border-[#1E293B]"></div>
              </div>

              {/* Photo grid (using the same card design as Favorites) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {group.items.map((photo) => {
                  const isSelected = selectedIds.has(photo._id || photo.id);
                  
                  const CardContent = (
                    <>
                      {/* Photo Thumbnail Container */}
                      <div className="h-40 bg-[#FAF3E0] border-b-2 border-[#1E293B] overflow-hidden relative">
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
                          <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 border border-[#1E293B] shadow z-10">
                            {isSelected ? (
                              <CheckCircle size={14} className="text-[#8B5CF6]" strokeWidth={3} />
                            ) : (
                              <Circle size={14} className="text-[#94A3B8]" strokeWidth={2.5} />
                            )}
                          </div>
                        )}

                        <span className="absolute top-2 right-2 bg-[#F472B6] border border-[#1E293B] text-[7px] font-black tracking-widest uppercase py-0.5 px-2 rounded shadow">
                          {photo.mediaType}
                        </span>

                        {photo.favorite && (
                          <span className="absolute top-2 left-2 bg-[#FBBF24] border border-[#1E293B] text-[8px] font-black uppercase px-1 rounded shadow">
                            ⭐ Star
                          </span>
                        )}
                      </div>

                      {/* Detail fields info */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div className="leading-tight">
                          <h4 className="font-display font-black text-xs uppercase text-[#1E293B] truncate">
                            {photo.title || photo.fileName}
                          </h4>
                          <p className="text-[8px] font-bold text-[#5C6F84] uppercase mt-0.5">
                            {new Date(photo.mediaDate).toLocaleDateString()}
                          </p>
                        </div>

                        {photo.story ? (
                          <p className="text-[9px] font-medium text-[#1E293B] line-clamp-2 bg-[#FAF3E0] p-1.5 rounded border border-[#CBD5E1] italic">
                            "{photo.story}"
                          </p>
                        ) : (
                          <span className="text-[8px] font-black text-[#EC4899] uppercase">No story context</span>
                        )}
                      </div>
                    </>
                  );

                  const cardClass = `group flex flex-col bg-[#FFFDF9] border-2 border-[#1E293B] rounded-lg shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] no-underline transition-all overflow-hidden ${
                    selectMode
                      ? (isSelected ? "border-[#8B5CF6] scale-98 shadow-[1.5px_1.5px_0px_0px_rgba(139,92,246,1)] bg-[#EC4899] bg-opacity-5" : "cursor-pointer hover:border-[#F472B6]")
                      : "hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(244,114,182,1)]"
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-4 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] flex items-center gap-4 z-50 animate-fade-in w-max">
          <span className="text-xs font-black uppercase text-[#1E293B]">
            Selected: <span className="text-[#8B5CF6]">{selectedIds.size}</span> / {photos.length}
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
              className="btn-primary text-[10px] uppercase py-1.5 px-4 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
            >
              {downloadingZip ? "Compiling..." : "Download ZIP Bundle"}
              <Download size={10} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
