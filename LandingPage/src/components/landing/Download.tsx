import { motion } from "framer-motion";
import { Apple, Play } from "lucide-react";
import heroMockup from "@/assets/hero-mockup.png";

export function Download() {
  return (
    <section id="download" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] glass p-10 md:p-16">
          {/* glow */}
          <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-glow/30 blur-[120px] animate-glow-pulse" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl font-bold leading-tight md:text-5xl">
                Start your <span className="text-gradient-emerald">Islamic journey</span> today
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Free to download. Loved by 500,000+ Muslims around the world.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#" className="group inline-flex items-center gap-3 rounded-2xl bg-foreground px-6 py-4 text-background transition-transform hover:scale-105">
                  <Apple className="h-7 w-7" fill="currentColor" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] uppercase opacity-70">Download on the</div>
                    <div className="text-base font-bold">App Store</div>
                  </div>
                </a>
                <a href="#" className="group inline-flex items-center gap-3 rounded-2xl bg-foreground px-6 py-4 text-background transition-transform hover:scale-105">
                  <Play className="h-7 w-7" fill="currentColor" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] uppercase opacity-70">Get it on</div>
                    <div className="text-base font-bold">Google Play</div>
                  </div>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto h-80 w-full max-w-sm"
            >
              <div className="absolute inset-0 -z-10 rounded-full bg-emerald-glow/30 blur-3xl" />
              <img
                src={heroMockup}
                alt="App preview"
                width={1024}
                height={1280}
                loading="lazy"
                className="h-full w-full object-contain animate-float"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
