import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, RefreshCw, KeyRound, Check } from "lucide-react";

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await changePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF3E0] dot-grid flex flex-col items-center justify-center p-6 text-[#1E293B]">
      <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-2xl p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(30,41,59,1)]">
        
        {/* Animated Key Header */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#FBBF24] border-2 border-[#1E293B] flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
            <KeyRound size={20} className={loading ? "animate-spin" : ""} color="#1E293B" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="font-display font-black text-xl uppercase tracking-wider text-center mb-2">
          Setup Secure Password
        </h2>
        <p className="text-xs font-bold text-center text-[#EC4899] uppercase tracking-wide mb-6">
          🛡️ Action Required: Initial security reset
        </p>

        {error && (
          <div className="bg-[#F87171] bg-opacity-20 border-2 border-[#F87171] text-[#B91C1C] rounded-lg p-3 text-xs font-bold uppercase tracking-wider mb-6">
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div className="bg-[#34D399] bg-opacity-20 border-2 border-[#34D399] text-[#047857] rounded-lg p-4 text-center font-bold uppercase tracking-wider mb-6 flex flex-col items-center gap-2">
            <Check size={28} className="text-[#34D399] animate-bounce" strokeWidth={3} />
            <span>Vault Secured! Redirecting...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-[#1E293B] block">
                New Secure Password
              </label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-[#1E293B] block">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={2.5} />
              {loading ? "Securing Vault..." : "Save Password & Enter"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
