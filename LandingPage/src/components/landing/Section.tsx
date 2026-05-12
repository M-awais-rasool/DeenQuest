import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-3xl text-center"
    >
      {eyebrow && (
        <span className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold-soft">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
      )}
    </motion.div>
  );
}
