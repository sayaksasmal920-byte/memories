import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import { Sparkles, Heart } from "lucide-react";

export default function Layout({ children }) {
  const { user, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  // Show a premium Memphis dot-grid loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] dot-grid flex flex-col items-center justify-center p-6">
        <div className="bg-[var(--bg-card)] border-3 border-[var(--border)] rounded-xl p-8 max-w-sm w-full text-center shadow-[6px_6px_0px_0px_var(--shadow-color)]">
          <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-[var(--color-primary)] border-2 border-[var(--border)] rounded-full shadow-[3px_3px_0px_0px_var(--shadow-color)] heartbeat">
            <Heart size={28} fill="white" color="white" strokeWidth={2.5} />
          </div>
          <h2 className="font-display font-black text-xl uppercase tracking-wider text-[var(--text-primary)] mb-2">
            Opening Our Love Story...
          </h2>
          <p className="text-sm font-bold text-[var(--text-secondary)] uppercase">
            Unlocking our precious moments...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to Change Password page if database has mustChangePassword = true
  if (user && mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Protect dashboard routes
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] dot-grid text-[var(--text-primary)]">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Panel */}
      <main className="flex-1 overflow-x-hidden flex flex-col min-h-screen">
        {/* Top Header Row */}
        <header className="bg-[var(--bg-card)] border-b-3 border-[var(--border)] h-16 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="font-display font-black text-base uppercase tracking-wider text-[var(--text-primary)]">
            💖 Our Memories // Connected
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-primary font-black shadow-[1.5px_1.5px_0px_0px_var(--shadow-color)] text-[10px]">
              Love Status: Connected
            </div>
          </div>
        </header>

        {/* Dynamic content scroll frame */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </div>

        {/* Retro style footer */}
        <footer className="border-t-3 border-[var(--border)] bg-[var(--bg-card)] p-4 text-center text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
          © 2026 Our Love Scrapbook // Made with love for my girl.
        </footer>
      </main>
    </div>
  );
}
