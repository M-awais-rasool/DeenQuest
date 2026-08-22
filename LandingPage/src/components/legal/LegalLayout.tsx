import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/landing/Logo";

/**
 * Chrome for the policy pages.
 *
 * The landing Navbar/Footer are anchor-link based and only work on the home
 * page, so these pages get their own plain header and footer that route back
 * with real links.
 */
export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-ink">
      <div className="sticky top-0 z-50 border-b border-line bg-[rgba(6,13,15,0.85)] backdrop-blur-[14px]">
        <div className="mx-auto flex max-w-[820px] items-center gap-[11px] px-8 py-4">
          <Link to="/" className="flex items-center gap-[11px]">
            <Logo size={34} radius={10} gradientId="legal-logo" />
            <span className="font-sans text-[19px] font-black text-heading">
              Deen<span className="text-gold">Quest</span>
            </span>
          </Link>
          <Link
            to="/"
            className="ml-auto text-[13.5px] font-extrabold text-body transition-colors hover:text-heading"
          >
            ← Back to site
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-[820px] px-8 py-[56px]">
        <h1 className="text-[38px] font-black leading-tight text-heading">{title}</h1>
        <p className="mt-3 text-[13px] font-extrabold tracking-[0.08em] text-faint uppercase">
          Last updated {updated}
        </p>
        <p className="mt-6 text-[16px] leading-[1.75] font-semibold text-body2">{intro}</p>

        <div className="mt-10 space-y-10">{children}</div>
      </article>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[820px] flex-wrap items-center gap-[22px] px-8 py-[30px]">
          <span className="text-[12.5px] font-semibold text-faint">
            DeenQuest · Learn · Play · Grow
          </span>
          <div className="ml-auto flex gap-[22px]">
            <Link
              to="/privacy"
              className="text-[12.5px] font-bold text-faint transition-colors hover:text-body"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-[12.5px] font-bold text-faint transition-colors hover:text-body"
            >
              Terms
            </Link>
            <a
              href="mailto:support@deenquest.online"
              className="text-[12.5px] font-bold text-faint transition-colors hover:text-body"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[22px] font-black text-heading">{title}</h2>
      <div className="mt-4 space-y-4 text-[15.5px] leading-[1.75] font-semibold text-body">
        {children}
      </div>
    </section>
  );
}

/** A labelled row in the "what we collect" table. */
export function DataRow({
  what,
  why,
  keptFor,
}: {
  what: string;
  why: string;
  keptFor: string;
}) {
  return (
    <div className="rounded-[14px] border border-line2 bg-panel p-5">
      <div className="text-[15px] font-black text-heading">{what}</div>
      <p className="mt-2 text-[14.5px] leading-[1.7] font-semibold text-body">{why}</p>
      <p className="mt-2 text-[12.5px] font-bold text-faint">Kept for: {keptFor}</p>
    </div>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[9px] h-[5px] w-[5px] flex-none rounded-full bg-teal" />
          <span className="text-[15.5px] leading-[1.75] font-semibold text-body">{item}</span>
        </li>
      ))}
    </ul>
  );
}
