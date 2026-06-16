import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  SparklesIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

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
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-gold-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl gradient-emerald shadow-2xl shadow-emerald-500/30">
            <SparklesIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-emerald-300 to-gold-300 bg-clip-text text-3xl font-bold text-transparent">
            DeenQuest Admin
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Sign in to manage your content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card space-y-5 p-8">
          <Field label="Email">
            <EnvelopeIcon className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-11"
              placeholder="admin@deenquest.app"
              required
            />
          </Field>

          <Field label="Password">
            <LockClosedIcon className="input-icon" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-11"
              placeholder="••••••••"
              required
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/25">
          DeenQuest · Content Management
        </p>
      </div>
    </div>
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
      <label className="mb-2 block text-sm font-medium text-white/60">
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}
