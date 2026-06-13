import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Video, Upload, Download, CheckCircle, Circle, Play, HelpCircle } from "lucide-react";

export default function Videos() {
  const { apiCall } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Select Mode State
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

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
        a.download = "memoryvault-videos.zip";
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
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#8B5CF6] border-2 border-[#1E293B] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]">
            <Video size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight">
              Video Archive
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[#5C6F84]">
              Timeline video records • {videos.length} videos
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
            to="/videos/upload"
            className="btn-primary text-xs uppercase shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]"
            style={{ padding: "0.5rem 1.25rem" }}
          >
            <Upload size={14} strokeWidth={2.5} />
            Upload Video
          </Link>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
          <Video size={48} className="mx-auto text-[#94A3B8] mb-4" />
          <h3 className="font-display font-black text-base uppercase text-[#1E293B] mb-2">No videos logged</h3>
          <p className="text-xs font-bold text-[#5C6F84] uppercase mb-6">Upload your first vintage memory video clip</p>
          <Link to="/videos/upload" className="btn-primary text-xs uppercase">
            Upload Video Node
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedTimeline.map((group, idx) => (
            <div key={`${group.year}-${group.month}-${idx}`} className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="font-display font-black text-lg uppercase tracking-wider text-[#1E293B] whitespace-nowrap bg-[#FFFDF9] border-2 border-[#1E293B] px-3 py-1 rounded shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                  {group.month} {group.year}
                </h3>
                <div className="flex-1 border-t-3 border-[#1E293B]"></div>
              </div>

              {/* Grid of video thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {group.items.map((video) => {
                  const isSelected = selectedIds.has(video._id || video.id);
                  return (
                    <div
                      key={video._id || video.id}
                      onClick={() => selectMode && handleSelectToggle(video._id || video.id)}
                      className={`relative border-2 border-[#1E293B] rounded-lg overflow-hidden cursor-pointer shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] transition-all ${
                        selectMode 
                          ? (isSelected ? "border-[#8B5CF6] scale-98 shadow-[1px_1px_0px_0px_rgba(139,92,246,1)]" : "opacity-80 hover:opacity-100") 
                          : "hover:scale-102 hover:shadow-[4px_4px_0px_0px_rgba(139,92,246,1)]"
                      }`}
                    >
                      {/* Video Thumbnail cover block */}
                      <div className="aspect-video bg-[#FAF3E0] relative flex items-center justify-center">
                        <img
                          src={video.thumbnailUrl || video.fileUrl}
                          alt={video.title || video.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&fit=crop";
                          }}
                        />
                        {/* Centered Play overlay */}
                        <div className="absolute w-10 h-10 rounded-full bg-white bg-opacity-80 border-2 border-[#1E293B] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
                          <Play size={16} fill="#1E293B" color="#1E293B" className="ml-0.5" />
                        </div>

                        {/* Top Category Badge */}
                        <span className="absolute top-2 left-2 badge badge-cyan text-[7px] font-black py-0 px-1.5 shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]">
                          {video.views || 0} views
                        </span>
                      </div>

                      {/* Select Circle Overlays */}
                      {selectMode && (
                        <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 border border-[#1E293B] shadow">
                          {isSelected ? (
                            <CheckCircle size={14} className="text-[#8B5CF6]" strokeWidth={3} />
                          ) : (
                            <Circle size={14} className="text-[#94A3B8]" strokeWidth={2.5} />
                          )}
                        </div>
                      )}

                      {/* Info footer */}
                      <div className="p-3 bg-white border-t-2 border-[#1E293B] flex flex-col justify-between h-20">
                        <div className="truncate">
                          <h4 className="font-display font-black text-xs uppercase text-[#1E293B] truncate leading-tight">
                            {video.title || video.fileName}
                          </h4>
                          <span className="text-[8px] font-bold text-[#5C6F84] uppercase">
                            {new Date(video.mediaDate).toLocaleDateString()}
                          </span>
                        </div>
                        {video.story ? (
                          <p className="text-[9px] font-semibold text-[#5C6F84] truncate italic">
                            "{video.story}"
                          </p>
                        ) : (
                          <span className="text-[8px] font-black text-[#EC4899] uppercase">No story context</span>
                        )}
                      </div>

                      {/* Starred indicator overlay */}
                      {video.favorite && (
                        <div className="absolute top-2 right-2 bg-[#FBBF24] border border-[#1E293B] text-[8px] font-black uppercase px-1 rounded shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]">
                          ⭐ Fav
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-4 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] flex items-center gap-4 z-50 animate-fade-in w-max">
          <span className="text-xs font-black uppercase text-[#1E293B]">
            Selected: <span className="text-[#8B5CF6]">{selectedIds.size}</span> / {videos.length}
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
