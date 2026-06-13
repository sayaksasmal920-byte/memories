import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Image,
  Video,
  Smile,
  FolderHeart,
  Star,
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
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, color: "var(--color-primary)" },
    { name: "Photos", path: "/photos", icon: Image, color: "var(--color-secondary)" },
    { name: "Videos", path: "/videos", icon: Video, color: "var(--color-accent)" },
    { name: "Stickers", path: "/stickers", icon: Smile, color: "var(--color-success)" },
    { name: "Collections", path: "/collections", icon: FolderHeart, color: "var(--color-secondary)" },
    { name: "Favorites", path: "/favorites", icon: Star, color: "var(--color-warning)" },
    { name: "Search", path: "/search", icon: Search, color: "var(--color-primary)" },
    { name: "Password Reset", path: "/admin", icon: Key, color: "var(--color-danger)" },
  ];

  return (
    <aside
      className="w-64 flex-shrink-0 bg-[#FFFDF9] border-r-3 border-[#1E293B] flex flex-col h-screen sticky top-0"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {/* Sidebar Header Brand */}
      <div className="p-6 border-b-3 border-[#1E293B] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FBBF24] border-2 border-[#1E293B] flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
          <Sparkles size={14} strokeWidth={2.5} />
        </div>
        <span className="font-black text-xl text-[#1E293B] uppercase tracking-wider">
          Memory<span className="text-[#8B5CF6]">Vault</span>
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
                  ? "bg-[#8B5CF6] text-white border-[#1E293B] translate-x-1 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]"
                  : "bg-transparent text-[#1E293B] border-transparent hover:border-[#1E293B] hover:bg-[#F3E9D2]"
              }`}
            >
              <div
                className="w-6 h-6 rounded-md border border-[#1E293B] flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"
                style={{ backgroundColor: isActive ? "#FFFDF9" : item.color }}
              >
                <Icon
                  size={14}
                  color={isActive ? "#1E293B" : (item.color === "var(--color-accent)" ? "#1E293B" : "#FFF")}
                  strokeWidth={2.5}
                />
              </div>
              <span className="text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t-3 border-[#1E293B] bg-[#FAF3E0] space-y-3">
        {user && (
          <div className="text-xs font-bold text-[#5C6F84] uppercase truncate">
            Invite: <span className="text-[#1E293B] select-all">/u/{user.inviteToken}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F87171] text-[#FFF] font-black border-2 border-[#1E293B] rounded-full shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0px_0px_0px_0px_rgba(30,41,59,1)] transition-all cursor-pointer text-xs uppercase"
        >
          <LogOut size={12} strokeWidth={2.5} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
