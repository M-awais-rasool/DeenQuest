import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  MapIcon,
  SwatchIcon,
  GiftIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { type ReactNode, useState } from "react";

const navGroups: {
  heading: string;
  items: { label: string; path: string; icon: typeof HomeIcon }[];
}[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", path: "/", icon: HomeIcon },
      { label: "Learning Agent", path: "/learning-agent", icon: CpuChipIcon },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Levels", path: "/levels", icon: MapIcon },
      { label: "Tasks", path: "/tasks", icon: ClipboardDocumentListIcon },
      { label: "Themes", path: "/themes", icon: SwatchIcon },
      { label: "Rewards", path: "/rewards", icon: GiftIcon },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Events", path: "/events", icon: CalendarDaysIcon },
      { label: "Audit Logs", path: "/audit-logs", icon: ClipboardDocumentCheckIcon },
      { label: "Settings", path: "/settings", icon: Cog6ToothIcon },
    ],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } flex flex-col border-r border-white/5 bg-navy-950/40 backdrop-blur-2xl transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-emerald shadow-lg shadow-emerald-500/25">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="bg-gradient-to-r from-emerald-300 to-gold-300 bg-clip-text text-lg font-bold text-transparent">
                DeenQuest
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                Admin Panel
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => (
            <div key={group.heading}>
              {!collapsed && (
                <p className="section-title px-3.5 pb-1.5">{group.heading}</p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    title={item.label}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "active" : ""} ${
                        collapsed ? "justify-center" : ""
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-white/5 px-3 py-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`sidebar-link w-full ${collapsed ? "justify-center" : ""}`}
          >
            <ChevronDoubleLeftIcon
              className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`sidebar-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-navy-950/60 px-8 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-base font-semibold text-white/90">
              Welcome back, {user?.email?.split("@")[0] ?? "Admin"}
            </h2>
            <p className="text-xs text-white/40">Manage your DeenQuest content</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search…"
                className="input-field w-56 py-2 pl-9 text-sm"
              />
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full gradient-emerald text-sm font-bold shadow-lg shadow-emerald-500/25">
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
