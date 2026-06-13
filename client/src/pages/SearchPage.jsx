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
    <div className="space-y-8 animate-fade-in text-[var(--text-primary)]">
      {/* Search Header Panel */}
      <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-6 shadow-[5px_5px_0px_0px_var(--shadow-color)]">
        <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight mb-4 flex items-center gap-2">
          🔍 Search Our Memories
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
            className="btn-primary py-3 px-6 shadow-[3px_3px_0px_0px_var(--shadow-color)] cursor-pointer text-xs shrink-0"
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
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-[var(--text-secondary)] whitespace-nowrap bg-[var(--bg-card)] border-2 border-[var(--border)] px-3 py-1 rounded shadow-[2px_2px_0px_0px_var(--shadow-color)]">
              Search Results ({results.length})
            </h3>
            <div className="flex-1 border-t-3 border-[var(--border)]"></div>
          </div>

          {results.length === 0 ? (
            <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_var(--shadow-color)]">
              <p className="text-sm font-black uppercase text-[var(--text-secondary)]">No matching memories found.</p>
              <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase mt-1">Try querying different keywords or tags (e.g. goa, friends, beach)</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map(item => (
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
                    
                    <span className="absolute top-2 right-2 badge badge-warning text-[7px] font-black tracking-widest shadow-[1px_1px_0px_0px_var(--shadow-color)] py-0.5 px-2">
                      {item.mediaType}
                    </span>
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

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[8px] font-bold bg-[var(--bg-primary)] border border-[var(--border)] px-1 rounded text-[var(--text-secondary)]">
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
        <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_var(--shadow-color)]">
          <p className="text-xs font-black uppercase text-[var(--text-secondary)]">
            Type keywords above to find photos or videos by title, story logs, or tags.
          </p>
        </div>
      )}
    </div>
  );
}
