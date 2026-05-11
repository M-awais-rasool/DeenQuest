import { motion } from "framer-motion";
import { Flame, Trophy, Star, Gift } from "lucide-react";
import { SectionHeader } from "./Section";

const stats = [
  { icon: Flame, label: "Day Streak", value: "47", color: "from-orange-400 to-red-500" },
  { icon: Star, label: "Total XP", value: "12,480", color: "from-gold-soft to-gold" },
  { icon: Trophy, label: "Achievements", value: "23", color: "from-emerald-glow to-emerald" },
  { icon: Gift, label: "Treasures", value: "8", color: "from-purple-400 to-pink-500" },
];

export function Gamification() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="Gamification"
          title={<>Stay <span className="shimmer-text">motivated</span> every day</>}
          subtitle="XP, streaks, badges, and rewards that turn discipline into delight."
        />

        <div className="mt-16 grid grid-cols-2 gap-5 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative overflow-hidden rounded-3xl glass p-6 text-center"
            >
              <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${s.color} shadow-lg`}>
                <s.icon className="h-7 w-7 text-white" fill="currentColor" />
              </div>
              <div className="mt-4 text-3xl font-bold md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* progress ring showcase */}
        <div className="mt-16 grid grid-cols-1 items-center gap-12 rounded-[2rem] glass p-10 lg:grid-cols-2">
          <div>
            <h3 className="text-3xl font-bold">Your weekly progress</h3>
            <p className="mt-3 text-muted-foreground">
              Visualize your journey with animated rings, see how close you are to your next badge,
              and never lose momentum.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { label: "Quran Reading", val: 85 },
                { label: "Daily Duas", val: 70 },
                { label: "Hadith Lessons", val: 55 },
              ].map((p) => (
                <div key={p.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-semibold text-gold">{p.val}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary/40">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${p.val}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-glow to-gold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative grid place-items-center">
            <ProgressRing value={78} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 90;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-64 w-64">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="oklch(0.78 0.2 150)" />
            <stop offset="1" stopColor="oklch(0.82 0.15 85)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="14" fill="none" />
        <motion.circle
          cx="100" cy="100" r={r}
          stroke="url(#ring)" strokeWidth="14" fill="none" strokeLinecap="round"
          initial={{ strokeDasharray: c, strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (c * value) / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: "drop-shadow(0 0 10px var(--emerald-glow))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-gradient-emerald">{value}%</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Weekly Goal</div>
        </div>
      </div>
    </div>
  );
}
