import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Logo, AmbientGlow } from "../components/Layout";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleCredential = useCallback(
    async (idToken: string) => {
      setLoading(true);
      try {
        await loginWithGoogle(idToken);
        toast.success("Welcome back!");
        navigate("/");
      } catch {
        toast.error("That account does not have admin access");
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, navigate],
  );

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

        <div className="dq-card space-y-6 p-8">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-3 text-sm font-semibold text-fg-dimmer">
              <span className="dq-spinner h-4 w-4" />
              Signing in…
            </div>
          ) : (
            <GoogleSignInButton onCredential={handleCredential} />
          )}

          <p className="text-center text-xs font-semibold leading-relaxed text-fg-faintest">
            Only accounts on the admin allowlist can open this panel. Ask an
            existing admin to add your address to <code>ADMIN_EMAILS</code>.
          </p>
        </div>

        <p className="mt-6 text-center text-xs font-semibold text-fg-faintest">
          DeenQuest · Content Management
        </p>
      </div>
    </div>
  );
}
