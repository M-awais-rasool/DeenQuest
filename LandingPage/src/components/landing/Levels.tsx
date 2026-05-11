import { motion } from "framer-motion";
import { Lock, Check, Star } from "lucide-react";
import { SectionHeader } from "./Section";

const levels = [
  { lvl: 1, title: "Arabic Letters", state: "done" },
  { lvl: 5, title: "Harakat", state: "done" },
  { lvl: 10, title: "Joining Letters", state: "current" },
  { lvl: 15, title: "Tajweed Basics", state: "locked" },
  { lvl: 20, title: "Read Quran Confidently", state: "locked" },
];

export function Levels() {
  return (
    <section id="levels" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Level System"
          title={<>Climb your <span className="text-gradient-emerald">spiritual map</span></>}
          subtitle="From your first Arabic letter to reading the Quran with confidence."
        />

        <div className="relative mt-20">
          {/* curved path SVG */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none hidden md:block"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lvlpath" x1="0" x2="1">
                <stop offset="0" stopColor="oklch(0.78 0.2 150)" stopOpacity="0.8" />
                <stop offset="1" stopColor="oklch(0.82 0.15 85)" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              d="M 50 400 Q 200 100, 350 250 T 650 250 T 950 100"
              stroke="url(#lvlpath)"
              strokeWidth="3"
              strokeDasharray="8 8"
              fill="none"
            />
          </svg>

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-5">
            {levels.map((l, i) => {
              const done = l.state === "done";
              const current = l.state === "current";
              return (
                <motion.div
                  key={l.lvl}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  style={{ marginTop: i % 2 === 0 ? "0" : "3rem" }}
                  className={`relative rounded-3xl glass p-6 text-center transition-all hover:-translate-y-2 ${
                    current ? "shadow-[var(--shadow-glow)] ring-2 ring-emerald-glow" : ""
                  }`}
                >
                  <div
                    className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${
                      done
                        ? "bg-gradient-to-br from-emerald-glow to-emerald shadow-[var(--shadow-glow)]"
                        : current
                        ? "bg-gradient-to-br from-gold-soft to-gold shadow-[var(--shadow-gold)] animate-glow-pulse"
                        : "bg-secondary/50"
                    }`}
                  >
                    {done ? (
                      <Check className="h-9 w-9 text-emerald-deep" strokeWidth={3} />
                    ) : current ? (
                      <Star className="h-9 w-9 fill-emerald-deep text-emerald-deep" />
                    ) : (
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-gold">
                    Level {l.lvl}
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{l.title}</h3>
                  {current && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/50">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-gold-soft to-gold" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
