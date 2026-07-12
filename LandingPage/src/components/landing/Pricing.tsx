import type { ReactNode } from "react";
import { Eyebrow } from "./primitives";
import { handleAnchorClick } from "@/lib/smoothScroll";

function PriceFeature({
  checkClass,
  textClass = "text-body2",
  children,
}: {
  checkClass: string;
  textClass?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-[11px]">
      <span
        className={`grid h-[22px] w-[22px] flex-none place-items-center rounded-full text-[11px] font-black ${checkClass}`}
      >
        ✓
      </span>
      <span className={`text-[14.5px] font-bold ${textClass}`}>{children}</span>
    </div>
  );
}

export function Pricing() {
  return (
    <div className="relative overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute -top-[120px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(44,201,181,0.09)_0%,rgba(44,201,181,0)_62%)]" />
      <div className="relative mx-auto max-w-[1180px] px-8 py-[100px]">
        <div className="text-center">
          <Eyebrow className="text-gold">SIMPLE PRICING</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            Free to learn. Forever<span className="text-teal">.</span>
          </h2>
          <p className="mx-auto mt-[14px] max-w-[520px] text-[16px] leading-[1.7] font-semibold text-body">
            Every lesson, the full Qur'an, prayer times — free. Premium just makes the road smoother.
          </p>
        </div>

        <div className="stagger mt-[54px] flex flex-wrap items-stretch justify-center gap-[26px]">
          {/* Free */}
          <div className="flex min-w-[300px] max-w-[420px] flex-1 flex-col rounded-[28px] border border-line2 bg-panel px-8 py-9">
            <div className="text-[22px] font-black text-heading">Free</div>
            <div className="mt-[10px] flex items-baseline gap-[6px]">
              <span className="text-[46px] leading-none font-black text-heading">$0</span>
              <span className="text-[15px] font-bold text-faint">/ forever</span>
            </div>
            <div className="mt-[26px] flex flex-1 flex-col gap-[13px]">
              <PriceFeature checkClass="bg-teal-tint text-teal">The complete learning path — all levels</PriceFeature>
              <PriceFeature checkClass="bg-teal-tint text-teal">Full Qur'an with audio &amp; translation</PriceFeature>
              <PriceFeature checkClass="bg-teal-tint text-teal">Prayer times, Qibla, duas &amp; adhkar</PriceFeature>
              <PriceFeature checkClass="bg-teal-tint text-teal">Streaks, badges &amp; leaderboards</PriceFeature>
            </div>
            <a
              href="#get-started"
              onClick={handleAnchorClick}
              className="btn-soft mt-[28px] block cursor-pointer rounded-[16px] border-2 border-line2 py-[15px] text-center text-[14px] font-black tracking-[0.06em] text-body"
            >
              START FREE
            </a>
          </div>

          {/* Premium */}
          <div className="relative flex min-w-[300px] max-w-[420px] flex-1 flex-col rounded-[28px] border-[1.5px] border-gold bg-[linear-gradient(165deg,#1D2A16_0%,#0B1517_55%)] px-8 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(239,182,90,0.1)]">
            <span className="absolute -top-[15px] left-1/2 -translate-x-1/2 rounded-[11px] bg-gold px-[16px] py-[7px] text-[11px] font-black tracking-[0.1em] text-[#3A2A08] shadow-[0_4px_0_#c98f35]">
              MOST LOVED
            </span>
            <div className="flex items-center gap-[9px]">
              <span className="text-[22px] font-black text-heading">Premium</span>
              <span className="font-serif text-[16px] text-gold">✦</span>
            </div>
            <div className="mt-[10px] flex items-baseline gap-[6px]">
              <span className="text-[46px] leading-none font-black text-gold">$4.99</span>
              <span className="text-[15px] font-bold text-body">/ month</span>
            </div>
            <div className="mt-[26px] flex flex-1 flex-col gap-[13px]">
              <PriceFeature checkClass="bg-gold-tint text-gold" textClass="text-heading">Everything in Free, plus…</PriceFeature>
              <PriceFeature checkClass="bg-gold-tint text-gold">Unlimited AI coach feedback &amp; drills</PriceFeature>
              <PriceFeature checkClass="bg-gold-tint text-gold">Offline packs for lessons &amp; surahs</PriceFeature>
              <PriceFeature checkClass="bg-gold-tint text-gold">Streak freezes &amp; repair</PriceFeature>
              <PriceFeature checkClass="bg-gold-tint text-gold">Family plan — up to 6 members</PriceFeature>
            </div>
            <a
              href="#get-started"
              onClick={handleAnchorClick}
              className="btn3d mt-[28px] block cursor-pointer rounded-[16px] bg-gold py-[16px] text-center text-[14px] font-black tracking-[0.06em] text-[#3A2A08] shadow-[0_5px_0_#c98f35]"
            >
              TRY PREMIUM FREE · 7 DAYS
            </a>
          </div>
        </div>

        <div className="mt-[26px] text-center text-[13px] font-semibold text-faint">
          No ads inside worship — ever. Cancel anytime.
        </div>
      </div>
    </div>
  );
}
