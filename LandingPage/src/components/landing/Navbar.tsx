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
          href="#download"
          className="rounded-full bg-gradient-to-r from-emerald-glow to-emerald px-5 py-2 text-sm font-semibold text-emerald-deep shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
        >
          Get App
        </a>
      </div>
    </header>
  );
}
