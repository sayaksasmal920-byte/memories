import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function StoryMeter({ mediaList }) {
  const total = mediaList.length;
  const withStory = mediaList.filter(item => item.story && item.story.trim().length > 0).length;
  const withoutStory = total - withStory;

  const percentage = total > 0 ? Math.round((withStory / total) * 100) : 0;

  // Find up to 3 untitled/story-less media files to link directly
  const missingStories = mediaList
    .filter(item => !item.story || item.story.trim().length === 0)
    .slice(0, 3);

  return (
    <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-6 shadow-[5px_5px_0px_0px_var(--shadow-color)]">
      <div className="flex items-center justify-between mb-4 border-b-2 border-[var(--border)] pb-2">
        <h3 className="font-black text-sm uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
          📖 Love Journal Progress
        </h3>
        <span className="text-xs font-extrabold uppercase text-[var(--color-primary)]">{percentage}% Written</span>
      </div>

      <div className="space-y-4">
        {/* Score Bar with Memphis styling */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
            <span>STORIES WRITTEN</span>
            <span>NEED STORIES</span>
          </div>
          <div className="score-bar">
            <div
              className="score-bar-fill"
              style={{
                width: `${percentage}%`,
                backgroundColor: "var(--color-primary)",
              }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 border-2 border-[var(--border)] bg-[var(--bg-primary)] rounded-lg p-3 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            <CheckCircle2 className="text-[var(--color-primary)] shrink-0" size={18} strokeWidth={2.5} />
            <div className="leading-tight">
              <div className="text-lg font-black text-[var(--text-primary)]">{withStory}</div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Cherished</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-2 border-[var(--border)] bg-[var(--bg-primary)] rounded-lg p-3 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            <AlertCircle className="text-[var(--color-secondary)] shrink-0" size={18} strokeWidth={2.5} />
            <div className="leading-tight">
              <div className="text-lg font-black text-[var(--text-primary)]">{withoutStory}</div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Blank Pages</div>
            </div>
          </div>
        </div>

        {missingStories.length > 0 && (
          <div className="pt-2 border-t-2 border-dashed border-[var(--border)]">
            <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-2">
              ⚠️ Let's write down our memory for these:
            </div>
            <div className="space-y-2">
              {missingStories.map(item => (
                 <Link
                  key={item._id || item.id}
                  to={`/media/${item._id || item.id}`}
                  className="flex items-center gap-2 p-2 bg-[var(--bg-card)] border-2 border-[var(--border)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-elevated)] hover:-translate-y-0.5 transition-all text-xs font-bold text-[var(--text-primary)] no-underline shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                >
                  <div className="w-8 h-8 rounded border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden shrink-0">
                    <img
                      src={item.mediaType === "video" ? item.thumbnailUrl : item.fileUrl}
                      alt={item.title || item.fileName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=80&fit=crop";
                      }}
                    />
                  </div>
                  <div className="truncate flex-1">
                    <div className="truncate">{item.title || item.fileName}</div>
                    <div className="text-[9px] font-semibold text-[var(--text-secondary)] uppercase">
                      {item.mediaType} • {new Date(item.mediaDate).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
