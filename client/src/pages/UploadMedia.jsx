import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Upload, Calendar, Tag, AlertTriangle, ArrowLeft,
  Image, Video, Smile, Check, X, FileImage,
  Loader2, ChevronDown, ChevronUp, Trash2, Plus
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanFileName(name) {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
}

function isHeic(file) {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

function isVideo(file) {
  return file.type.startsWith("video/");
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Generate a video thumbnail blob via canvas
function generateVideoThumb(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => { video.currentTime = 1; };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
      } catch { resolve(null); }
    };
    video.onerror = () => resolve(null);
  });
}

// Status badge component
function StatusBadge({ status }) {
  if (status === "done")
    return (
      <span className="flex items-center gap-1 text-[#047857] bg-[#D1FAE5] border border-[#6EE7B7] rounded-full px-2 py-0.5 text-[9px] font-black uppercase">
        <Check size={9} /> Done
      </span>
    );
  if (status === "uploading")
    return (
      <span className="flex items-center gap-1 text-[#8B5CF6] bg-[#EDE9FE] border border-[#C4B5FD] rounded-full px-2 py-0.5 text-[9px] font-black uppercase animate-pulse">
        <Loader2 size={9} className="animate-spin" /> Uploading
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1 text-[#B91C1C] bg-[#FEE2E2] border border-[#FCA5A5] rounded-full px-2 py-0.5 text-[9px] font-black uppercase">
        <AlertTriangle size={9} /> Failed
      </span>
    );
  return (
    <span className="text-[#5C6F84] bg-[#F1F5F9] border border-[#CBD5E1] rounded-full px-2 py-0.5 text-[9px] font-black uppercase">
      Pending
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UploadMedia() {
  const { apiCall } = useAuth();
  const navigate = useNavigate();

  // ── File queue state ──────────────────────────────────────────────────────
  // Each entry: { file, title, previewUrl, thumbBlob, status, error }
  const [queue, setQueue] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);

  // ── Shared metadata ───────────────────────────────────────────────────────
  const [mediaType, setMediaType] = useState("photo");
  const [sharedDate, setSharedDate] = useState("");
  const [sharedStory, setSharedStory] = useState("");
  const [sharedTags, setSharedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [collections, setCollections] = useState([]);

  // ── Upload state ──────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const fileInputRef = useRef(null);

  // Load collections
  useEffect(() => {
    apiCall("/api/collections").then(async (res) => {
      if (res.ok) setCollections(await res.json());
    }).catch(() => {});
  }, []);

  // ── File picker handler ───────────────────────────────────────────────────
  const handleFilePick = async (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    e.target.value = ""; // reset so same files can be re-added

    // Today's date as default
    const today = new Date().toISOString().split("T")[0];
    if (!sharedDate) setSharedDate(today);

    const newItems = await Promise.all(
      picked.map(async (file) => {
        let previewUrl = null;
        let thumbBlob = null;

        if (isVideo(file)) {
          thumbBlob = await generateVideoThumb(file);
          if (thumbBlob) previewUrl = URL.createObjectURL(thumbBlob);
          if (!mediaType) setMediaType("video");
        } else if (!isHeic(file)) {
          previewUrl = URL.createObjectURL(file);
        }

        return {
          file,
          title: cleanFileName(file.name),
          previewUrl,
          thumbBlob,
          status: "pending", // pending | uploading | done | error
          error: "",
        };
      })
    );

    setQueue((prev) => [...prev, ...newItems]);
    setUploadDone(false);
    setGlobalError("");
  };

  const removeFile = (idx) => {
    setQueue((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateTitle = (idx, val) => {
    setQueue((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, title: val } : item))
    );
  };

  // ── Tag helpers ───────────────────────────────────────────────────────────
  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean && !sharedTags.includes(clean))
      setSharedTags((prev) => [...prev, clean]);
  };
  const removeTag = (i) => setSharedTags((prev) => prev.filter((_, idx) => idx !== i));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!queue.length) {
      setGlobalError("Please select at least one file.");
      return;
    }
    if (!sharedDate) {
      setGlobalError("Please set a media date.");
      return;
    }

    setUploading(true);
    setGlobalError("");
    setUploadDone(false);

    // Reset all to pending
    setQueue((prev) => prev.map((item) => ({ ...item, status: "pending", error: "" })));

    let hasError = false;

    for (let i = 0; i < queue.length; i++) {
      // Mark current as uploading
      setQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item))
      );

      const { file, title, thumbBlob } = queue[i];

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title || cleanFileName(file.name));
        formData.append("story", sharedStory);
        formData.append("mediaType", mediaType);
        formData.append("mediaDate", sharedDate);
        formData.append("collectionId", collectionId);
        formData.append("tags", JSON.stringify(sharedTags));

        if (mediaType === "video" && thumbBlob) {
          formData.append("thumbnail", thumbBlob, "thumbnail.jpg");
        }

        const res = await apiCall("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          setQueue((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, status: "done" } : item))
          );
        } else {
          const data = await res.json();
          setQueue((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? { ...item, status: "error", error: data.error || "Upload failed" }
                : item
            )
          );
          hasError = true;
        }
      } catch (err) {
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "error", error: "Network error" } : item
          )
        );
        hasError = true;
      }
    }

    setUploading(false);
    setUploadDone(true);
    if (hasError) setGlobalError("Some files failed to upload. Check individual status.");
  };

  const doneCount = queue.filter((f) => f.status === "done").length;
  const allDone = queue.length > 0 && queue.every((f) => f.status === "done");

  return (
    <div className="space-y-6 animate-fade-in text-[#1E293B]">
      {/* Header */}
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: File queue + shared metadata ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Upload zone */}
          <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-[#1E293B] pb-3">
              <div className="w-8 h-8 rounded-full bg-[#8B5CF6] border-2 border-[#1E293B] flex items-center justify-center">
                <Upload size={14} color="white" strokeWidth={2.5} />
              </div>
              <h2 className="font-display font-black text-base uppercase">
                Archive Memory Node
              </h2>
            </div>

            {/* Drop zone */}
            <div
              className="border-3 border-dashed border-[#1E293B] rounded-xl bg-[#FAF3E0] p-8 text-center transition-all hover:bg-[#F3E9D2] relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFilePick}
                disabled={uploading}
                className="hidden"
                accept="image/*,video/*,.heic,.heif,.webp,.zip"
              />
              <Plus size={28} className="mx-auto text-[#1E293B] mb-2" />
              <p className="text-xs font-black uppercase text-[#1E293B]">
                Click to select files
              </p>
              <p className="text-[10px] font-semibold text-[#5C6F84] uppercase mt-1">
                Multiple files supported · Photos, HEIC (iPhone), MP4, WebP, ZIP
              </p>
            </div>

            {globalError && (
              <div className="bg-[#F87171] bg-opacity-20 border-2 border-[#F87171] text-[#B91C1C] rounded-lg p-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={14} /> {globalError}
              </div>
            )}

            {allDone && (
              <div className="bg-[#10B981] bg-opacity-10 border-2 border-[#10B981] text-[#047857] rounded-lg p-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Check size={14} /> All {queue.length} file{queue.length > 1 ? "s" : ""} uploaded successfully!
              </div>
            )}
          </div>

          {/* File queue list */}
          {queue.length > 0 && (
            <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#1E293B] bg-[#FAF3E0]">
                <span className="font-display font-black text-xs uppercase">
                  Selected Files ({queue.length})
                </span>
                {uploading && (
                  <span className="text-[10px] font-black uppercase text-[#8B5CF6] animate-pulse">
                    {doneCount}/{queue.length} uploaded…
                  </span>
                )}
              </div>

              <div className="divide-y-2 divide-[#F1F5F9]">
                {queue.map((item, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg border-2 border-[#1E293B] overflow-hidden bg-[#FAF3E0] shrink-0 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileImage size={18} className="text-[#5C6F84]" />
                        )}
                      </div>

                      {/* Title + info */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateTitle(idx, e.target.value)}
                          disabled={uploading}
                          className="w-full bg-transparent border-0 outline-none text-xs font-black text-[#1E293B] truncate focus:bg-[#FAF3E0] focus:px-2 focus:py-0.5 focus:rounded transition-all"
                          placeholder="Enter title…"
                        />
                        <div className="text-[9px] font-bold text-[#5C6F84] uppercase mt-0.5 flex items-center gap-2">
                          <span>{item.file.name}</span>
                          <span>·</span>
                          <span>{formatBytes(item.file.size)}</span>
                        </div>
                        {item.error && (
                          <div className="text-[9px] font-black text-[#B91C1C] mt-0.5">{item.error}</div>
                        )}
                      </div>

                      {/* Status + remove */}
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={item.status} />
                        {!uploading && (
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="w-6 h-6 rounded-full border-2 border-[#CBD5E1] flex items-center justify-center hover:border-[#F87171] hover:text-[#F87171] transition-colors cursor-pointer"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear all */}
              {!uploading && queue.length > 1 && (
                <div className="px-4 py-2.5 border-t-2 border-[#F1F5F9] bg-[#FAF3E0]">
                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[#F87171] hover:text-[#B91C1C] cursor-pointer transition-colors"
                  >
                    <Trash2 size={10} /> Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Shared metadata */}
          {queue.length > 0 && (
            <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-5">
              <h3 className="font-display font-black text-xs uppercase border-b-2 border-[#1E293B] pb-2">
                Shared Metadata <span className="text-[#5C6F84] normal-case font-bold text-[9px]">(applied to all files)</span>
              </h3>

              {/* Media type */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "photo", name: "Photo", icon: Image },
                  { id: "video", name: "Video", icon: Video },
                ].map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMediaType(id)}
                    disabled={uploading}
                    className={`flex flex-col items-center justify-center p-3 border-2 border-[#1E293B] rounded-lg font-display font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] transition-all cursor-pointer ${
                      mediaType === id
                        ? "bg-[#8B5CF6] text-white -translate-y-[2px]"
                        : "bg-[#FAF3E0] hover:bg-[#FFFDF9]"
                    }`}
                  >
                    <Icon size={16} strokeWidth={2.5} className="mb-1" />
                    {name}
                  </button>
                ))}
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-[#1E293B] flex items-center gap-1.5">
                  <Calendar size={12} /> Media Date
                </label>
                <input
                  type="date"
                  value={sharedDate}
                  onChange={(e) => setSharedDate(e.target.value)}
                  disabled={uploading}
                  className="input-field"
                  required
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#1E293B] flex items-center gap-1.5">
                  <Tag size={12} /> Tags
                </label>
                <div className="tag-input-container">
                  {sharedTags.map((tag, i) => (
                    <span key={i} className="tag-chip">
                      #{tag}
                      <button type="button" onClick={() => removeTag(i)} className="text-xs font-black">×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Type & press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    disabled={uploading}
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
              </div>

              {/* Story */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-[#1E293B] flex items-center gap-1.5">
                  Memory Story <span className="text-[10px] font-bold text-[#EC4899] normal-case">(optional context)</span>
                </label>
                <textarea
                  placeholder="Write down the details, emotions, or funny moments from this memory..."
                  value={sharedStory}
                  onChange={(e) => setSharedStory(e.target.value)}
                  disabled={uploading}
                  className="input-field min-h-20 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Submit panel ───────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] space-y-4">
            <h3 className="font-display font-black text-sm uppercase border-b-2 border-[#1E293B] pb-2">
              Vault Summary
            </h3>

            <div className="divide-y divide-[#F1F5F9] text-[10px] font-bold text-[#5C6F84] uppercase">
              <div className="py-2 flex justify-between">
                <span>Files selected:</span>
                <span className="text-[#1E293B] font-extrabold">{queue.length}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Type:</span>
                <span className="text-[#1E293B] font-extrabold capitalize">{mediaType}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Date:</span>
                <span className="text-[#1E293B] font-extrabold">{sharedDate || "—"}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Tags:</span>
                <span className="text-[#1E293B] font-extrabold">{sharedTags.length || "—"}</span>
              </div>
              {uploading && (
                <div className="py-2 flex justify-between">
                  <span>Progress:</span>
                  <span className="text-[#8B5CF6] font-extrabold">{doneCount}/{queue.length}</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {uploading && queue.length > 0 && (
              <div className="w-full bg-[#E2E8F0] rounded-full h-2 border border-[#CBD5E1] overflow-hidden">
                <div
                  className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500"
                  style={{ width: `${(doneCount / queue.length) * 100}%` }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || queue.length === 0}
              className="w-full btn-primary py-3.5 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] cursor-pointer text-xs uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Uploading {doneCount}/{queue.length}…</>
              ) : queue.length === 0 ? (
                "Select files first"
              ) : (
                <><Upload size={14} /> Upload {queue.length > 1 ? `${queue.length} Files` : "File"}</>
              )}
            </button>

            {uploadDone && !uploading && (
              <button
                type="button"
                onClick={() => navigate(mediaType === "video" ? "/videos" : "/photos")}
                className="w-full btn-secondary py-3 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] cursor-pointer text-xs uppercase"
              >
                Go to Gallery →
              </button>
            )}

            {!uploading && queue.length === 0 && (
              <div className="text-center py-6 text-[10px] font-bold text-[#5C6F84] uppercase border-2 border-dashed border-[#CBD5E1] rounded-lg">
                No files selected yet
              </div>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
