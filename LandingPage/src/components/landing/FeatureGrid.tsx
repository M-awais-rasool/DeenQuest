import type { ReactNode } from "react";
import { Eyebrow } from "./primitives";

function Feature({
  tileClass,
  icon,
  title,
  text,
}: {
  tileClass: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-[18px] rounded-[24px] border border-line2 bg-panel p-[26px]">
      <span className={`grid h-[54px] w-[54px] flex-none place-items-center rounded-[18px] ${tileClass}`}>
        {icon}
      </span>
      <div>
        <div className="text-[17px] font-black text-heading">{title}</div>
        <div className="mt-[6px] text-[14px] leading-[1.6] font-semibold text-body">{text}</div>
      </div>
    </div>
  );
}

export function FeatureGrid() {
  return (
    <div className="relative overflow-hidden border-t border-line bg-ink2">
      <div className="pointer-events-none absolute -top-[140px] -right-[140px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(110,193,232,0.08)_0%,rgba(110,193,232,0)_65%)]" />
      <div className="relative mx-auto max-w-[1180px] px-8 py-[100px]">
        <div className="text-center">
          <Eyebrow className="text-blue">EVERYTHING INSIDE</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            One app for your whole deen routine
          </h2>
        </div>
        <div className="stagger mt-[52px] grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-[22px]">
          <Feature
            tileClass="bg-blue-tint"
            icon={<span className="font-serif text-[22px] text-blue">☾</span>}
            title="Prayer times & Qibla"
            text="Accurate times for your city, adhan reminders, and a compass that always finds the Kaaba."
          />
          <Feature
            tileClass="bg-gold-tint"
            icon={<span className="font-serif text-[22px] text-gold">✦</span>}
            title="Hifz memory tracker"
            text="Spaced-repetition reviews catch a fading surah before it slips — 5-minute refreshers, perfectly timed."
          />
          <Feature
            tileClass="bg-teal-tint"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5EE0CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <path d="M12 17v4M8 21h8" />
              </svg>
            }
            title="Recitation feedback"
            text="Say it out loud — get scored on clarity, pace and makhraj in seconds, judgment-free."
          />
          <Feature
            tileClass="bg-purple-tint"
            icon={<span className="font-serif text-[22px] text-purple-light">★</span>}
            title="Duas & daily adhkar"
            text="Morning and evening remembrance with a tap counter, plus the duas of the Prophet ﷺ for every moment."
          />
          <Feature
            tileClass="bg-pink-tint"
            icon={<span className="font-serif text-[22px] text-pink-light">♥</span>}
            title="Kindness missions"
            text="A daily nudge toward one good deed — because deen is more than reading, it's living."
          />
          <Feature
            tileClass="bg-[#16303E]"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9AD5F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v13" />
                <path d="M7 11l5 5 5-5" />
                <path d="M4 20h16" />
              </svg>
            }
            title="Works offline"
            text="Download lessons and surahs — the journey continues on the plane, in the village, anywhere."
          />
        </div>
      </div>
    </div>
  );
}
