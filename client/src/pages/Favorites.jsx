import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Heart, Image, Film, Smile, Download } from "lucide-react";

export default function Favorites() {
  const { apiCall, downloadFile } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await apiCall("/api/media?favorite=true");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <Heart size={18} fill="white" color="white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight text-[var(--text-primary)]">
              Favourites
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[var(--text-secondary)]">
              {favorites.length} liked ❤️
            </p>
          </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_var(--shadow-color)]">
          <Heart size={48} className="mx-auto text-[var(--text-muted)] mb-4 heartbeat" fill="var(--color-secondary)" />
          <h3 className="font-display font-black text-base uppercase text-[var(--text-primary)] mb-2">No Favourites added yet</h3>
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-6">press the heart button to show them here</p>
          <Link to="/dashboard" className="btn-primary text-xs uppercase">
            Browse Timeline
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {favorites.map(item => (
            <Link
              key={item._id || item.id}
              to={`/media/${item._id || item.id}`}
              className="group flex flex-col bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-lg shadow-[3px_3px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_var(--color-primary)] no-underline transition-all overflow-hidden"
            >
              <div className="h-40 bg-[var(--bg-primary)] border-b-2 border-[var(--border)] overflow-hidden relative">
                <img
                  src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                  alt={item.title || item.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                <span className="absolute top-2 right-2 badge badge-cyan text-[7px] font-black tracking-widest shadow-[1px_1px_0px_0px_var(--shadow-color)] py-0.5 px-2">
                  {item.mediaType}
                </span>

                <span className="absolute top-2 left-2 bg-[var(--color-primary)] text-white border border-[var(--border)] text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_var(--shadow-color)] flex items-center gap-1">
                  💖 Liked
                </span>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadFile(item.fileUrl, item.title || item.fileName);
                  }}
                  className="absolute bottom-2 right-2 bg-white/95 text-[var(--text-primary)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--border)] rounded-full p-1.5 shadow-[1.5px_1.5px_0px_0px_var(--shadow-color)] z-10 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                  title="Download memory"
                >
                  <Download size={12} strokeWidth={2.5} />
                </button>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div className="leading-tight">
                  <h4 className="font-display font-black text-xs uppercase text-[var(--text-primary)] truncate">
                    {item.title || item.fileName}
                  </h4>
                  <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">
                    {new Date(item.mediaDate).toLocaleDateString()}
                  </p>
                </div>

                {item.story ? (
                  <p className="text-[9px] font-medium text-[var(--text-primary)] line-clamp-2 bg-[var(--bg-primary)] p-1.5 rounded border border-[var(--border)] italic">
                    "{item.story}"
                  </p>
                ) : (
                  <span className="text-[8px] font-black text-[var(--color-primary)] uppercase">No story context</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
