const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicNumber(num: number): string {
  return String(num)
    .split("")
    .map((d) => ARABIC_DIGITS[parseInt(d, 10)])
    .join("");
}
