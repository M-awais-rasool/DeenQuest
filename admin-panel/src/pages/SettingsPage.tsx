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
import PageHeader from "../components/PageHeader";

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
      color: "#2CC9B5",
    },
    { label: "Mini-games", value: registry.mini_games.length, color: "#EFB65A" },
    { label: "Block types", value: registry.blocks.length, color: "#A78BFA" },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        subtitle="Your account and the content system"
      />

      {/* Profile */}
      <Section
        icon={<UserCircleIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />}
        tint="#123B34"
        color="#5EE0CE"
        title="Profile"
        className="mt-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Display name">
            <input
              className="dq-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Email">
            <div className="relative">
              <EnvelopeIcon
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-dimmer"
                strokeWidth={2.2}
              />
              <input
                className="dq-input pl-11"
                value={user?.email ?? ""}
                readOnly
              />
            </div>
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-[7px] rounded-[20px] border border-teal-edge bg-teal-tint px-3.5 py-1.5 text-[11px] font-extrabold text-teal-light">
            <ShieldCheckIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
            {user?.role ?? "ADMIN"}
          </span>
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="dq-btn-ghost"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </div>
      </Section>

      {/* Security */}
      <Section
        icon={<LockClosedIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />}
        tint="#2A2212"
        color="#EFB65A"
        title="Security"
        className="mt-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Current password">
            <input
              type="password"
              className="dq-input"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              className="dq-input"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="8+ characters"
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              className="dq-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={changePassword}
            disabled={savingPw || !current || !next}
            className="dq-btn-ghost"
          >
            {savingPw ? "Updating…" : "Change password"}
          </button>
        </div>
      </Section>

      {/* Content system */}
      <Section
        icon={<CubeIcon className="h-[18px] w-[18px]" strokeWidth={2.2} />}
        tint="#2A2212"
        color="#EFB65A"
        title="Content system"
        className="mt-4"
      >
        <div className="grid grid-cols-3 gap-3.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[13px] border border-ink-500 bg-ink-700 p-5 text-center"
            >
              <div
                className="text-[30px] font-black leading-none"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div className="mt-1.5 text-xs font-bold text-fg-dim">
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3.5 text-xs font-semibold leading-relaxed text-fg-dimmer">
          Components are defined in the backend registry (
          <code className="font-mono text-fg-dim">content_schema.go</code>) — the
          single source of truth.
        </p>
      </Section>

      {/* Session */}
      <Section
        icon={
          <ArrowRightStartOnRectangleIcon
            className="h-[18px] w-[18px]"
            strokeWidth={2.2}
          />
        }
        tint="#2A1218"
        color="#F0838C"
        title="Session"
        className="mt-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-fg-dim">
            Sign out of the admin panel on this device.
          </p>
          <button onClick={handleLogout} className="dq-btn-danger">
            Logout
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  tint,
  color,
  title,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  tint: string;
  color: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`dq-card p-[22px] ${className}`}>
      <div className="mb-[18px] flex items-center gap-[11px]">
        <span
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[10px]"
          style={{ background: tint, color }}
        >
          {icon}
        </span>
        <h2 className="dq-h2">{title}</h2>
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
      <label className="dq-label">{label}</label>
      {children}
    </div>
  );
}
