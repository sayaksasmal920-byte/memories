import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Heatmap from "../components/Heatmap";
import StoryMeter from "../components/StoryMeter";
import { Image, Video, Smile, Upload, PlusCircle, Sparkles, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { apiCall } = useAuth();
  const [mediaList, setMediaList] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch media list
        const mediaRes = await apiCall("/api/media");
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          setMediaList(mediaData);
        }

        // Fetch heatmap data
        const heatmapRes = await apiCall("/api/media/heatmap");
        if (heatmapRes.ok) {
          const heatData = await heatmapRes.json();
          setHeatmapData(heatData);
        }
      } catch (err) {
        console.error("Dashboard data load failure:", err);
        setError("Could not load archive logs.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const recentMedia = mediaList.slice(0, 4);

  // Quick Action card metadata
  const quickActions = [
    { name: "Upload Photo", path: "/photos/upload", icon: Image, bg: "var(--color-primary)", text: "Upload JPEG/PNG/GIF and suggest EXIF times." },
    { name: "Upload Video", path: "/videos/upload", icon: Video, bg: "var(--color-secondary)", text: "Upload MP4/MOV and auto-render cover frames." },
    { name: "Archive Sticker", path: "/stickers/upload", icon: Smile, bg: "var(--color-accent)", text: "Upload WEBP files or zip sticker folders." }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 skeleton"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 skeleton md:col-span-2"></div>
          <div className="h-48 skeleton"></div>
        </div>
        <div className="h-64 skeleton"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Board */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
          <Sparkles size={160} className="text-[#8B5CF6]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-black text-2xl uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
            Welcome to your vault
          </h2>
          <p className="text-xs font-bold text-[#5C6F84] uppercase tracking-wide">
            Timeline status: online • total archives:{" "}
            <span className="text-[#8B5CF6] font-extrabold">{mediaList.length} files</span>
          </p>
        </div>
        
        {/* Master Upload Button */}
        <div className="flex gap-3">
          <Link
            to="/photos/upload"
            className="btn-primary text-xs uppercase shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]"
            style={{ padding: "0.6rem 1.5rem" }}
          >
            <Upload size={14} strokeWidth={2.5} />
            Quick Upload
          </Link>
        </div>
      </div>

      {/* Timeline Heatmap */}
      <Heatmap data={heatmapData} />

      {/* Grid: Story Tracker & Quick Action buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Story completion tracker */}
        <div className="lg:col-span-1">
          <StoryMeter mediaList={mediaList} />
        </div>

        {/* Quick action grid */}
        <div className="lg:col-span-2 bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-4">
          <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#1E293B] border-b-2 border-[#1E293B] pb-2 flex items-center gap-2">
            🚀 Quick Archive Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((act) => {
              const Icon = act.icon;
              return (
                <Link
                  key={act.name}
                  to={act.path}
                  className="flex flex-col justify-between p-4 bg-[#FFFDF9] border-2 border-[#1E293B] rounded-lg shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:scale-102 hover:shadow-[4px_4px_0px_0px_var(--color-secondary)] hover:-translate-y-0.5 no-underline transition-all text-left h-44"
                >
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-[#1E293B] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]"
                    style={{ backgroundColor: act.bg }}
                  >
                    <Icon size={18} color={act.bg === "var(--color-accent)" ? "#1E293B" : "white"} strokeWidth={2.5} />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-black text-[#1E293B] uppercase">{act.name}</div>
                    <div className="text-[9px] font-semibold text-[#5C6F84] leading-relaxed uppercase">{act.text}</div>
                  </div>
                  <div className="text-[10px] font-extrabold text-[#8B5CF6] uppercase mt-2 flex items-center gap-1">
                    Launch <PlusCircle size={10} strokeWidth={2.5} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recently Added Section */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-6">
        <div className="flex items-center justify-between border-b-2 border-[#1E293B] pb-2">
          <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
            📸 Recently Added Memories
          </h3>
          <span className="text-[10px] font-extrabold uppercase text-[#5C6F84]">Latest Logs</span>
        </div>

        {recentMedia.length === 0 ? (
          <div className="text-center py-12 bg-[#FAF3E0] border-2 border-dashed border-[#CBD5E1] rounded-lg">
            <p className="text-sm font-bold text-[#5C6F84] uppercase">
              No files archived yet. Use the upload triggers to start!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentMedia.map((item) => (
              <Link
                key={item._id || item.id}
                to={`/media/${item._id || item.id}`}
                className="group flex flex-col bg-[#FFFDF9] border-2 border-[#1E293B] rounded-lg shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(244,114,182,1)] no-underline transition-all overflow-hidden"
              >
                {/* Media frame */}
                <div className="h-40 bg-[#FAF3E0] border-b-2 border-[#1E293B] overflow-hidden relative">
                  <img
                    src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                    alt={item.title || item.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&fit=crop";
                    }}
                  />
                  {/* Category Indicator overlay */}
                  <span className="absolute top-2 right-2 badge badge-warning text-[8px] font-black tracking-widest shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] py-0.5 px-2">
                    {item.mediaType}
                  </span>
                </div>

                {/* Info block */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div className="leading-tight">
                    <h4 className="font-display font-black text-xs uppercase text-[#1E293B] truncate">
                      {item.title || item.fileName}
                    </h4>
                    <p className="text-[9px] font-bold text-[#5C6F84] uppercase">
                      {new Date(item.mediaDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {item.story ? (
                    <p className="text-[10px] font-medium text-[#1E293B] line-clamp-2 bg-[#FAF3E0] p-1.5 rounded border border-[#CBD5E1] italic">
                      "{item.story}"
                    </p>
                  ) : (
                    <div className="text-[9px] font-extrabold text-[#EC4899] uppercase flex items-center gap-1 bg-[#FDF2F8] border border-[#FBCFE8] px-1.5 py-0.5 rounded w-max">
                      No story context
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
