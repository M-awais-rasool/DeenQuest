import { useEffect, useRef, type ReactNode } from "react";

type Variant = "up" | "down" | "left" | "right" | "scale" | "blur" | "fade";

/**
 * Wraps a section so it animates in the first time it scrolls into view.
 * `variant` picks the section's own entrance (direction / scale / blur);
 * containers inside marked `.stagger` / `.stagger-sides` cascade their
 * children once this wrapper gets `.is-visible`. Only opacity/transform/
 * filter animate — cheap and smooth. `prefers-reduced-motion` is honored
 * in CSS.
 */
export function Reveal({
  children,
  className = "",
  variant = "up",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
