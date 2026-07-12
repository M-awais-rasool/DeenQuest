import { Logo } from "./Logo";
import { handleAnchorClick } from "@/lib/smoothScroll";

export function Footer() {
  return (
    <div className="border-t border-line bg-ink">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-[24px] px-8 py-[30px]">
        <div className="flex items-center gap-[9px]">
          <Logo size={26} radius={8} rectRadius={18} gradientId="footer-logo" simplified />
          <span className="text-[15px] font-black text-heading">DeenQuest</span>
        </div>
        <span className="text-[12.5px] font-semibold text-faint">Learn · Play · Grow</span>
        <div className="ml-auto flex gap-[22px]">
          <a href="#journey" onClick={handleAnchorClick} className="text-[12.5px] font-bold text-faint transition-colors hover:text-body">About</a>
          <a href="#coach" onClick={handleAnchorClick} className="text-[12.5px] font-bold text-faint transition-colors hover:text-body">Privacy</a>
          <a href="#quran" onClick={handleAnchorClick} className="text-[12.5px] font-bold text-faint transition-colors hover:text-body">Contact</a>
        </div>
      </div>
    </div>
  );
}
