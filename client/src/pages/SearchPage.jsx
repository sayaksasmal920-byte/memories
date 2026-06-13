import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Search, Image, Film, Smile, Eye, ArrowRight } from "lucide-react";

export default function SearchPage() {
  const { apiCall } = useAuth();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await apiCall(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#1E293B]">
      {/* Search Header Panel */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
        <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight mb-4 flex items-center gap-2">
          🔍 Search Archive Vault
        </h2>
        
        {/* Search Input bar */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Search filenames, titles, stories, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field py-3 font-bold"
            required
            autoFocus
          />
          <button
            type="submit"
            className="btn-primary py-3 px-6 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] cursor-pointer text-xs shrink-0"
          >
            Search Logs
          </button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-48 skeleton"></div>
        </div>
      ) : searched ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-[#5C6F84] whitespace-nowrap bg-[#FFFDF9] border-2 border-[#1E293B] px-3 py-1 rounded shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
              Search Results ({results.length})
            </h3>
            <div className="flex-1 border-t-3 border-[#1E293B]"></div>
          </div>

          {results.length === 0 ? (
            <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
              <p className="text-sm font-black uppercase text-[#5C6F84]">No matching memories found.</p>
              <p className="text-[10px] font-semibold text-[#5C6F84] uppercase mt-1">Try querying different keywords or tags (e.g. goa, friends, beach)</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map(item => (
                <Link
                  key={item._id || item.id}
                  to={`/media/${item._id || item.id}`}
                  className="group flex flex-col bg-[#FFFDF9] border-2 border-[#1E293B] rounded-lg shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(139,92,246,1)] no-underline transition-all overflow-hidden"
                >
                  <div className="h-40 bg-[#FAF3E0] border-b-2 border-[#1E293B] overflow-hidden relative">
                    <img
                      src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                      alt={item.title || item.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    <span className="absolute top-2 right-2 badge badge-warning text-[7px] font-black tracking-widest shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] py-0.5 px-2">
                      {item.mediaType}
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

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[8px] font-bold bg-[#FAF3E0] border border-[#CBD5E1] px-1 rounded text-[#5C6F84]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
          <p className="text-xs font-black uppercase text-[#5C6F84]">
            Type keywords above to find photos, videos, or stickers by title, story logs, or tags.
          </p>
        </div>
      )}
    </div>
  );
}
