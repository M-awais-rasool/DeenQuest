import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Flame, Star, Trophy } from "lucide-react";

const notifs = [
  { icon: Flame, text: "Streak extended to 47 days!", color: "from-orange-400 to-red-500" },
  { icon: Star, text: "+50 XP earned for Fajr prayer", color: "from-gold-soft to-gold" },
  { icon: Trophy, text: "Achievement unlocked: Devout", color: "from-emerald-glow to-emerald" },
];

export function FloatingNotification() {
  const [i, setI] = useState(-1);

  useEffect(() => {
    const t1 = setTimeout(() => setI(0), 2500);
    const interval = setInterval(() => {
      setI((prev) => (prev + 1) % notifs.length);
    }, 5000);
    return () => { clearTimeout(t1); clearInterval(interval); };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40">
      <AnimatePresence mode="wait">
        {i >= 0 && (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 rounded-2xl glass p-4 shadow-[var(--shadow-elevated)] max-w-xs"
          >
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${notifs[i].color}`}>
              {(() => { const Ic = notifs[i].icon; return <Ic className="h-5 w-5 text-white" fill="currentColor" />; })()}
            </div>
            <div className="text-sm font-medium">{notifs[i].text}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
