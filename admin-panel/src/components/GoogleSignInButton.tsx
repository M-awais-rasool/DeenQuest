import { useEffect, useRef, useState } from "react";

const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

interface CredentialResponse {
  credential?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

/** Loads Google's script once, no matter how many buttons mount. */
let gsiLoader: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (gsiLoader) return gsiLoader;

  gsiLoader = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Sign-In"));
    document.head.appendChild(script);
  });

  return gsiLoader;
}

/**
 * Google's own rendered button. It hands back an ID token minted for the Web
 * client ID, which the backend verifies exactly like the mobile app's — same
 * endpoint, same audience allowlist.
 */
export default function GoogleSignInButton({
  onCredential,
  disabled = false,
}: {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Held in a ref so re-renders never re-initialize Google's widget.
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) {
      setError("VITE_GOOGLE_CLIENT_ID is not set");
      return;
    }

    let active = true;

    loadGsi()
      .then(() => {
        if (!active || !containerRef.current || !window.google) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            if (response.credential) callbackRef.current(response.credential);
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "signin_with",
          width: 320,
        });
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p className="text-center text-sm font-semibold text-red-400">{error}</p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex justify-center ${disabled ? "pointer-events-none opacity-60" : ""}`}
    />
  );
}
