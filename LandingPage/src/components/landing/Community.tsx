import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Globe, BookOpen, Flame, Heart } from "lucide-react";
import { SectionHeader } from "./Section";

const stats = [
  { icon: Heart, label: "Good deeds today", value: 1_247_320, suffix: "" },
  { icon: BookOpen, label: "Quran lessons completed", value: 8_540_000, suffix: "" },
  { icon: Flame, label: "Active streaks", value: 320_000, suffix: "" },
  { icon: Globe, label: "Countries", value: 142, suffix: "" },
];

function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const dur = 1800;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{n.toLocaleString()}</span>;
}

export function Community() {
  return (
    <section id="community" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="The Ummah"
          title={<>You're never <span className="text-gradient-emerald">alone</span></>}
          subtitle="Join a global community of Muslims growing together — one mission at a time."
        />

        <div className="mt-16 overflow-hidden rounded-[2rem] glass p-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <s.icon className="mx-auto h-8 w-8 text-emerald-glow" />
                <div className="mt-3 text-3xl font-bold text-gradient-gold md:text-4xl">
                  <Counter value={s.value} />
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
