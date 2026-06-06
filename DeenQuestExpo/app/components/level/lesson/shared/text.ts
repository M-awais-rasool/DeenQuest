/** Arabic Unicode ranges (base + supplement + presentation forms). */
const ARABIC_RE =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/** True when the string contains any Arabic-script character. */
export function containsArabic(text?: string | null): boolean {
  return !!text && ARABIC_RE.test(text);
}

/** Fisher–Yates shuffle returning a new array (does not mutate input). */
export function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
