import { motion } from "framer-motion";
import {
  CalendarCheck, BookOpen, Gamepad2, ScrollText, HandHeart,
  Trophy, Flame, TrendingUp, Brain, Sparkles,
} from "lucide-react";
import { SectionHeader } from "./Section";

const features = [
  { icon: CalendarCheck, title: "Daily Islamic Tasks", desc: "Personalised missions to build lasting habits." },
  { icon: BookOpen, title: "Quran Qaida Learning", desc: "Step-by-step Arabic reading for every level." },
  { icon: Gamepad2, title: "Interactive Mini Games", desc: "Learn through play with addictive challenges." },
  { icon: ScrollText, title: "Hadith Lessons", desc: "Daily wisdom of the Prophet ﷺ in bite-size cards." },
  { icon: HandHeart, title: "Daily Duas", desc: "Memorize and reflect with guided audio." },
  { icon: Trophy, title: "XP & Rewards", desc: "Earn XP, badges, and treasures as you grow." },
  { icon: Flame, title: "Streak Tracking", desc: "Stay consistent and never break your fire." },
  { icon: TrendingUp, title: "Level Progression", desc: "Unlock new chapters of your spiritual journey." },
  { icon: Brain, title: "Smart Revision", desc: "Adaptive recall keeps your knowledge sharp." },
  { icon: Sparkles, title: "Gamified Journey", desc: "Every prayer, every ayah — a quest to complete." },
];

export function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Features"
          title={<>Everything you need to <span className="text-gradient-emerald">grow your Deen</span></>}
          subtitle="A complete spiritual companion designed to feel as engaging as your favorite game."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
                show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -10, rotateX: 4, rotateY: -4 }}
              style={{ transformPerspective: 800 }}
              className="group relative overflow-hidden rounded-3xl glass p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-glow/0 blur-2xl transition-all duration-500 group-hover:bg-emerald-glow/30" />
              <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-deep ring-1 ring-emerald-glow/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <f.icon className="h-6 w-6 text-emerald-glow" />
              </div>
              <h3 className="relative mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
