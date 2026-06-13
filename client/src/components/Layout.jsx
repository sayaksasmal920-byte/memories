import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import { Sparkles } from "lucide-react";

export default function Layout({ children }) {
  const { user, loading, mustChangePassword } = useAuth();
  const location = useLocation();

  // Show a premium Memphis dot-grid loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF3E0] dot-grid flex flex-col items-center justify-center p-6">
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-8 max-w-sm w-full text-center shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]">
          <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-[#8B5CF6] border-2 border-[#1E293B] rounded-full shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] animate-bounce">
            <Sparkles size={28} color="white" strokeWidth={2.5} />
          </div>
          <h2 className="font-display font-black text-xl uppercase tracking-wider text-[#1E293B] mb-2">
            Loading Vault
          </h2>
          <p className="text-sm font-bold text-[#5C6F84] uppercase">
            Decrypting memories...
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
    <div className="flex min-h-screen bg-[#FAF3E0] dot-grid text-[#1E293B]">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Panel */}
      <main className="flex-1 overflow-x-hidden flex flex-col min-h-screen">
        {/* Top Header Row */}
        <header className="bg-[#FFFDF9] border-b-3 border-[#1E293B] h-16 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="font-display font-black text-base uppercase tracking-wider text-[#1E293B]">
            ⚡ Session Archive // Live node
          </div>
          <div className="flex items-center gap-3">
            <div className="badge badge-primary font-black shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)] text-[10px]">
              Access: Active
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
        <footer className="border-t-3 border-[#1E293B] bg-[#FFFDF9] p-4 text-center text-[10px] font-black text-[#5C6F84] uppercase tracking-wider">
          © 2026 MemoryVault // Preserve the Story Behind the Pixel.
        </footer>
      </main>
    </div>
  );
}
