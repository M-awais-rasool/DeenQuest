import { motion } from "framer-motion";
import { Hand, Volume2, HelpCircle, Brain, Move } from "lucide-react";
import { SectionHeader } from "./Section";

const games = [
  { icon: Hand, title: "Tap the Letter", desc: "Race against time to tap correct Arabic letters.", color: "from-emerald-glow to-emerald" },
  { icon: Volume2, title: "Match Pronunciation", desc: "Listen and match the correct sound.", color: "from-gold-soft to-gold" },
  { icon: HelpCircle, title: "Quran Quiz", desc: "Test your knowledge of surahs and meanings.", color: "from-purple-400 to-pink-500" },
  { icon: Brain, title: "Memory Match", desc: "Pair Arabic letters with their pronunciations.", color: "from-sky-400 to-blue-500" },
  { icon: Move, title: "Drag & Drop", desc: "Build words by dragging Arabic letters.", color: "from-orange-400 to-red-500" },
];

export function MiniGames() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Mini Games"
          title={<>Learn through <span className="text-gradient-gold">play</span></>}
          subtitle="Five addictive Islamic mini-games designed to make Arabic stick."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ scale: 1.03 }}
              className="group relative overflow-hidden rounded-3xl glass p-8 transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              <div className={`mb-6 inline-grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${g.color} shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                <g.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold">{g.title}</h3>
              <p className="mt-2 text-muted-foreground">{g.desc}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-glow opacity-0 transition-opacity group-hover:opacity-100">
                Play now →
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
