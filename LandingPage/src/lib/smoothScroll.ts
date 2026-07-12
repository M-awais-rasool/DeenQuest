import type { MouseEvent } from "react";

/** Height of the sticky navbar — keep anchored sections clear of it. */
const NAV_OFFSET = 80;

/**
 * Click handler for in-page `#anchor` links. TanStack Router's scroll
 * restoration swallows native hash scrolling, so we take over: prevent the
 * default, then smooth-scroll to the target (or the top for `#`), offsetting
 * for the sticky navbar.
 */
export function handleAnchorClick(e: MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute("href");
  if (!href || !href.startsWith("#")) return;

  e.preventDefault();

  if (href === "#") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const target = document.getElementById(href.slice(1));
  if (!target) return;

  const y = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
  window.scrollTo({ top: y, behavior: "smooth" });
}
