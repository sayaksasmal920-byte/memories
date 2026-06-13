import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FolderHeart, PlusCircle, Trash2, ChevronDown, ChevronUp, Image, Film, Smile, Sparkles } from "lucide-react";

export default function Collections() {
  const { apiCall } = useAuth();
  const [collections, setCollections] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Creation form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Expanded collection subgrid state
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const collRes = await apiCall("/api/collections");
      const mediaRes = await apiCall("/api/media");

      if (collRes.ok && mediaRes.ok) {
        setCollections(await collRes.json());
        setMediaList(await mediaRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const res = await apiCall("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (res.ok) {
        const newColl = await res.json();
        setCollections([...collections, newColl]);
        setName("");
        setDescription("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (id, e) => {
    e.stopPropagation(); // Avoid expanding card on delete click
    if (!window.confirm("CAUTION: Deleting this collection group will detach all its files. The files themselves will NOT be deleted. Proceed?")) return;

    try {
      const res = await apiCall(`/api/collections/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCollections(collections.filter(c => c._id !== id && c.id !== id));
        // Reset detached media links locally
        setMediaList(mediaList.map(item => 
          item.collectionId === id ? { ...item, collectionId: null } : item
        ));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get media belonging to a specific collection
  const getCollectionMedia = (collId) => {
    return mediaList.filter(item => item.collectionId === collId);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 skeleton"></div>
        <div className="h-48 skeleton"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#1E293B]">
      {/* Header Panel */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EC4899] border-2 border-[#1E293B] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]">
            <FolderHeart size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight">
              Life Events
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[#5C6F84]">
              Collection folders • {collections.length} groups
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Create Collection Card */}
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-4">
          <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#1E293B] border-b-2 border-[#1E293B] pb-2 flex items-center gap-2">
            <PlusCircle size={16} strokeWidth={2.5} />
            New Life Collection
          </h3>

          <form onSubmit={handleCreateCollection} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase block">Collection Name</label>
              <input
                type="text"
                placeholder="e.g. Trip to Goa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase block">Description</label>
              <textarea
                placeholder="e.g. Goa trip after our final exams, sunset watch, beaches..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-20 resize-none leading-relaxed text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full btn-secondary text-xs uppercase shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] py-3 cursor-pointer"
            >
              {creating ? "Creating..." : "Build Event Folder"}
            </button>
          </form>
        </div>

        {/* Collections list list */}
        <div className="lg:col-span-2 space-y-6">
          {collections.length === 0 ? (
            <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-12 text-center shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
              <FolderHeart size={48} className="mx-auto text-[#94A3B8] mb-4" />
              <h3 className="font-display font-black text-base uppercase text-[#1E293B] mb-2">No event folders</h3>
              <p className="text-xs font-bold text-[#5C6F84] uppercase">Create a collection using the sidebar model to group your archive</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collections.map(coll => {
                const cid = coll._id || coll.id;
                const items = getCollectionMedia(cid);
                const isExpanded = expandedId === cid;

                // Segment types
                const photoCount = items.filter(i => i.mediaType === "photo").length;
                const videoCount = items.filter(i => i.mediaType === "video").length;
                const stickerCount = items.filter(i => i.mediaType === "sticker").length;

                return (
                  <div
                    key={cid}
                    className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] hover:shadow-[6px_6px_0px_0px_rgba(236,72,153,1)] transition-all"
                  >
                    {/* Folder Header */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : cid)}
                      className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF3E0]"
                    >
                      <div className="space-y-1">
                        <h4 className="font-display font-black text-base uppercase text-[#1E293B] flex items-center gap-2">
                          📁 {coll.name}
                        </h4>
                        {coll.description && (
                          <p className="text-xs text-[#5C6F84] font-medium leading-relaxed max-w-lg">
                            {coll.description}
                          </p>
                        )}
                        
                        {/* Meta Segment labels */}
                        <div className="flex flex-wrap gap-2 pt-2 text-[8px] font-black uppercase text-[#5C6F84]">
                          <span className="flex items-center gap-1 bg-[#FAF3E0] px-1.5 py-0.5 rounded border">
                            <Image size={8} /> {photoCount} photos
                          </span>
                          <span className="flex items-center gap-1 bg-[#FAF3E0] px-1.5 py-0.5 rounded border">
                            <Film size={8} /> {videoCount} videos
                          </span>
                          <span className="flex items-center gap-1 bg-[#FAF3E0] px-1.5 py-0.5 rounded border">
                            <Smile size={8} /> {stickerCount} stickers
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDeleteCollection(cid, e)}
                          className="btn-ghost p-2 hover:bg-[#F87171] hover:text-white border-2 border-transparent hover:border-[#1E293B] rounded shadow-[1.5px_1.5px_0px_0px_transparent] hover:shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
                          title="Delete Collection Group"
                        >
                          <Trash2 size={12} />
                        </button>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>

                    {/* Expanded Folder Subgrid Drawer */}
                    {isExpanded && (
                      <div className="bg-[#FAF3E0] border-t-3 border-[#1E293B] p-5 animate-fade-in">
                        {items.length === 0 ? (
                          <div className="text-center py-6 text-xs font-bold text-[#5C6F84] uppercase">
                            No files linked to this event. Relate them in detail view!
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {items.map(item => (
                              <Link
                                key={item._id || item.id}
                                to={`/media/${item._id || item.id}`}
                                className="aspect-square border-2 border-[#1E293B] bg-white rounded overflow-hidden shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] hover:scale-105 transition-all block relative"
                              >
                                <img
                                  src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-1 right-1 badge badge-primary text-[6px] py-0 px-1 border shadow-[0.5px_0.5px_0px_0px_rgba(30,41,59,1)] font-black uppercase">
                                  {item.mediaType}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
