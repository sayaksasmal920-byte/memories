import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Star, Image, Film, Smile, Heart } from "lucide-react";

export default function Favorites() {
  const { apiCall } = useAuth();
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
    <div className="space-y-8 animate-fade-in text-[#1E293B]">
      {/* Header Panel */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FBBF24] border-2 border-[#1E293B] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]">
            <Star size={18} fill="#1E293B" color="#1E293B" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight">
              Favorite Memories
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[#5C6F84]">
              ⭐ Starred moments • {favorites.length} starred
            </p>
          </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
          <Star size={48} className="mx-auto text-[#94A3B8] mb-4" />
          <h3 className="font-display font-black text-base uppercase text-[#1E293B] mb-2">No favorites starred</h3>
          <p className="text-xs font-bold text-[#5C6F84] uppercase mb-6">Star important memories in the detail pages to isolate them here.</p>
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
              className="group flex flex-col bg-[#FFFDF9] border-2 border-[#1E293B] rounded-lg shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(251,191,36,1)] no-underline transition-all overflow-hidden"
            >
              <div className="h-40 bg-[#FAF3E0] border-b-2 border-[#1E293B] overflow-hidden relative">
                <img
                  src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                  alt={item.title || item.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                <span className="absolute top-2 right-2 badge badge-cyan text-[7px] font-black tracking-widest shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] py-0.5 px-2">
                  {item.mediaType}
                </span>

                <span className="absolute top-2 left-2 bg-[#FBBF24] border border-[#1E293B] text-[8px] font-black uppercase px-1 rounded shadow">
                  ⭐ Star
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div className="leading-tight">
                  <h4 className="font-display font-black text-xs uppercase text-[#1E293B] truncate">
                    {item.title || item.fileName}
                  </h4>
                  <p className="text-[8px] font-bold text-[#5C6F84] uppercase">
                    {new Date(item.mediaDate).toLocaleDateString()}
                  </p>
                </div>

                {item.story ? (
                  <p className="text-[9px] font-medium text-[#1E293B] line-clamp-2 bg-[#FAF3E0] p-1.5 rounded border border-[#CBD5E1] italic">
                    "{item.story}"
                  </p>
                ) : (
                  <span className="text-[8px] font-black text-[#EC4899] uppercase">No story context</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
