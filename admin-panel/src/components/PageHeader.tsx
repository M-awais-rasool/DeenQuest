import type { ReactNode } from "react";

/**
 * The title block every page opens with: heading, one-line description and an
 * optional action on the right. `flag` renders the small amber "NOT WIRED"
 * chip used on screens whose backend endpoint does not exist yet.
 */
export default function PageHeader({
  title,
  subtitle,
  flag,
  action,
}: {
  title: string;
  subtitle?: string;
  flag?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <h1 className="dq-h1">
          {title}
          {flag && <span className="dq-flag">{flag}</span>}
        </h1>
        {subtitle && <p className="dq-sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Centred spinner used while a page's first fetch is in flight. */
export function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="dq-spinner h-8 w-8" />
    </div>
  );
}

/** Full-width message card for load failures and empty screens. */
export function PageMessage({ children }: { children: ReactNode }) {
  return (
    <div className="dq-card p-12 text-center text-sm font-semibold text-fg-dimmer">
      {children}
    </div>
  );
}
