import { motion } from "framer-motion";
import { BookOpen, Sun, ScrollText, RotateCw, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "./Section";

const tasks = [
  { icon: Sun, title: "Pray Fajr", xp: 50, time: "5:12 AM" },
  { icon: BookOpen, title: "Read 3 Ayahs", xp: 30, time: "Today" },
  { icon: ScrollText, title: "Learn 1 Hadith", xp: 40, time: "Today" },
  { icon: RotateCw, title: "Astaghfirullah ×33", xp: 25, time: "Anytime" },
];

export function DailyTasks() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Daily Experience"
          title={<>Your <span className="text-gradient-emerald">missions</span> for today</>}
          subtitle="Tap a task to begin — interactive screens guide you every step of the way."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tasks.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative cursor-pointer overflow-hidden rounded-3xl glass p-6 transition-all hover:shadow-[var(--shadow-glow)]"
            >
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-deep ring-1 ring-emerald-glow/30">
                  <t.icon className="h-6 w-6 text-emerald-glow" />
                </div>
                <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-bold text-gold">
                  +{t.xp} XP
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.time}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">Tap to start</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-glow opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
