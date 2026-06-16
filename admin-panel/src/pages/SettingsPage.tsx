import { useEffect, useState } from "react";
import {
  UserCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CubeIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useRegistry } from "../lib/useRegistry";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { registry } = useRegistry();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    api
      .get("/v1/users/me")
      .then((res) => setDisplayName(res.data.data?.display_name ?? ""))
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put("/v1/users/me", { display_name: displayName });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (next.length < 8) return toast.error("New password must be 8+ characters");
    if (next !== confirm) return toast.error("Passwords do not match");
    setSavingPw(true);
    try {
      await api.put("/v1/users/me/password", {
        current_password: current,
        new_password: next,
      });
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const stats = [
    {
      label: "Lesson components",
      value: registry.lesson_components.length,
    },
    { label: "Mini-games", value: registry.mini_games.length },
    { label: "Block types", value: registry.blocks.length },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your account and review system info
        </p>
      </div>

      {/* Profile */}
      <Section icon={<UserCircleIcon className="h-5 w-5" />} title="Profile">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Display name">
            <input
              className="input-field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Email">
            <div className="relative">
              <EnvelopeIcon className="input-icon" />
              <input
                className="input-field pl-11 opacity-70"
                value={user?.email ?? ""}
                readOnly
              />
            </div>
          </Field>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            {user?.role ?? "ADMIN"}
          </span>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="btn-primary disabled:opacity-50"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </div>
      </Section>

      {/* Security */}
      <Section icon={<LockClosedIcon className="h-5 w-5" />} title="Security">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Current password">
            <input
              type="password"
              className="input-field"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              className="input-field"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="8+ characters"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              className="input-field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={changePassword}
            disabled={savingPw || !current || !next}
            className="btn-primary disabled:opacity-50"
          >
            {savingPw ? "Updating…" : "Change password"}
          </button>
        </div>
      </Section>

      {/* System info */}
      <Section icon={<CubeIcon className="h-5 w-5" />} title="Content system">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"
            >
              <p className="text-2xl font-bold text-white/90">{s.value}</p>
              <p className="mt-1 text-[11px] text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-white/35">
          Components are defined in the backend registry (the single source of
          truth). To add a new one, register it in the app and add an entry to{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-white/60">
            content_schema.go
          </code>
          .
        </p>
      </Section>

      {/* Danger / session */}
      <Section
        icon={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
        title="Session"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">
            Sign out of the admin panel on this device.
          </p>
          <button
            onClick={handleLogout}
            className="btn-secondary text-red-300 hover:bg-red-500/10"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-card space-y-4 p-6">
      <div className="flex items-center gap-2.5">
        <span className="icon-tile h-9 w-9">{icon}</span>
        <h2 className="text-base font-semibold text-white/90">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/50">
        {label}
      </label>
      {children}
    </div>
  );
}
