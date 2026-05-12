import { Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full glass px-5 py-3 mx-4 md:mx-auto">
        <a href="#" className="flex items-center gap-2">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-glow to-emerald shadow-[var(--shadow-glow)]">
            <Sparkles className="h-5 w-5 text-emerald-deep" />
          </div>
          <span className="text-lg font-bold tracking-tight">Nuur</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it Works</a>
          <a href="#levels" className="hover:text-foreground transition-colors">Levels</a>
          <a href="#community" className="hover:text-foreground transition-colors">Ummah</a>
        </nav>
        <a
          href="#github"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-glow to-emerald px-5 py-2 text-sm font-semibold text-emerald-deep shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.73.5.99 5.24.99 11.5c0 4.86 3.15 8.98 7.52 10.43.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.47-3.71-1.47-.5-1.27-1.22-1.61-1.22-1.61-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.69-1.48-2.44-.28-5-1.22-5-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.29 3.02 1.13.88-.24 1.82-.36 2.76-.37.94.01 1.88.13 2.76.37 2.1-1.42 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.22-2.57 5.15-5.02 5.42.39.34.74 1.01.74 2.04v3.02c0 .29.2.64.76.53A11.01 11.01 0 0 0 23 11.5C23 5.24 18.27.5 12 .5z"/></svg>
          Star on GitHub
        </a>
      </div>
    </header>
  );
}
