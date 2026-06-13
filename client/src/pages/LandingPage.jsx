import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

export default function LandingPage() {
  const [tokenInput, setTokenInput] = useState("");
  const navigate = useNavigate();

  const handleGo = (e) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`/u/${tokenInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] dot-grid text-[var(--text-primary)] overflow-x-hidden flex flex-col justify-between">
      {/* ── Header Navbar ─────────────────────────────────────────────────── */}
      <header className="bg-[var(--bg-card)] border-b-3 border-[var(--border)] sticky top-0 z-50">
        <div className="page-container h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] border-2 border-[var(--border)] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(55,32,36,1)] heartbeat">
              <Heart size={14} fill="white" color="white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-lg uppercase tracking-wider text-[var(--text-primary)]">
              Our Love<span className="text-[var(--color-primary)]">Story</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="btn-ghost text-xs uppercase"
              style={{ padding: "0.45rem 1.25rem" }}
            >
              Security Key Portal
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Grid ────────────────────────────────────────────────────── */}
      <section className="page-container py-16 text-center max-w-4xl relative flex-1 flex flex-col justify-center items-center">
        {/* Large Decorative Rose Shape */}
        <div className="absolute w-64 h-64 rounded-full bg-[var(--color-secondary)] opacity-30 border-3 border-[var(--border)] shadow-[6px_6px_0px_0px_var(--shadow-color)] top-10 left-1/2 -translate-x-1/2 -z-10"></div>

        <div className="inline-flex items-center gap-1.5 bg-[var(--bg-card)] border-2 border-[var(--border)] rounded-full px-5 py-1.5 text-xs font-black tracking-wide shadow-[3px_3px_0px_0px_var(--shadow-color)] mb-8 uppercase">
          <Heart className="text-[var(--color-primary)] heartbeat" size={12} fill="var(--color-primary)" strokeWidth={2.5} />
          Our Love Scrapbook & Timeline
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight leading-none mb-6 text-[var(--text-primary)]">
          Preserving Every <br />
          <span className="bg-[var(--bg-card)] px-4 py-1 border-3 border-[var(--border)] inline-block -rotate-1 shadow-[4px_4px_0px_var(--color-accent)]">
            Precious Moment of Us
          </span>
        </h1>

        <p className="font-sans text-base md:text-lg text-[var(--text-primary)] font-medium max-w-xl mx-auto mb-10 leading-relaxed">
          More than just photos and videos. This is a collection of our stories, our laughter, and our deep bond. Our memories, forever preserved.
        </p>

        {/* ── Direct Token Gateway Card ────────────────────────────────────── */}
        <div className="max-w-md w-full bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-6 shadow-[6px_6px_0px_0px_var(--shadow-color)] text-left mb-8">
          <h3 className="font-display font-black text-sm uppercase tracking-wider text-[var(--text-primary)] mb-3">
            🔑 Enter Our Love Key
          </h3>
          <form onSubmit={handleGo} className="flex gap-2 flex-col sm:flex-row">
            <input
              type="text"
              placeholder="e.g. 2iryv6"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="input-field shrink-0 uppercase tracking-widest text-center"
            />
            <button
              type="submit"
              className="btn-primary shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-0.5 hover:shadow-[1px_1px_0px_0px_var(--shadow-color)] whitespace-nowrap cursor-pointer text-xs"
            >
              Unlock Our Memories <Heart size={14} fill="white" strokeWidth={2.5} />
            </button>
          </form>
          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mt-3">
            If you received a full link, click it directly or paste our secret key above.
          </p>
        </div>
      </section>



      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t-3 border-[var(--border)] bg-[var(--bg-card)] py-8 text-center text-xs font-display font-bold text-[var(--text-secondary)] tracking-wider uppercase">
        © 2026 Our Love Scrapbook // Made with love for my girl.
      </footer>
    </div>
  );
}
