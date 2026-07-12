import { Eyebrow, IconRow } from "./primitives";

const flamePath =
  "M12 2c1.2 4.2-5 6.5-5 12a5 5 0 0 0 10 0c0-2.6-1.2-4.2-2.3-5.8-.5 1.2-1.2 1.8-2.2 2.4C13 8.5 12.6 5.5 12 2z";

export function StoryCelebration() {
  return (
    <div className="relative overflow-hidden border-t border-line bg-ink2">
      <div className="pointer-events-none absolute -right-[100px] -bottom-[140px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.1)_0%,rgba(167,139,250,0)_65%)]" />
      <div className="stagger-sides relative mx-auto flex max-w-[1180px] flex-wrap items-center gap-[70px] px-8 py-[100px]">
        {/* text */}
        <div className="min-w-[320px] flex-1">
          <Eyebrow className="text-purple-light">CHAPTER SEVEN · CELEBRATION</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            Every milestone deserves its moment
          </h2>
          <p className="mt-[18px] text-[16.5px] leading-[1.7] font-semibold text-body">
            First letter. First word. First surah. Finishing Qaida. These aren't small things —
            they're mountains climbed. DeenQuest marks each one with badges, glowing ceremonies and
            shareable certificates your family will actually frame.
          </p>
          <div className="mt-[28px] flex flex-col gap-[13px]">
            <IconRow bgClass="bg-gold-tint" colorClass="text-gold" glyph="🏅" title="24 badges" text=" — from First Letter to 30-Day Flame" />
            <IconRow bgClass="bg-purple-tint" colorClass="text-purple-light" glyph="✦" title="Level ceremonies" text=" — confetti, stats and the next door unlocked" />
            <IconRow bgClass="bg-teal-tint" colorClass="text-teal-light" glyph="📜" title="Real certificates" text=" — course diplomas with your name in gold" />
          </div>
        </div>

        {/* visuals */}
        <div className="flex min-w-[320px] flex-1 justify-center gap-[20px]">
          {/* badge card */}
          <div className="relative w-[230px] rotate-[-4deg] overflow-hidden rounded-[26px] border border-[#4A3E28] bg-panel px-5 py-6 text-center shadow-[0_30px_70px_rgba(0,0,0,0.55)] animate-[dqFloat_5.5s_ease-in-out_infinite]">
            <div className="absolute -top-[30px] left-1/2 h-[180px] w-[180px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(239,182,90,0.18)_0%,rgba(239,182,90,0)_65%)]" />
            <span className="absolute top-[18px] left-[22px] h-[10px] w-[7px] rotate-[24deg] rounded-[2px] bg-teal" />
            <span className="absolute top-[30px] right-[26px] h-[9px] w-[6px] rotate-[-28deg] rounded-[2px] bg-pink" />
            <div className="relative mx-auto mt-2 grid h-[92px] w-[92px] place-items-center rounded-full bg-[linear-gradient(145deg,#F5CE8A,#C98F35)] shadow-[0_0_40px_rgba(239,182,90,0.35)]">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="#3A2A08">
                <path d={flamePath} />
              </svg>
            </div>
            <div className="relative mt-[16px] text-[10px] font-extrabold tracking-[0.16em] text-gold">
              BADGE UNLOCKED
            </div>
            <div className="relative mt-[5px] text-[19px] font-black text-heading">Week Warrior</div>
            <div className="relative mt-[6px] text-[11.5px] leading-[1.5] font-semibold text-body">
              Seven days of missions in a row
            </div>
          </div>

          {/* certificate mini */}
          <div className="w-[220px] self-end rotate-[4deg] rounded-[10px] border-2 border-[#4A3E28] bg-panel p-[7px] shadow-[0_30px_70px_rgba(0,0,0,0.55)] animate-[dqFloat_6s_ease-in-out_infinite_1s]">
            <div className="relative rounded-[5px] border-[1.5px] border-gold px-[14px] py-[20px] text-center">
              <span className="absolute top-[6px] left-[8px] font-serif text-[10px] text-gold">✦</span>
              <span className="absolute top-[6px] right-[8px] font-serif text-[10px] text-gold">✦</span>
              <div className="text-[8.5px] font-extrabold tracking-[0.2em] text-body">CERTIFICATE</div>
              <div className="mt-2 text-[16px] font-black text-heading">Qaida Foundations</div>
              <div className="mt-[5px] text-[10px] font-semibold text-body">awarded to</div>
              <div className="mt-[2px] font-arabic text-[19px] font-bold text-gold-soft">Amina Yusuf</div>
              <div className="mt-[10px] flex items-center justify-center gap-[7px]">
                <span className="h-px w-[20px] bg-[#4A3E28]" />
                <span className="text-[8px] font-bold text-faint">28 LEVELS · 3,360 XP</span>
                <span className="h-px w-[20px] bg-[#4A3E28]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
