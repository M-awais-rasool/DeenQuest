import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { SectionHeader } from "./Section";

const testimonials = [
  { name: "Aisha K.", role: "New Muslim", quote: "I finally learned to read Arabic. The streaks kept me going every single day.", initials: "AK", color: "from-emerald-glow to-emerald" },
  { name: "Yusuf M.", role: "Student", quote: "It's like Duolingo but for my Deen. I look forward to my missions every morning.", initials: "YM", color: "from-gold-soft to-gold" },
  { name: "Fatima R.", role: "Parent", quote: "My kids beg to do their Quran tasks. The mini-games are pure genius.", initials: "FR", color: "from-purple-400 to-pink-500" },
  { name: "Omar S.", role: "Revert", quote: "Felt overwhelmed starting from zero. This app made it feel like an adventure.", initials: "OS", color: "from-sky-400 to-blue-500" },
  { name: "Layla H.", role: "Teen", quote: "Hit a 200-day streak last week. Never thought I'd love learning Hadith this much.", initials: "LH", color: "from-orange-400 to-red-500" },
  { name: "Bilal A.", role: "Father of 3", quote: "The whole family competes on XP. Best thing we've added to our routine.", initials: "BA", color: "from-emerald-glow to-emerald" },
];

export function Testimonials() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Loved by Muslims"
          title={<>Stories from <span className="text-gradient-gold">our Ummah</span></>}
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={{
                hidden: { opacity: 0, y: 50, x: i % 2 === 0 ? -20 : 20, filter: "blur(8px)" },
                show: { opacity: 1, y: 0, x: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
              whileHover={{ y: -6 }}
              className="rounded-3xl glass p-6 transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              <div className="flex gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-gold" />
                ))}
              </div>
              <p className="mt-4 text-foreground/90">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.color} font-bold text-emerald-deep`}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
