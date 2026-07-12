import type { ReactNode } from "react";
import { Eyebrow } from "./primitives";

const flamePath =
  "M12 2c1.2 4.2-5 6.5-5 12a5 5 0 0 0 10 0c0-2.6-1.2-4.2-2.3-5.8-.5 1.2-1.2 1.8-2.2 2.4C13 8.5 12.6 5.5 12 2z";

function Step({
  n,
  badgeClass,
  tileClass,
  icon,
  title,
  text,
}: {
  n: string;
  badgeClass: string;
  tileClass: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="relative min-w-[280px] flex-1 rounded-[26px] border border-line2 bg-panel px-7 py-8">
      <span
        className={`absolute -top-[20px] left-[28px] grid h-[44px] w-[44px] place-items-center rounded-[14px] text-[19px] font-black ${badgeClass}`}
      >
        {n}
      </span>
      <div className={`mt-3 grid h-[64px] w-[64px] place-items-center rounded-[20px] ${tileClass}`}>
        {icon}
      </div>
      <div className="mt-5 text-[21px] font-black text-heading">{title}</div>
      <div className="mt-[10px] text-[15px] leading-[1.65] font-semibold text-body">{text}</div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <div id="how" className="relative overflow-hidden border-t border-line">
      <div className="mx-auto max-w-[1180px] px-8 py-[100px]">
        <div className="text-center">
          <Eyebrow className="text-teal">HOW IT WORKS</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            Three steps. That's the whole secret<span className="text-gold">.</span>
          </h2>
        </div>
        <div className="stagger mt-[56px] flex flex-wrap gap-[24px]">
          <Step
            n="1"
            badgeClass="bg-teal text-teal-deep shadow-[0_5px_0_#1b9484]"
            tileClass="bg-teal-tint"
            icon={
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#5EE0CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            }
            title="Pick your five minutes"
            text="After Fajr, on the commute, before bed — tell DeenQuest when, and a gentle reminder protects that little window every day."
          />
          <Step
            n="2"
            badgeClass="bg-gold text-[#3A2A08] shadow-[0_5px_0_#c98f35]"
            tileClass="bg-gold-tint"
            icon={<span className="font-arabic text-[30px] font-bold text-gold">ت</span>}
            title="Play your lesson"
            text="Tap, match, build, recite. The path adapts to you — struggle with a letter and it quietly returns until it's yours forever."
          />
          <Step
            n="3"
            badgeClass="bg-purple text-purple-deep shadow-[0_5px_0_#6d4fd1]"
            tileClass="bg-purple-tint"
            icon={
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#C4B2FF">
                <path d={flamePath} />
              </svg>
            }
            title="Watch the streak grow"
            text="Day 3 becomes day 30 becomes day 300. XP, badges and duels keep the fire lit — and the Qur'an opens up, ayah by ayah."
          />
        </div>
      </div>
    </div>
  );
}
