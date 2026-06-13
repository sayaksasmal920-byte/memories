import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Lock, ArrowRight, ShieldAlert } from "lucide-react";

export default function InviteLogin() {
  const { token } = useParams();
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, skip straight to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your access password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(token, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] dot-grid flex flex-col items-center justify-center p-6 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-2xl p-8 max-w-md w-full shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        {/* Branding badge */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] border-2 border-[var(--border)] flex items-center justify-center shadow-[3px_3px_0px_0px_var(--shadow-color)] animate-wiggle">
            <Lock size={20} color="white" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="font-display font-black text-2xl uppercase tracking-wider text-center mb-1">
          Bondhuder shamne khulbi na pls 🙏
        </h2>
        <p className="text-xs font-bold text-center text-[var(--text-secondary)] uppercase tracking-wide mb-8">
          Thoda Personal • Link: <span className="text-[var(--color-primary)]">/u/{token}</span>
        </p>

        {error && (
          <div className="bg-[#F87171] bg-opacity-20 border-2 border-[#F87171] text-[#B91C1C] rounded-lg p-3 text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[var(--text-primary)] block">
              first chabi (Invite Token)
            </label>
            <input
              type="text"
              disabled
              value={token}
              className="input-field bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-secondary)] font-black uppercase text-center tracking-widest"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[var(--text-primary)] block">
              Second chabi (Password)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field tracking-wider"
              disabled={loading}
              autoFocus
            />
            <p className="text-[9px] font-semibold text-[var(--text-secondary)] uppercase mt-1">
              For your initial login, enter the default password provided (e.g. <span className="select-all text-[var(--text-primary)] font-bold">GheeKhatam</span>).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_var(--shadow-color)] cursor-pointer"
          >
            {loading ? "Verifying..." : "Open Our Memories"}
            {!loading && <ArrowRight size={16} strokeWidth={2.5} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-dashed border-[var(--border)] text-center">
          <Link
            to="/"
            className="text-xs font-black uppercase text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-all no-underline"
          >
            ← Back to landing page
          </Link>
        </div>
      </div>
    </div>
  );
}
