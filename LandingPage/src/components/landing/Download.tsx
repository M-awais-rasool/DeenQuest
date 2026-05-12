import { motion } from "framer-motion";
import { Github, GitFork, Star, Code2, Copy, Check, Heart, Users } from "lucide-react";
import { useState } from "react";

const REPO_URL = "https://github.com/yourusername/nuur";
const CLONE_CMD = "git clone https://github.com/yourusername/nuur.git";

export function Download() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CLONE_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <section id="github" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] glass p-8 md:p-14">
          {/* glows */}
          <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-glow/30 blur-[120px] animate-glow-pulse" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto max-w-2xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-gold-soft">
              <Heart className="h-3.5 w-3.5 fill-gold text-gold" />
              Built for the Ummah — Free & Open Source
            </span>
            <h2 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Build <span className="text-gradient-emerald">Nuur</span> with us
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Nuur is 100% open source. Star the repo, fork it, or contribute features —
              every line of code is a sadaqah jariyah.
            </p>
          </motion.div>

          {/* Repo card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mx-auto mt-12 max-w-3xl rounded-3xl glass p-6 md:p-8 shadow-[var(--shadow-elevated)]"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-glow to-emerald shadow-[var(--shadow-glow)]">
                  <Github className="h-7 w-7 text-emerald-deep" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Public repository</div>
                  <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-lg font-bold hover:text-gold transition-colors">
                    yourusername / nuur
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-glow to-emerald px-5 py-2.5 text-sm font-semibold text-emerald-deep shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
                >
                  <Star className="h-4 w-4" /> Star
                </a>
                <a
                  href={`${REPO_URL}/fork`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
                >
                  <GitFork className="h-4 w-4" /> Fork
                </a>
              </div>
            </div>

            {/* Clone command */}
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-black/30 px-4 py-3 font-mono text-sm">
              <div className="flex items-center gap-3 overflow-x-auto">
                <span className="text-emerald-glow">$</span>
                <span className="whitespace-nowrap text-foreground/90">{CLONE_CMD}</span>
              </div>
              <button
                onClick={copy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/10"
                aria-label="Copy clone command"
              >
                {copied ? <><Check className="h-3.5 w-3.5 text-emerald-glow" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Code2, label: "TypeScript", value: "MIT License" },
                { icon: Users, label: "Contributors", value: "Welcome" },
                { icon: Heart, label: "Made with", value: "Iman" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border/60 bg-white/[0.02] p-4 text-center">
                  <s.icon className="mx-auto h-5 w-5 text-gold" />
                  <div className="mt-2 text-sm font-semibold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contributor pitch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-3"
          >
            {[
              { title: "Ship a feature", desc: "Pick an issue, open a PR, leave your mark." },
              { title: "Improve content", desc: "Add duas, lessons, translations and Hadith." },
              { title: "Spread the word", desc: "Share the repo with your masjid & community." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl glass p-5 transition-transform hover:-translate-y-1">
                <div className="text-sm font-semibold text-gradient-gold">{c.title}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
