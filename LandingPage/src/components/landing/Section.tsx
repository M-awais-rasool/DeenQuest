import { motion, type Variants } from "framer-motion";
import {
  Children,
  isValidElement,
  type ReactNode,
  cloneElement,
  type ReactElement,
} from "react";

const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const wordItem: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

function splitWords(node: ReactNode): ReactNode {
  if (typeof node === "string") {
    return node.split(/(\s+)/).map((chunk, i) =>
      /\s+/.test(chunk) ? (
        <span key={i}>{chunk}</span>
      ) : (
        <motion.span
          key={i}
          variants={wordItem}
          className="inline-block will-change-transform"
        >
          {chunk}
        </motion.span>
      ),
    );
  }
  if (Array.isArray(node)) return node.map((c, i) => <span key={i}>{splitWords(c)}</span>);
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    return cloneElement(el, undefined, splitWords(el.props.children));
  }
  return node;
}

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
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={wordContainer}
      className="mx-auto max-w-3xl text-center"
    >
      {eyebrow && (
        <motion.span
          variants={wordItem}
          className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold-soft"
        >
          {eyebrow}
        </motion.span>
      )}
      <h2 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl leading-[1.1]">
        {Children.map(splitWords(title), (c, i) => (
          <span key={i}>{c}</span>
        ))}
      </h2>
      {subtitle && (
        <motion.p
          variants={wordItem}
          className="mt-4 text-lg text-muted-foreground"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
