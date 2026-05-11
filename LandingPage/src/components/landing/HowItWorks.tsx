import { motion } from "framer-motion";
import { Target, Coins, Unlock, GraduationCap } from "lucide-react";
import { SectionHeader } from "./Section";

const steps = [
  { icon: Target, title: "Complete Daily Missions", desc: "Pray, read, reflect — small wins every day." },
  { icon: Coins, title: "Earn XP & Rewards", desc: "Every action fuels your spiritual progress." },
  { icon: Unlock, title: "Unlock New Levels", desc: "Climb the path from beginner to confident reader." },
  { icon: GraduationCap, title: "Master the Quran", desc: "Read with Tajweed and deep understanding." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="How it works"
          title={<>A journey crafted in <span className="text-gradient-gold">four steps</span></>}
        />

        <div className="relative mt-20">
          {/* connecting glowing line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-emerald-glow/0 via-emerald-glow/40 to-emerald-glow/0 lg:block" />

          <div className="space-y-16 lg:space-y-24">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className={`grid grid-cols-1 items-center gap-8 lg:grid-cols-2 ${
                  i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className={i % 2 === 1 ? "lg:text-right" : ""}>
                  <div className={`mb-3 text-sm font-semibold uppercase tracking-widest text-gold ${i % 2 === 1 ? "lg:flex lg:justify-end" : ""}`}>
                    Step 0{i + 1}
                  </div>
                  <h3 className="text-3xl font-bold md:text-4xl">{s.title}</h3>
                  <p className="mt-3 text-lg text-muted-foreground">{s.desc}</p>
                </div>

                <div className="relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-emerald-glow/15 blur-3xl" />
                  <div className="relative mx-auto grid h-56 w-56 place-items-center rounded-[2rem] glass shadow-[var(--shadow-glow)]">
                    <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-emerald-glow to-emerald shadow-[var(--shadow-glow)]">
                      <s.icon className="h-12 w-12 text-emerald-deep" strokeWidth={2.2} />
                    </div>
                    <div className="absolute -top-3 -right-3 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-gold-soft to-gold text-sm font-bold text-emerald-deep shadow-[var(--shadow-gold)]">
                      {i + 1}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
