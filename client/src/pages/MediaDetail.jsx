import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Heart, Trash2, Edit2, Check, ArrowLeft, MessageSquare, Tag, PlusCircle, Link as LinkIcon, Eye, Calendar, Sparkles } from "lucide-react";

export default function MediaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiCall } = useAuth();

  const [media, setMedia] = useState(null);
  const [comments, setComments] = useState([]);
  const [allMedia, setAllMedia] = useState([]); // Loaded to resolve relations details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editStory, setEditStory] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCollectionId, setEditCollectionId] = useState("");
  const [collections, setCollections] = useState([]);

  // Comment state
  const [commentText, setCommentText] = useState("");

  // Add Relation state
  const [relationSelectId, setRelationSelectId] = useState("");

  useEffect(() => {
    loadMediaDetail();
    loadCollections();
    loadAllMedia();
  }, [id]);

  const loadMediaDetail = async () => {
    try {
      const res = await apiCall(`/api/media/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media);
        setComments(data.comments);
        
        // Populate edit defaults
        setEditTitle(data.media.title || "");
        setEditStory(data.media.story || "");
        setEditTags(data.media.tags || []);
        setEditDate(data.media.mediaDate ? data.media.mediaDate.split("T")[0] : "");
        setEditCollectionId(data.media.collectionId || "");
      } else {
        setError("Could not load media file.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error loading details.");
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const res = await apiCall("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllMedia = async () => {
    try {
      const res = await apiCall("/api/media");
      if (res.ok) {
        const data = await res.json();
        setAllMedia(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      const res = await apiCall(`/api/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !media.favorite }),
      });
      if (res.ok) {
        setMedia(prev => ({ ...prev, favorite: !prev.favorite }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveJournal = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall(`/api/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          story: editStory,
          tags: editTags,
          mediaDate: editDate,
          collectionId: editCollectionId || "null",
        }),
      });

      if (res.ok) {
        setMedia(prev => ({
          ...prev,
          title: editTitle,
          story: editStory,
          tags: editTags,
          mediaDate: editDate,
          collectionId: editCollectionId || null,
        }));
        setIsEditing(false);
      } else {
        alert("Failed to save journal edits.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await apiCall("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: id, text: commentText }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments([...comments, newComment]);
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await apiCall(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId && c.id !== commentId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRelation = async (e) => {
    e.preventDefault();
    if (!relationSelectId) return;

    try {
      const res = await apiCall(`/api/media/${id}/relate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relatedId: relationSelectId }),
      });
      if (res.ok) {
        // Append to local media relationships list
        const updatedRels = [...(media.relationships || []), relationSelectId];
        setMedia(prev => ({ ...prev, relationships: updatedRels }));
        setRelationSelectId("");
        loadAllMedia(); // Refresh list mapping
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMedia = async () => {
    if (!window.confirm("CAUTION: This will delete this memory node permanently from disk storage. Proceed?")) return;
    try {
      const res = await apiCall(`/api/media/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean && !editTags.includes(clean)) {
      setEditTags([...editTags, clean]);
    }
  };

  const removeTag = (idx) => {
    setEditTags(editTags.filter((_, i) => i !== idx));
  };

  // Resolve relation entities
  const getRelatedMediaItems = () => {
    if (!media || !media.relationships) return [];
    return allMedia.filter(item => 
      media.relationships.includes(item._id) || media.relationships.includes(item.id)
    );
  };

  // Get other media available to link (not already related and not this file)
  const getAvailableToRelate = () => {
    return allMedia.filter(item => 
      item._id !== id && 
      item.id !== id && 
      !media?.relationships?.includes(item._id) && 
      !media?.relationships?.includes(item.id)
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 skeleton"></div>
        <div className="h-32 skeleton"></div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-8 text-center max-w-md mx-auto shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]">
        <div className="text-xl font-black text-[#F87171] uppercase mb-4">Error</div>
        <p className="text-xs font-bold text-[#5C6F84] uppercase mb-6">{error || "Memory not found."}</p>
        <button onClick={() => navigate("/dashboard")} className="btn-primary text-xs uppercase">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const relatedItems = getRelatedMediaItems();
  const availableToRelate = getAvailableToRelate();
  const currentCollection = collections.find(c => c._id === media.collectionId || c.id === media.collectionId);

  return (
    <div className="space-y-8 animate-fade-in text-[#1E293B]">
      {/* Return & Action header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost p-2 rounded-full cursor-pointer shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
          <span className="font-display font-black text-xs uppercase text-[#5C6F84]">
            Back to Timeline
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite Toggle button */}
          <button
            onClick={handleFavoriteToggle}
            className={`btn-ghost flex items-center gap-1.5 text-xs uppercase py-2 px-4 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer ${
              media.favorite ? "bg-[#FBBF24]" : ""
            }`}
          >
            <Heart size={14} fill={media.favorite ? "#1E293B" : "none"} strokeWidth={2.5} />
            {media.favorite ? "Favorited" : "Star Memory"}
          </button>

          {/* Delete button */}
          <button
            onClick={handleDeleteMedia}
            className="btn-primary bg-[#F87171] hover:bg-[#EF4444] text-white flex items-center gap-1.5 text-xs uppercase py-2 px-4 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
          >
            <Trash2 size={14} strokeWidth={2.5} />
            Delete
          </button>
        </div>
      </div>

      {/* Main File Frame Block */}
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
        <div className="aspect-video bg-[#FAF3E0] border-2 border-[#1E293B] rounded-lg overflow-hidden flex items-center justify-center relative shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
          {/* Photos */}
          {media.mediaType === "photo" && (
            <img
              src={media.fileUrl}
              alt={media.title || media.fileName}
              className="w-full h-full object-contain"
            />
          )}

          {/* Videos */}
          {media.mediaType === "video" && (
            <video
              src={media.fileUrl}
              controls
              className="w-full h-full object-contain"
              poster={media.thumbnailUrl}
            />
          )}

          {/* Stickers */}
          {media.mediaType === "sticker" && (
            <img
              src={media.fileUrl}
              alt={media.title || media.fileName}
              className="max-h-[90%] max-w-[90%] object-contain"
            />
          )}

          {/* Floaters views overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="badge badge-warning text-[8px] font-black tracking-widest shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] py-0.5 px-2">
              {media.mediaType}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Memory Journal Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
            <div className="flex items-center justify-between border-b-2 border-[#1E293B] pb-2 mb-4">
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
                <Sparkles size={16} color="var(--color-primary)" strokeWidth={2.5} />
                Memory Journal
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-ghost flex items-center gap-1.5 text-[10px] uppercase py-1 px-3 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
                >
                  <Edit2 size={10} /> Edit Journal
                </button>
              )}
            </div>

            {/* Read/Render Mode */}
            {!isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="font-display font-black text-2xl uppercase tracking-tight text-[#1E293B]">
                    {media.title || media.fileName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#5C6F84]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {new Date(media.mediaDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Story narrative */}
                <div className="bg-[#FAF3E0] border-2 border-[#1E293B] rounded-lg p-4 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                  <div className="text-[9px] font-black text-[#5C6F84] uppercase mb-2">The Story Behind the Memory:</div>
                  {media.story ? (
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap italic">
                      "{media.story}"
                    </p>
                  ) : (
                    <p className="text-xs font-black uppercase text-[#EC4899] py-2">
                      ⚠️ No story context added. This memory lacks depth! Click "Edit Journal" above to describe this moment.
                    </p>
                  )}
                </div>

                {/* Tags chip row */}
                {media.tags && media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-black text-[#5C6F84] uppercase">Tags:</span>
                    {media.tags.map(tag => (
                      <span key={tag} className="tag-chip text-[10px] font-black">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Editing Form Mode */
              <form onSubmit={handleSaveJournal} className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase block">Memory Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input-field font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase block">Media Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                {/* Tags editor */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase block">Tags</label>
                  <div className="tag-input-container">
                    {editTags.map((tag, idx) => (
                      <span key={idx} className="tag-chip">
                        #{tag}
                        <button type="button" onClick={() => removeTag(idx)} className="text-xs font-black">
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Press enter to add"
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(editTagInput);
                          setEditTagInput("");
                        }
                      }}
                      className="bg-transparent border-0 outline-none flex-1 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase block">The Story</label>
                  <textarea
                    value={editStory}
                    onChange={(e) => setEditStory(e.target.value)}
                    className="input-field min-h-24 resize-none leading-relaxed"
                    placeholder="Describe this moment in detail..."
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-ghost text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs uppercase shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
                  >
                    Save Memory
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Comment System Card */}
          <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-4">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#1E293B] border-b-2 border-[#1E293B] pb-2 flex items-center gap-2">
              <MessageSquare size={16} color="var(--color-secondary)" strokeWidth={2.5} />
              Comments / Remarks ({comments.length})
            </h3>

            {/* List current comments */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <div className="text-center py-4 text-[10px] font-bold text-[#5C6F84] uppercase">
                  No comments logged. Add a remark below!
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id || comment.id}
                    className="bg-[#FAF3E0] border-2 border-[#1E293B] rounded p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-[#1E293B] leading-relaxed">
                        {comment.text}
                      </p>
                      <span className="text-[8px] font-bold text-[#5C6F84] uppercase block">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment._id || comment.id)}
                      className="text-[#5C6F84] hover:text-[#F87171] p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Write comment form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write an archived comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="input-field text-xs py-2"
                required
              />
              <button
                type="submit"
                className="btn-primary text-xs uppercase shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer shrink-0 py-2"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Media Relationships / Collections sidebar */}
        <div className="space-y-6">
          {/* Related items list */}
          <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-4">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#1E293B] border-b-2 border-[#1E293B] pb-2 flex items-center gap-2">
              <LinkIcon size={16} color="var(--color-accent)" strokeWidth={2.5} />
              Related Memories ({relatedItems.length})
            </h3>

            <div className="space-y-2">
              {relatedItems.length === 0 ? (
                <div className="text-center py-4 text-[10px] font-bold text-[#5C6F84] uppercase">
                  No related connections mapped.
                </div>
              ) : (
                relatedItems.map(item => (
                  <Link
                    key={item._id || item.id}
                    to={`/media/${item._id || item.id}`}
                    className="flex items-center gap-2 p-2 bg-[#FFFDF9] border-2 border-[#1E293B] rounded hover:border-[#8B5CF6] hover:bg-[#FAF3E0] transition-all text-xs font-bold text-[#1E293B] no-underline shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                  >
                    <div className="w-10 h-10 rounded border bg-[#FAF3E0] overflow-hidden shrink-0">
                      <img
                        src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate flex-1">
                      <div className="truncate leading-tight">{item.title || item.fileName}</div>
                      <span className="text-[8px] font-black text-[#5C6F84] uppercase">
                        {item.mediaType} • {new Date(item.mediaDate).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Link another media dropdown form */}
            {availableToRelate.length > 0 && (
              <form onSubmit={handleAddRelation} className="pt-2 border-t-2 border-dashed border-[#CBD5E1] space-y-2">
                <span className="text-[10px] font-black text-[#5C6F84] uppercase block">
                  Link Related Memory:
                </span>
                <div className="flex gap-2">
                  <select
                    value={relationSelectId}
                    onChange={(e) => setRelationSelectId(e.target.value)}
                    className="input-field text-xs bg-white border-2 py-1.5 flex-1"
                  >
                    <option value="">-- Choose Memory --</option>
                    {availableToRelate.map(item => (
                      <option key={item._id || item.id} value={item._id || item.id}>
                        {item.title || item.fileName} ({item.mediaType})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="btn-secondary text-[10px] uppercase shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] py-1.5 cursor-pointer shrink-0"
                  >
                    Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Memory Filmstrip Carousel */}
      {allMedia.length > 0 && (
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-4">
          <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#1E293B] border-b-2 border-[#1E293B] pb-2 flex items-center gap-2">
            <Sparkles size={16} color="var(--color-primary)" strokeWidth={2.5} />
            Memory Filmstrip // Explore Vault
          </h3>
          
          <div className="flex overflow-x-auto gap-4 py-2 pb-4 scrollbar-thin">
            {allMedia.map(item => {
              const isCurrent = item._id === id || item.id === id;
              return (
                <Link
                  key={item._id || item.id}
                  to={`/media/${item._id || item.id}`}
                  className={`w-28 flex-shrink-0 bg-[#FFFDF9] border-2 border-[#1E293B] rounded-lg overflow-hidden shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] transition-all ${
                    isCurrent 
                      ? "ring-3 ring-[#8B5CF6] border-[#8B5CF6] scale-98 shadow-[1px_1px_0px_0px_rgba(139,92,246,1)]" 
                      : "hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(244,114,182,1)]"
                  }`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="h-20 bg-[#FAF3E0] border-b-2 border-[#1E293B] overflow-hidden relative">
                    <img
                      src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-[6px] font-black uppercase px-1 rounded">
                      {item.mediaType}
                    </span>
                  </div>
                  <div className="p-1.5 text-center">
                    <p className="text-[9px] font-black text-[#1E293B] truncate uppercase">
                      {item.title || item.fileName}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
