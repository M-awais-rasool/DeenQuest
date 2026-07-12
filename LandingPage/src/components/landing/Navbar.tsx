import { Logo } from "./Logo";
import { handleAnchorClick } from "@/lib/smoothScroll";

const links = [
  { href: "#journey", label: "The Journey" },
  { href: "#coach", label: "AI Coach" },
  { href: "#quran", label: "Qur'an" },
  { href: "#family", label: "Family" },
];

export function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-line bg-[rgba(6,13,15,0.85)] backdrop-blur-[14px]">
      <div className="mx-auto flex max-w-[1180px] items-center gap-[34px] px-8 py-4">
        <a href="#" onClick={handleAnchorClick} className="flex items-center gap-[11px]">
          <Logo size={38} radius={11} gradientId="nav-logo" />
          <span className="font-sans text-[21px] font-black text-heading">
            Deen<span className="text-gold">Quest</span>
          </span>
        </a>
        <div className="ml-auto flex items-center gap-[26px]">
          <nav className="hidden items-center gap-[26px] md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={handleAnchorClick}
                className="text-[14px] font-extrabold text-body transition-colors hover:text-heading"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href="#get-started"
            onClick={handleAnchorClick}
            className="btn3d cursor-pointer rounded-[14px] bg-teal px-[22px] py-[11px] text-[14px] font-black tracking-[0.04em] text-teal-deep shadow-[0_4px_0_#1b9484]"
          >
            GET STARTED
          </a>
        </div>
      </div>
    </div>
  );
}
