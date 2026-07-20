import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Logo, AmbientGlow } from "../components/Layout";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/");
    } catch {
      toast.error("Invalid credentials or insufficient permissions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <AmbientGlow />

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={64} />
          <h1
            className="mt-4 text-3xl font-black text-transparent"
            style={{
              background: "linear-gradient(90deg,#5EE0CE,#EFB65A)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            DeenQuest Admin
          </h1>
          <p className="mt-2 text-sm font-semibold text-fg-dimmer">
            Sign in to manage your content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="dq-card space-y-5 p-8">
          <div>
            <label className="dq-label">Email</label>
            <div className="relative">
              <EnvelopeIcon
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-dimmer"
                strokeWidth={2.2}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dq-input pl-11"
                placeholder="admin@deenquest.app"
                required
              />
            </div>
          </div>

          <div>
            <label className="dq-label">Password</label>
            <div className="relative">
              <LockClosedIcon
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-fg-dimmer"
                strokeWidth={2.2}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="dq-input pl-11"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="dq-btn w-full">
            {loading ? (
              <>
                <span className="dq-spinner h-4 w-4" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRightIcon className="h-4 w-4" strokeWidth={2.6} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs font-semibold text-fg-faintest">
          DeenQuest · Content Management
        </p>
      </div>
    </div>
  );
}
