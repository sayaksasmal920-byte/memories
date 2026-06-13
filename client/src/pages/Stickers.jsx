import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Smile, Upload, Star, Heart, Clipboard, Trash2, Check } from "lucide-react";

export default function Stickers() {
  const { apiCall } = useAuth();
  const [stickers, setStickers] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // recent, favorites, all
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchStickers();
  }, []);

  const fetchStickers = async () => {
    try {
      const res = await apiCall("/api/media?type=sticker");
      if (res.ok) {
        const data = await res.json();
        setStickers(data);
      }
    } catch (err) {
      console.error("Fetch stickers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (sticker) => {
    try {
      const res = await apiCall(`/api/media/${sticker._id || sticker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !sticker.favorite }),
      });
      if (res.ok) {
        // Toggle in UI state
        setStickers(prev => prev.map(s => 
          (s._id === sticker._id || s.id === sticker.id) ? { ...s, favorite: !s.favorite } : s
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSticker = async (id) => {
    if (!window.confirm("Delete this sticker from your collection?")) return;
    try {
      const res = await apiCall(`/api/media/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStickers(prev => prev.filter(s => s._id !== id && s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyStickerLink = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filter stickers based on active tab
  const getFilteredStickers = () => {
    if (activeTab === "favorites") {
      return stickers.filter(s => s.favorite);
    }
    if (activeTab === "recent") {
      // Return 15 most recently uploaded stickers
      return [...stickers]
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 15);
    }
    return stickers;
  };

  const displayList = getFilteredStickers();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 skeleton"></div>
        <div className="h-48 skeleton"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#34D399] border-2 border-[#1E293B] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]">
            <Smile size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight">
              Sticker Ledger
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[#5C6F84]">
              Webp collections & pack unpacker • {stickers.length} stickers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/stickers/upload"
            className="btn-primary text-xs uppercase shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]"
            style={{ padding: "0.5rem 1.25rem" }}
          >
            <Upload size={14} strokeWidth={2.5} />
            Upload Sticker Pack
          </Link>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 border-b-3 border-[#1E293B] pb-0.5">
        {[
          { id: "all", name: "All Stickers" },
          { id: "recent", name: "Recent Uploads" },
          { id: "favorites", name: "⭐ Favorites" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-display font-black text-xs uppercase border-2 border-b-0 rounded-t-lg transition-all tracking-wider cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#FFFDF9] border-[#1E293B] translate-y-[3px]"
                : "bg-transparent border-transparent text-[#5C6F84] hover:text-[#1E293B]"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {displayList.length === 0 ? (
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
          <Smile size={48} className="mx-auto text-[#94A3B8] mb-4" />
          <h3 className="font-display font-black text-base uppercase text-[#1E293B] mb-2">
            No stickers found
          </h3>
          <p className="text-xs font-bold text-[#5C6F84] uppercase mb-6">
            {activeTab === "favorites" ? "Mark some stickers as favorites to see them here." : "Upload individual webp files or a ZIP sticker pack!"}
          </p>
          {activeTab !== "favorites" && (
            <Link to="/stickers/upload" className="btn-primary text-xs uppercase">
              Upload Stickers
            </Link>
          )}
        </div>
      ) : (
        /* Sticker Grid */
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {displayList.map(sticker => {
            const sid = sticker._id || sticker.id;
            return (
              <div
                key={sid}
                className="bg-white border-2 border-[#1E293B] rounded-lg p-2 flex flex-col justify-between items-center group relative aspect-square shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)] hover:shadow-[4px_4px_0px_0px_rgba(52,211,153,1)] hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                {/* Sticker Webp image */}
                <div className="flex-1 w-full h-full flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={sticker.fileUrl}
                    alt={sticker.title || sticker.fileName}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=100&fit=crop";
                    }}
                  />
                </div>

                {/* Sticker title hover tag */}
                <span className="text-[8px] font-black uppercase text-[#5C6F84] truncate w-full text-center mt-1 group-hover:hidden">
                  {sticker.title || sticker.fileName.replace(/\.[^/.]+$/, "")}
                </span>

                {/* Overlay Action Buttons (visible on hover) */}
                <div className="absolute inset-x-0 bottom-0 bg-white border-t border-[#1E293B] p-1 flex justify-around opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {/* Favorite toggle */}
                  <button
                    onClick={() => handleFavoriteToggle(sticker)}
                    className="p-1 text-[#5C6F84] hover:text-[#EC4899] cursor-pointer"
                    title={sticker.favorite ? "Unfavorite" : "Favorite"}
                  >
                    <Heart size={12} fill={sticker.favorite ? "#EC4899" : "none"} strokeWidth={2.5} />
                  </button>

                  {/* Copy static url link */}
                  <button
                    onClick={() => copyStickerLink(sticker.fileUrl, sid)}
                    className="p-1 text-[#5C6F84] hover:text-[#8B5CF6] cursor-pointer"
                    title="Copy Image URL"
                  >
                    {copiedId === sid ? <Check size={12} className="text-[#34D399]" strokeWidth={2.5} /> : <Clipboard size={12} strokeWidth={2.5} />}
                  </button>

                  {/* Delete sticker */}
                  <button
                    onClick={() => handleDeleteSticker(sid)}
                    className="p-1 text-[#5C6F84] hover:text-[#F87171] cursor-pointer"
                    title="Delete Sticker"
                  >
                    <Trash2 size={12} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
