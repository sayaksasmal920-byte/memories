import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Upload, Calendar, Tag, AlertTriangle, ArrowLeft, Image, Video, Smile, Sparkles, Check, Link as LinkIcon } from "lucide-react";

export default function UploadMedia() {
  const { apiCall } = useAuth();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaType, setMediaType] = useState("photo"); // photo, video, sticker
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaDate, setMediaDate] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [collections, setCollections] = useState([]);
  
  // Media processing states
  const [suggestedDate, setSuggestedDate] = useState("");
  const [dateConfirmed, setDateConfirmed] = useState(false);
  const [videoThumbnailBlob, setVideoThumbnailBlob] = useState(null);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  
  // Similar items state
  const [similarItems, setSimilarItems] = useState([]);
  const [linkRelationId, setLinkRelationId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const videoRef = useRef(null);

  // Load collections list
  useEffect(() => {
    async function loadCollections() {
      try {
        const res = await apiCall("/api/collections");
        if (res.ok) {
          const data = await res.json();
          setCollections(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCollections();
  }, []);

  // Run on title change to suggest tags
  useEffect(() => {
    if (!title.trim()) {
      setTagSuggestions([]);
      return;
    }
    
    const words = title.toLowerCase().split(/\s+/);
    const suggestions = new Set();
    
    const rules = {
      college: ["college", "university", "campus", "farewell", "graduation", "degree", "class"],
      friends: ["friend", "friends", "squad", "trip", "group", "farewell", "party", "goa", "sunset"],
      farewell: ["farewell", "bye", "last day", "party"],
      nature: ["nature", "sunset", "beach", "sunrise", "mountain", "hills", "forest", "lake"],
      travel: ["travel", "trip", "goa", "vacation", "journey", "flight", "roadtrip"],
      food: ["food", "dinner", "lunch", "cafe", "restaurant", "eat", "coffee"],
      party: ["party", "celebration", "birthday", "cake", "dance", "night"],
    };

    for (const [tag, keywords] of Object.entries(rules)) {
      if (keywords.some(kw => words.some(w => w.includes(kw)))) {
        suggestions.add(tag);
      }
    }

    words.forEach(w => {
      const cleanWord = w.replace(/[^a-z0-9]/g, "");
      if (cleanWord.length > 4) suggestions.add(cleanWord);
    });

    // Filter out already added tags
    const filtered = Array.from(suggestions).filter(t => !tags.includes(t)).slice(0, 4);
    setTagSuggestions(filtered);
  }, [title, tags]);

  // Run when file selected to extract EXIF suggestions and generate video frame
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError("");
    setSuccess(false);

    // Auto set title based on filename
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    setTitle(cleanName);

    // Auto set media type
    let inferredType = "photo";
    if (file.type.startsWith("video/")) {
      inferredType = "video";
    } else if (file.name.endsWith(".webp") || file.name.endsWith(".zip")) {
      inferredType = "sticker";
    }
    setMediaType(inferredType);

    // Suggest date from file modification date
    const mDate = new Date(file.lastModified);
    const formatted = mDate.toISOString().split("T")[0];
    setSuggestedDate(formatted);
    setMediaDate(formatted);
    setDateConfirmed(false);

    // Clear video assets
    setVideoThumbnailBlob(null);
    setVideoThumbnailUrl("");

    // If it's a video, generate thumbnail frame using client-side canvas
    if (file.type.startsWith("video/")) {
      generateVideoThumbnail(file);
    }

    // Check similarity based on date & name
    checkSimilarMedia(formatted, cleanName);
  };

  // Extract video thumbnail using HTML5 Video + Canvas
  const generateVideoThumbnail = (file) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      // Seek to 1s to capture dynamic frame instead of black screen
      video.currentTime = 1;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          setVideoThumbnailBlob(blob);
          setVideoThumbnailUrl(URL.createObjectURL(blob));
        }, "image/jpeg", 0.7);
      } catch (err) {
        console.error("Canvas thumbnail extract error:", err);
      }
    };
  };

  // Query server to find similar uploads
  const checkSimilarMedia = async (dateStr, nameStr) => {
    try {
      const res = await apiCall(`/api/media/similar?mediaDate=${dateStr}&title=${encodeURIComponent(nameStr)}`);
      if (res.ok) {
        const data = await res.json();
        setSimilarItems(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a media file to upload.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("story", story);
      formData.append("mediaType", mediaType);
      formData.append("mediaDate", mediaDate);
      formData.append("collectionId", collectionId);
      formData.append("tags", JSON.stringify(tags));

      // Append generated video thumbnail file
      if (mediaType === "video" && videoThumbnailBlob) {
        formData.append("thumbnail", videoThumbnailBlob, "thumbnail.jpg");
      }

      const res = await apiCall("/api/media/upload", {
        method: "POST",
        body: formData,
        // Let fetch auto-set boundary headers for multi-part
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        const newMediaId = data.media._id || data.media.id || (Array.isArray(data.media) ? data.media[0]._id : null);
        
        // Link similar media if user selected one
        if (newMediaId && linkRelationId) {
          await apiCall(`/api/media/${newMediaId}/relate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ relatedId: linkRelationId }),
          });
        }

        setTimeout(() => {
          navigate(mediaType === "photo" ? "/photos" : mediaType === "video" ? "/videos" : "/stickers");
        }, 1500);
      } else {
        setError(data.error || "Failed to upload media.");
      }
    } catch (err) {
      console.error(err);
      setError("Network upload connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#1E293B]">
      {/* Return header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost p-2 rounded-full cursor-pointer shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <span className="font-display font-black text-xs uppercase text-[#5C6F84]">
          Back to gallery
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Upload Form Block */}
        <div className="lg:col-span-2 bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-6">
          <div className="flex items-center gap-3 border-b-2 border-[#1E293B] pb-2">
            <div className="w-8 h-8 rounded-full bg-[#8B5CF6] border-2 border-[#1E293B] flex items-center justify-center">
              <Upload size={14} color="white" strokeWidth={2.5} />
            </div>
            <h2 className="font-display font-black text-base uppercase text-[#1E293B]">
              Archive Memory Node
            </h2>
          </div>

          {error && (
            <div className="bg-[#F87171] bg-opacity-20 border-2 border-[#F87171] text-[#B91C1C] rounded-lg p-3 text-xs font-bold uppercase tracking-wider">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-[#34D399] bg-opacity-20 border-2 border-[#34D399] text-[#047857] rounded-lg p-4 text-center font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <Check size={20} strokeWidth={3} />
              Uploaded Successfully! Preserving vault...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File selection box */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-[#1E293B] block">
                Select File
              </label>
              <div className="border-3 border-dashed border-[#1E293B] rounded-xl bg-[#FAF3E0] p-8 text-center transition-all hover:bg-[#F3E9D2] relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  accept="image/*,video/*,.heic,.heif,.webp,.zip"
                />
                <Upload size={32} className="mx-auto text-[#1E293B] mb-2" />
                <p className="text-xs font-black uppercase text-[#1E293B]">
                  {selectedFile ? selectedFile.name : "Drag & drop or browse local storage"}
                </p>
                <p className="text-[10px] font-semibold text-[#5C6F84] uppercase mt-1">
                  Supports Photos, HEIC (iPhone), MP4, WebP, and ZIP Sticker Packs
                </p>
              </div>
            </div>

            {/* Media details config */}
            {selectedFile && (
              <div className="space-y-6 animate-fade-in">
                {/* Media Type Selector */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "photo", name: "Photo", icon: Image, color: "var(--color-primary)" },
                    { id: "video", name: "Video", icon: Video, color: "var(--color-secondary)" },
                    { id: "sticker", name: "Sticker", icon: Smile, color: "var(--color-success)" }
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMediaType(item.id)}
                        className={`flex flex-col items-center justify-center p-3 border-2 border-[#1E293B] rounded-lg font-display font-black text-xs uppercase shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)] transition-all cursor-pointer ${
                          mediaType === item.id 
                            ? "bg-[#FFFDF9] -translate-y-[2px]" 
                            : "bg-[#FAF3E0] hover:bg-[#FFFDF9]"
                        }`}
                        style={{ borderLeftColor: mediaType === item.id ? item.color : "var(--border)" }}
                      >
                        <Icon size={16} strokeWidth={2.5} className="mb-1" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>

                {/* Exif Suggester Block */}
                {suggestedDate && (
                  <div className="bg-[#FFFDF9] border-2 border-[#1E293B] rounded-lg p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-[#8B5CF6] shrink-0" size={18} strokeWidth={2.5} />
                      <div className="leading-tight">
                        <div className="text-[9px] font-black text-[#5C6F84] uppercase">Suggested Media date (EXIF)</div>
                        <div className="text-sm font-black text-[#1E293B]">{new Date(suggestedDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaDate(suggestedDate);
                        setDateConfirmed(true);
                      }}
                      className={`btn-ghost text-[9px] uppercase py-1 px-3 ${dateConfirmed ? "bg-[#34D399]" : ""}`}
                    >
                      {dateConfirmed ? "✓ Date Confirmed" : "Confirm Suggested Date"}
                    </button>
                  </div>
                )}

                {/* Input Fields */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-[#1E293B] block">Title</label>
                    <input
                      type="text"
                      placeholder="Goa Sunset with Friends"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input-field font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-[#1E293B] block">Media Date</label>
                      <input
                        type="date"
                        value={mediaDate}
                        onChange={(e) => setMediaDate(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-[#1E293B] block">Collection (Life Event)</label>
                      <select
                        value={collectionId}
                        onChange={(e) => setCollectionId(e.target.value)}
                        className="input-field bg-white border-2"
                      >
                        <option value="">-- No Collection --</option>
                        {collections.map(c => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Smart Tag Suggestions */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-[#1E293B] block">Tags</label>
                    <div className="tag-input-container">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="tag-chip">
                          #{tag}
                          <button type="button" onClick={() => removeTag(idx)} className="text-xs font-black">
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Type & press Enter"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(tagInput);
                            setTagInput("");
                          }
                        }}
                        className="bg-transparent border-0 outline-none flex-1 py-1 text-xs"
                      />
                    </div>

                    {tagSuggestions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[9px] font-black uppercase text-[#5C6F84]">Suggestions:</span>
                        {tagSuggestions.map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => addTag(sugg)}
                            className="bg-[#C4B5FD] bg-opacity-30 border border-[#8B5CF6] hover:bg-[#C4B5FD] text-[#8B5CF6] text-[9px] font-bold py-0.5 px-2 rounded-full cursor-pointer transition-all"
                          >
                            + #{sugg}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-[#1E293B] block flex items-center gap-1.5">
                      Memory Story <span className="text-[10px] font-bold text-[#EC4899] normal-case">(Preserves context)</span>
                    </label>
                    <textarea
                      placeholder="Write down the details, emotions, or funny statements from this moment..."
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      className="input-field min-h-24 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3.5 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] cursor-pointer text-xs uppercase"
                >
                  {loading ? "Uploading..." : "Save Memory Archive"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Media Preview & Metadata Extraction Drawer */}
        <div className="space-y-6">
          <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)]">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#1E293B] mb-4 border-b-2 border-[#1E293B] pb-2 flex items-center gap-2">
              <Sparkles size={16} color="var(--color-secondary)" strokeWidth={2.5} />
              Vault Analysis
            </h3>

            {selectedFile ? (
              <div className="space-y-4">
                {/* Media visual display */}
                <div className="aspect-video bg-[#FAF3E0] border-2 border-[#1E293B] rounded-lg overflow-hidden flex items-center justify-center relative shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                  {mediaType === "photo" && (
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="upload preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {mediaType === "video" && videoThumbnailUrl && (
                    <div className="w-full h-full relative">
                      <img
                        src={videoThumbnailUrl}
                        alt="video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 right-2 badge badge-success text-[7px] font-black uppercase text-white py-0.5 shadow">
                        Auto cover generated
                      </span>
                    </div>
                  )}
                  {mediaType === "sticker" && (
                    <img
                      src={selectedFile.name.endsWith(".zip") ? "https://images.unsplash.com/photo-1595231712426-63e48a301e0a?w=200&fit=crop" : URL.createObjectURL(selectedFile)}
                      alt="sticker preview"
                      className="max-h-[90%] max-w-[90%] object-contain"
                    />
                  )}
                </div>

                <div className="divide-y divide-[#CBD5E1] text-[10px] font-bold text-[#5C6F84] uppercase">
                  <div className="py-2 flex justify-between">
                    <span>File size:</span>
                    <span className="text-[#1E293B] font-extrabold">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span>MIME Type:</span>
                    <span className="text-[#1E293B] font-extrabold">{selectedFile.type || "application/octet-stream"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-[#CBD5E1] bg-[#FAF3E0] rounded-lg text-xs font-bold text-[#5C6F84] uppercase">
                Select a file to inspect metadata and properties.
              </div>
            )}
          </div>

          {/* Similar upload connector alert drawer */}
          {selectedFile && similarItems.length > 0 && (
            <div className="bg-[#FAF3E0] border-3 border-[#FBBF24] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(251,191,36,1)] space-y-4 animate-fade-in">
              <h4 className="font-display font-black text-sm uppercase text-[#1E293B] flex items-center gap-1.5">
                <AlertTriangle size={18} className="text-[#FBBF24] shrink-0" strokeWidth={2.5} />
                Similar Memories Found
              </h4>
              <p className="text-[10px] font-semibold text-[#5C6F84] leading-relaxed uppercase">
                We detected other files from the same timeframe or title. Link this memory as related to build connected relationships?
              </p>

              <div className="space-y-2">
                {similarItems.map(item => (
                  <button
                    key={item._id || item.id}
                    type="button"
                    onClick={() => setLinkRelationId(item._id || item.id)}
                    className={`w-full text-left p-2 border-2 rounded flex items-center gap-2 transition-all text-xs font-black cursor-pointer shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)] ${
                      linkRelationId === (item._id || item.id)
                        ? "bg-[#34D399] border-[#1E293B]"
                        : "bg-white border-[#1E293B] hover:bg-[#FAF3E0]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded bg-[#E2E8F0] overflow-hidden shrink-0 border">
                      <img
                        src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                        alt={item.title || item.fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate flex-1">
                      <div className="truncate">{item.title || item.fileName}</div>
                      <div className="text-[8px] font-bold text-[#5C6F84] uppercase flex items-center gap-1">
                        <LinkIcon size={8} /> Link Related
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
