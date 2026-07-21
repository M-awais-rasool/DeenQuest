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
  CpuChipIcon,
  SparklesIcon,
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
      { label: "App Icons", path: "/app-icons", icon: SparklesIcon },
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
      {
        label: "Audit Logs",
        path: "/audit-logs",
        icon: ClipboardDocumentCheckIcon,
      },
      { label: "Settings", path: "/settings", icon: Cog6ToothIcon },
    ],
  },
];

/** The DeenQuest mark: a gold tile holding a mosque silhouette. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className="flex-shrink-0 rounded-xl"
    >
      <defs>
        <linearGradient id="dq-logo" gradientUnits="userSpaceOnUse" x1="12" y1="0" x2="62" y2="80">
          <stop offset="0" stopColor="#F9D98C" />
          <stop offset="1" stopColor="#D08A22" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="78" height="78" rx="18" fill="url(#dq-logo)" />
      <g fill="#0B3B33">
        <path d="M40 16 C55 25 61 38 61 64 H19 C19 38 25 25 40 16 Z" />
        <rect x="38.7" y="9" width="2.6" height="8" rx="1.3" />
        <path
          d="M40 1.5 A4.5 4.5 0 1 0 40 10.5 A6 6 0 0 1 40 1.5 Z"
          transform="rotate(-20 40 6)"
        />
      </g>
      <path d="M33 64 v-12 a7 7 0 0 1 14 0 v12 z" fill="url(#dq-logo)" />
    </svg>
  );
}

/** Fixed ambient colour wash behind the whole app. */
export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute -left-24 -top-52 h-[600px] w-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(44,201,181,.07), transparent 60%)",
        }}
      />
      <div
        className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(239,182,90,.06), transparent 60%)",
        }}
      />
      <div
        className="absolute -bottom-56 left-[40%] h-[620px] w-[620px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(124,110,240,.05), transparent 60%)",
        }}
      />
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="relative flex min-h-screen">
      <AmbientGlow />

      {/* ── Sidebar ── */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } sticky top-0 z-10 flex h-screen flex-shrink-0 flex-col border-r border-white/[0.06] backdrop-blur-xl transition-all duration-300`}
        style={{ background: "rgba(9,17,19,.72)" }}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-[11px] px-5 pb-5 pt-[22px] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Logo />
          {!collapsed && (
            <div>
              <div
                className="text-[18px] font-black leading-tight text-transparent"
                style={{
                  background: "linear-gradient(90deg,#5EE0CE,#EFB65A)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                DeenQuest
              </div>
              <div className="text-[9.5px] font-extrabold tracking-[0.18em] text-fg-faint">
                ADMIN PANEL
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => (
            <div key={group.heading} className="contents">
              {!collapsed && <p className="dq-nav-group">{group.heading}</p>}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  title={item.label}
                  className={({ isActive }) =>
                    `dq-nav-link ${isActive ? "active" : ""} ${
                      collapsed ? "justify-center" : ""
                    }`
                  }
                >
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2.1} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex flex-col gap-3.5 border-t border-white/[0.06] px-[22px] py-3.5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-2.5 text-[13px] font-extrabold text-fg-dimmer transition-colors hover:text-fg ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <ChevronDoubleLeftIcon
              className={`h-4 w-4 flex-shrink-0 transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
              strokeWidth={2.2}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 text-[13px] font-extrabold text-rose transition-opacity hover:opacity-80 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <ArrowRightStartOnRectangleIcon
              className="h-4 w-4 flex-shrink-0"
              strokeWidth={2.2}
            />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-[9] flex items-center gap-5 border-b border-white/[0.05] px-8 py-[18px] backdrop-blur-xl"
          style={{ background: "rgba(6,13,15,.8)" }}
        >
          <div>
            <div className="text-[17px] font-black text-fg">
              Welcome back, {user?.email?.split("@")[0] ?? "admin"}
            </div>
            <div className="text-[13px] font-semibold text-fg-dimmer">
              Manage your DeenQuest content
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3.5">
            <div className="hidden w-60 items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 sm:flex">
              <MagnifyingGlassIcon
                className="h-4 w-4 flex-shrink-0 text-fg-dimmer"
                strokeWidth={2.2}
              />
              <input
                type="text"
                placeholder="Search…"
                className="w-full bg-transparent text-[13px] font-semibold text-fg placeholder-fg-faint focus:outline-none"
              />
            </div>
            <div
              className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-base font-black text-teal-ink"
              style={{ background: "linear-gradient(135deg,#2CC9B5,#EFB65A)" }}
            >
              {user?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
