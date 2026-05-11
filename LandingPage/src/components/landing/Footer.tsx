import { Sparkles, Twitter, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-6">
        <blockquote className="mx-auto max-w-2xl text-center">
          <p className="text-xl italic text-foreground/90 md:text-2xl">
            "And whoever puts their trust in Allah — He is sufficient for them."
          </p>
          <footer className="mt-3 text-sm text-gold">— Quran 65:3</footer>
        </blockquote>

        <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-glow to-emerald shadow-[var(--shadow-glow)]">
                <Sparkles className="h-5 w-5 text-emerald-deep" />
              </div>
              <span className="text-lg font-bold">Nuur</span>
            </a>
            <p className="mt-4 text-sm text-muted-foreground">
              Level up your Deen, one mission at a time.
            </p>
          </div>

          {[
            { title: "Product", links: ["Features", "Levels", "Mini Games", "Download"] },
            { title: "Company", links: ["About", "Contact", "Careers", "Press"] },
            { title: "Legal", links: ["Privacy", "Terms", "Cookies", "Licenses"] },
          ].map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-gold">{c.title}</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="hover:text-foreground transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nuur. Made with iman.</p>
          <div className="flex gap-3">
            {[Twitter, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full glass transition-colors hover:bg-white/10">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
