import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Video, Upload, Download, CheckCircle, Circle, Play, Heart } from "lucide-react";

export default function Videos() {
  const { apiCall, downloadFile } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Select Mode State
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingIndividually, setDownloadingIndividually] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDownloadIndividually = async () => {
    if (selectedIds.size === 0) return;
    setDownloadingIndividually(true);
    try {
      const selectedVideos = videos.filter(v => selectedIds.has(v._id || v.id));
      for (const video of selectedVideos) {
        await downloadFile(video.fileUrl, video.title || video.fileName);
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

  const fetchVideos = async () => {
    try {
      const res = await apiCall("/api/media?type=video");
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      } else {
        setError("Failed to fetch video archives.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error loading videos.");
    } finally {
      setLoading(false);
    }
  };

  // Group videos by Year -> Month Name
  const getGroupedVideos = () => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const grouped = {};

    videos.forEach(video => {
      const date = new Date(video.mediaDate);
      const year = date.getFullYear();
      const month = months[date.getMonth()];

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(video);
    });

    const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => b - a);
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
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(videos.map(v => v._id || v.id)));
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
        a.download = "our-love-videos.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        setSelectedIds(new Set());
        setSelectMode(false);
      } else {
        alert("Failed to build download bundle.");
      }
    } catch (err) {
      console.error("Zip download error:", err);
      alert("Error compiling ZIP video archive.");
    } finally {
      setDownloadingZip(false);
    }
  };

  const groupedTimeline = getGroupedVideos();

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
      {/* Header Panel */}
      <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-6 shadow-[5px_5px_0px_0px_var(--shadow-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] border-2 border-[var(--border)] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_var(--shadow-color)] heartbeat">
            <Video size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight">
              Our Videos
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[var(--text-secondary)]">
              Our Clips & Laughs • {videos.length} videos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          
          <Link
            to="/videos/upload"
            className="btn-primary text-xs uppercase shadow-[2.5px_2.5px_0px_0px_var(--shadow-color)]"
            style={{ padding: "0.5rem 1.25rem" }}
          >
            <Upload size={14} strokeWidth={2.5} />
            Upload Video
          </Link>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_var(--shadow-color)]">
          <Video size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="font-display font-black text-base uppercase text-[var(--text-primary)] mb-2">No videos logged yet</h3>
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-6">first video upload kore de!!</p>
          <Link to="/videos/upload" className="btn-primary text-xs uppercase">
            Upload Video
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedTimeline.map((group, idx) => (
            <div key={`${group.year}-${group.month}-${idx}`} className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="font-display font-black text-lg uppercase tracking-wider text-[var(--text-primary)] whitespace-nowrap bg-[var(--bg-card)] border-2 border-[var(--border)] px-3 py-1 rounded shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                  {group.month} {group.year}
                </h3>
                <div className="flex-1 border-t-3 border-[var(--border)]"></div>
              </div>

              {/* Grid of video thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {group.items.map((video) => {
                  const isSelected = selectedIds.has(video._id || video.id);
                  return (
                    <div
                      key={video._id || video.id}
                      onClick={() => selectMode && handleSelectToggle(video._id || video.id)}
                      className={`relative border-2 border-[var(--border)] rounded-lg overflow-hidden cursor-pointer shadow-[3px_3px_0px_0px_var(--shadow-color)] transition-all ${
                        selectMode 
                          ? (isSelected ? "border-[var(--color-primary)] scale-98 shadow-[1px_1px_0px_0px_var(--color-primary)]" : "opacity-80 hover:opacity-100") 
                          : "hover:scale-102 hover:shadow-[4px_4px_0px_0px_var(--color-primary)]"
                      }`}
                    >
                      {/* Video Thumbnail cover block */}
                      <div className="aspect-video bg-[var(--bg-primary)] relative flex items-center justify-center">
                        <img
                          src={video.thumbnailUrl || video.fileUrl}
                          alt={video.title || video.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&fit=crop";
                          }}
                        />
                        {/* Centered Play overlay */}
                        <div className="absolute w-10 h-10 rounded-full bg-white bg-opacity-80 border-2 border-[var(--border)] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_var(--shadow-color)]">
                          <Play size={16} fill="var(--text-primary)" color="var(--text-primary)" className="ml-0.5" />
                        </div>

                        {/* Top Category Badge */}
                        <span className="absolute top-2 right-2 bg-[var(--color-secondary)] border border-[var(--border)] text-[7px] font-black tracking-widest uppercase py-0.5 px-2 rounded shadow-[1px_1px_0px_0px_var(--shadow-color)] text-[var(--text-primary)]">
                          Clip
                        </span>

                        {!selectMode && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              downloadFile(video.fileUrl, video.title || video.fileName);
                            }}
                            className="absolute bottom-2 right-2 bg-white/95 text-[var(--text-primary)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--border)] rounded-full p-1.5 shadow-[1.5px_1.5px_0px_0px_var(--shadow-color)] z-10 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                            title="Download video"
                          >
                            <Download size={12} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>

                      {/* Select Circle Overlays */}
                      {selectMode && (
                        <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 border border-[var(--border)] shadow">
                          {isSelected ? (
                            <CheckCircle size={14} className="text-[var(--color-primary)]" strokeWidth={3} />
                          ) : (
                            <Circle size={14} className="text-[var(--text-muted)]" strokeWidth={2.5} />
                          )}
                        </div>
                      )}

                      {/* Info footer */}
                      <div className="p-3 bg-[var(--bg-card)] border-t-2 border-[var(--border)] flex flex-col justify-between h-20">
                        <div className="truncate">
                          <h4 className="font-display font-black text-xs uppercase text-[var(--text-primary)] truncate leading-tight">
                            {video.title || video.fileName}
                          </h4>
                          <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">
                            {new Date(video.mediaDate).toLocaleDateString()}
                          </span>
                        </div>
                        {video.story ? (
                          <p className="text-[9px] font-semibold text-[var(--text-secondary)] truncate italic">
                            "{video.story}"
                          </p>
                        ) : (
                          <span className="text-[8px] font-black text-[var(--color-primary)] uppercase">No story context</span>
                        )}
                      </div>

                      {/* Starred indicator overlay */}
                      {video.favorite && (
                        <div className="absolute top-2 left-2 bg-[var(--color-primary)] text-white border border-[var(--border)] text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_var(--shadow-color)] flex items-center gap-1">
                          Liked 💖
                        </div>
                      )}

                      {/* Link (disabled in select mode) */}
                      {!selectMode && (
                        <Link
                          to={`/media/${video._id || video.id}`}
                          className="absolute inset-0 bg-transparent"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Bundle Selector Panel */}
      {selectMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-4 shadow-[6px_6px_0px_0px_var(--shadow-color)] flex items-center gap-4 z-50 animate-fade-in w-max">
          <span className="text-xs font-black uppercase text-[var(--text-primary)]">
            Selected: <span className="text-[var(--color-primary)]">{selectedIds.size}</span> / {videos.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="btn-ghost text-[10px] uppercase py-1.5 px-3"
            >
              {selectedIds.size === videos.length ? "Deselect All" : "Select All"}
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
