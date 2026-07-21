import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import api from "../lib/api";
import PageHeader, { PageLoader, PageMessage } from "../components/PageHeader";

import logoHappy from "../assets/logo/logo.png";
import logoOnfire from "../assets/logo/logo-1.png";
import logoWorried from "../assets/logo/logo-2.png";
import logoFading from "../assets/logo/logo-3.png";
import logoSleeping from "../assets/logo/logo-4.png";
import logoCelebrating from "../assets/logo/logo-5.png";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  icon_override: string;
}

/**
 * The mood options an admin can pin. "" is Auto (clears the override, letting
 * the app compute the mood from the user's habit state). The `key` values match
 * the client Mood keys and the backend's allowed icon set.
 */
const MOODS: { key: string; label: string; hint: string; img: string | null }[] = [
  { key: "", label: "Auto", hint: "By behaviour", img: null },
  { key: "happy", label: "Happy", hint: "Lesson done", img: logoHappy },
  { key: "onfire", label: "On fire", hint: "Streak 7+", img: logoOnfire },
  { key: "worried", label: "Worried", hint: "1 day missed", img: logoWorried },
  { key: "fading", label: "Fading", hint: "3+ days away", img: logoFading },
  { key: "sleeping", label: "Sleeping", hint: "After Isha", img: logoSleeping },
  { key: "celebrating", label: "Celebrating", hint: "Milestone", img: logoCelebrating },
];

export default function AppIconsPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Debounced search: refetch 300ms after the admin stops typing (empty search
  // returns the most recent users).
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get("/v1/admin/users", { params: { search, limit: 30 } })
        .then((r) => {
          if (active) setUsers(r.data.data ?? []);
        })
        .catch(() => {
          if (active) toast.error("Failed to load users");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const setIcon = async (user: AdminUser, icon: string) => {
    if (savingId || user.icon_override === icon) return;
    setSavingId(user.id);
    try {
      await api.put(`/v1/admin/users/${user.id}/app-icon`, { icon });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, icon_override: icon } : u)),
      );
      const label = MOODS.find((m) => m.key === icon)?.label ?? "Auto";
      toast.success(`${user.display_name || user.email} → ${label}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to update icon");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="App Icons"
        subtitle="Pin a home-screen mood for a specific learner, or leave it on Auto"
      />

      {/* Search */}
      <div className="mt-6 flex w-full max-w-md items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5">
        <MagnifyingGlassIcon
          className="h-[18px] w-[18px] flex-shrink-0 text-fg-dimmer"
          strokeWidth={2.2}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name…"
          className="w-full bg-transparent text-sm font-semibold text-fg placeholder-fg-faint focus:outline-none"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <PageLoader />
        ) : users.length === 0 ? (
          <PageMessage>No users match that search.</PageMessage>
        ) : (
          <div className="flex flex-col gap-[18px]">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                saving={savingId === u.id}
                onPick={(icon) => setIcon(u, icon)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({
  user,
  saving,
  onPick,
}: {
  user: AdminUser;
  saving: boolean;
  onPick: (icon: string) => void;
}) {
  const initial = (user.display_name || user.email || "?").charAt(0).toUpperCase();
  return (
    <div className="dq-card p-5">
      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-sm font-black text-teal-ink"
          style={{ background: "linear-gradient(135deg,#2CC9B5,#EFB65A)" }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-fg">
            {user.display_name || "(no name)"}
          </p>
          <p className="truncate text-xs font-semibold text-fg-dimmer">{user.email}</p>
        </div>
        <span className="dq-badge !px-2.5 !py-0.5 !text-[10px]">
          {user.role || "USER"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5 border-t border-white/[0.06] pt-4">
        {MOODS.map((m) => {
          const selected = (user.icon_override || "") === m.key;
          return (
            <button
              key={m.key || "auto"}
              onClick={() => onPick(m.key)}
              disabled={saving}
              title={m.hint}
              className={`group flex w-[76px] flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors disabled:opacity-50 ${
                selected
                  ? "border-teal/70 bg-teal/[0.08]"
                  : "border-white/[0.07] hover:border-white/[0.16]"
              }`}
            >
              {m.img ? (
                <img
                  src={m.img}
                  alt={m.label}
                  className="h-11 w-11 rounded-[13px]"
                  style={selected ? { boxShadow: "0 0 0 2px #2CC9B5" } : undefined}
                />
              ) : (
                <div
                  className={`grid h-11 w-11 place-items-center rounded-[13px] border border-dashed ${
                    selected ? "border-teal text-teal" : "border-white/20 text-fg-dimmer"
                  }`}
                >
                  <SparklesIcon className="h-5 w-5" strokeWidth={2} />
                </div>
              )}
              <span
                className={`text-[10.5px] font-bold leading-tight ${
                  selected ? "text-teal" : "text-fg-dimmer"
                }`}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
