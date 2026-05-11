import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Download, Play, Flame, Star, CheckCircle2 } from "lucide-react";
import heroMockup from "@/assets/hero-mockup.png";
import { Particles } from "./Particles";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yOrb = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -180]);
  const yMockup = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -120]);
  const scaleMockup = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);
  const rotatePattern = useTransform(scrollYProgress, [0, 1], [0, 30]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      {/* glow orbs */}
      <motion.div
        style={{ y: yOrb }}
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-glow/30 blur-[120px] animate-glow-pulse"
      />
      <motion.div
        style={{ y: yOrb }}
        className="pointer-events-none absolute top-40 right-10 h-72 w-72 rounded-full bg-gold/15 blur-[100px]"
      />

      {/* geometric pattern */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          rotate: rotatePattern,
          backgroundImage:
            "radial-gradient(circle at 50% 50%, var(--gold) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Particles count={35} />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-gold-soft">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            #1 Gamified Islamic Learning App
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Level Up <br />
            <span className="text-gradient-emerald">Your Deen</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
            Build Islamic habits, learn Quran Qaida, complete daily missions,
            and grow spiritually through a fun gamified experience.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <a
              href="#download"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-glow to-emerald px-7 py-3.5 text-sm font-semibold text-emerald-deep shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
            >
              <Download className="h-4 w-4" />
              Download App
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-white/5"
            >
              <Play className="h-4 w-4 fill-foreground" />
              Watch Demo
            </a>
          </div>

          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground lg:justify-start">
            <div><span className="text-2xl font-bold text-foreground">500K+</span><br />Active Muslims</div>
            <div className="h-10 w-px bg-border" />
            <div><span className="text-2xl font-bold text-gold">4.9★</span><br />App Store</div>
          </div>
        </motion.div>

        {/* Mockup + floating cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ y: yMockup, scale: scaleMockup, opacity }}
          className="relative mx-auto h-[560px] w-full max-w-md"
        >
          <div className="absolute inset-0 -z-10 rounded-full bg-emerald-glow/20 blur-3xl" />
          <img
            src={heroMockup}
            alt="Nuur app — gamified Islamic learning"
            width={1024}
            height={1280}
            className="h-full w-full object-contain animate-float drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)]"
          />

          {/* Floating XP card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute top-10 -left-4 md:-left-10 rounded-2xl glass p-4 shadow-[var(--shadow-elevated)] animate-float"
            style={{ animationDelay: "1s" }}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-gold-soft to-gold">
                <Star className="h-5 w-5 fill-emerald-deep text-emerald-deep" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">XP Earned</div>
                <div className="text-lg font-bold text-gradient-gold">+250 XP</div>
              </div>
            </div>
          </motion.div>

          {/* Streak card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="absolute top-1/3 -right-4 md:-right-8 rounded-2xl glass p-4 shadow-[var(--shadow-elevated)] animate-float-slow"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
                <Flame className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Streak</div>
                <div className="text-lg font-bold">47 Days</div>
              </div>
            </div>
          </motion.div>

          {/* Daily task card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute -bottom-4 left-4 md:-left-6 rounded-2xl glass p-4 shadow-[var(--shadow-elevated)] animate-float"
            style={{ animationDelay: "2s" }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-glow" />
              <div>
                <div className="text-xs text-muted-foreground">Daily Mission</div>
                <div className="text-sm font-semibold">Read 3 Ayahs ✓</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
