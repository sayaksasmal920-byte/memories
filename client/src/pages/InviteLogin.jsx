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
    if (user && !user.mustChangePassword) {
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
      const loginRes = await login(token, password);
      if (loginRes.mustChangePassword) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to log in. Please check your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF3E0] dot-grid flex flex-col items-center justify-center p-6 text-[#1E293B]">
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-2xl p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
        {/* Branding badge */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#EC4899] border-2 border-[#1E293B] flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
            <Lock size={20} color="white" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="font-display font-black text-2xl uppercase tracking-wider text-center mb-1">
          Unlock Your Vault
        </h2>
        <p className="text-xs font-bold text-center text-[#5C6F84] uppercase tracking-wide mb-8">
          Personal Media Node • Link: <span className="text-[#8B5CF6]">/u/{token}</span>
        </p>

        {error && (
          <div className="bg-[#F87171] bg-opacity-20 border-2 border-[#F87171] text-[#B91C1C] rounded-lg p-3 text-xs font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[#1E293B] block">
              Invite Token
            </label>
            <input
              type="text"
              disabled
              value={token}
              className="input-field bg-[#FAF3E0] border-[#CBD5E1] text-[#5C6F84] font-black uppercase text-center tracking-widest"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-[#1E293B] block">
              Password
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
            <p className="text-[9px] font-semibold text-[#5C6F84] uppercase mt-1">
              For your initial login, enter the default password provided (e.g. <span className="select-all text-[#1E293B] font-bold">memory123</span>).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
          >
            {loading ? "Verifying..." : "Access Vault"}
            {!loading && <ArrowRight size={16} strokeWidth={2.5} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t-2 border-dashed border-[#CBD5E1] text-center">
          <Link
            to="/"
            className="text-xs font-black uppercase text-[#5C6F84] hover:text-[#8B5CF6] transition-all no-underline"
          >
            ← Back to brand portal
          </Link>
        </div>
      </div>
    </div>
  );
}
