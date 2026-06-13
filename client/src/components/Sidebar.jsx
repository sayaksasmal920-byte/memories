import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Image,
  Video,
  Smile,
  FolderHeart,
  Heart,
  Search,
  Settings,
  Key,
  LogOut,
  Sparkles
} from "lucide-react";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: "Love Lane", path: "/dashboard", icon: LayoutDashboard, color: "var(--color-primary)" },
    { name: "Our Gallery", path: "/photos", icon: Image, color: "var(--color-secondary)" },
    { name: "Our Clips", path: "/videos", icon: Video, color: "var(--color-accent)" },
    { name: "Cherished Moments", path: "/favorites", icon: Heart, color: "var(--color-success)" },
    { name: "Find a Moment", path: "/search", icon: Search, color: "var(--color-primary)" },
    { name: "Security Key", path: "/admin", icon: Key, color: "var(--color-danger)" },
  ];

  return (
    <aside
      className="w-64 flex-shrink-0 bg-[var(--bg-card)] border-r-3 border-[var(--border)] flex flex-col h-screen sticky top-0"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {/* Sidebar Header Brand */}
      <div className="p-6 border-b-3 border-[var(--border)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] border-2 border-[var(--border)] flex items-center justify-center shadow-[2px_2px_0px_0px_var(--shadow-color)] heartbeat">
          <Heart size={14} fill="white" color="white" strokeWidth={2.5} />
        </div>
        <span className="font-black text-xl text-[var(--text-primary)] uppercase tracking-wider">
          Our Love<span className="text-[var(--color-primary)]">Story</span>
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 font-bold transition-all duration-200 ${
                isActive
                  ? "bg-[var(--color-primary)] text-white border-[var(--border)] translate-x-1 shadow-[3px_3px_0px_0px_var(--shadow-color)]"
                  : "bg-transparent text-[var(--text-primary)] border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              <div
                className="w-6 h-6 rounded-md border border-[var(--border)] flex items-center justify-center shadow-[1px_1px_0px_0px_var(--shadow-color)]"
                style={{ backgroundColor: isActive ? "var(--bg-card)" : item.color }}
              >
                <Icon
                  size={14}
                  color={isActive ? "var(--text-primary)" : "#FFF"}
                  strokeWidth={2.5}
                />
              </div>
              <span className="text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t-3 border-[var(--border)] bg-[var(--bg-primary)] space-y-3">
        {user && (
          <div className="text-xs font-bold text-[var(--text-secondary)] uppercase truncate">
            Our Key: <span className="text-[var(--text-primary)] select-all">/u/{user.inviteToken}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-[#FFF] font-black border-2 border-[var(--border)] rounded-full shadow-[3px_3px_0px_0px_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_0px_var(--shadow-color)] transition-all cursor-pointer text-xs uppercase"
        >
          <LogOut size={12} strokeWidth={2.5} />
          Lock Memories
        </button>
      </div>
    </aside>
  );
}
