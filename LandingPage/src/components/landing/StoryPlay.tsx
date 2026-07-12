import { Eyebrow, IconRow } from "./primitives";

const flamePath =
  "M12 2c1.2 4.2-5 6.5-5 12a5 5 0 0 0 10 0c0-2.6-1.2-4.2-2.3-5.8-.5 1.2-1.2 1.8-2.2 2.4C13 8.5 12.6 5.5 12 2z";

export function StoryPlay() {
  return (
    <div className="relative overflow-hidden border-t border-line bg-ink2">
      <div className="pointer-events-none absolute -top-[120px] -left-[120px] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.1)_0%,rgba(167,139,250,0)_65%)]" />
      <div className="stagger-sides relative mx-auto flex max-w-[1180px] flex-wrap items-center gap-[70px] px-8 py-[100px]">
        {/* text */}
        <div className="min-w-[320px] flex-1">
          <Eyebrow className="text-purple">CHAPTER ONE · PLAY</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            Lessons that feel like your favorite game
          </h2>
          <p className="mt-[18px] text-[16.5px] leading-[1.7] font-semibold text-body">
            Tap the right letter. Build the ayah word by word. Hunt for ت hiding in a grid. Race the
            clock in Lightning Rounds. Twenty task types keep every session fresh — you'll forget
            you're studying.
          </p>
          <div className="mt-[28px] flex flex-col gap-[13px]">
            <IconRow bgClass="bg-teal-tint" colorClass="text-teal-light" glyph="✓" title="Bite-size:" text=" 3–5 minutes per lesson, perfect for busy days" />
            <IconRow bgClass="bg-gold-tint" colorClass="text-gold" glyph="⚡" title="XP & levels:" text=" every answer earns progress you can feel" />
            <IconRow bgClass="bg-purple-tint" colorClass="text-purple-light" glyph="★" title="Mini-game finales:" text=" beat the boss level to unlock the next unit" />
          </div>
        </div>

        {/* visuals */}
        <div className="flex min-w-[320px] flex-1 justify-center gap-[20px]">
          {/* MCQ card */}
          <div className="w-[250px] rotate-[-4deg] rounded-[26px] border border-line2 bg-panel p-5 shadow-[0_30px_70px_rgba(0,0,0,0.55)] animate-[dqFloat_5.5s_ease-in-out_infinite]">
            <div className="flex gap-1">
              <span className="h-[7px] flex-1 rounded-[4px] bg-teal" />
              <span className="h-[7px] flex-1 rounded-[4px] bg-teal" />
              <span className="h-[7px] flex-1 rounded-[4px] bg-[#1B3036]" />
              <span className="h-[7px] flex-1 rounded-[4px] bg-[#1B3036]" />
            </div>
            <div className="mt-4 text-[16px] font-black text-heading">
              Which one is <span className="text-teal">Ta</span>?
            </div>
            <div className="mt-[14px] grid grid-cols-2 gap-[9px]">
              <div className="rounded-[14px] border-2 border-line2 bg-panel2 py-[14px] text-center">
                <span className="font-arabic text-[30px] leading-none font-bold text-heading">ب</span>
              </div>
              <div className="rounded-[14px] border-2 border-teal bg-teal-tint py-[14px] text-center shadow-[0_4px_0_#0E2C29]">
                <span className="font-arabic text-[30px] leading-none font-bold text-teal-light">ت</span>
              </div>
              <div className="rounded-[14px] border-2 border-line2 bg-panel2 py-[14px] text-center">
                <span className="font-arabic text-[30px] leading-none font-bold text-heading">ث</span>
              </div>
              <div className="rounded-[14px] border-2 border-line2 bg-panel2 py-[14px] text-center">
                <span className="font-arabic text-[30px] leading-none font-bold text-heading">ن</span>
              </div>
            </div>
            <div className="mt-[14px] flex items-center gap-2 rounded-[12px] bg-teal-tint px-3 py-[9px]">
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-teal text-[11px] font-black text-teal-deep">
                ✓
              </span>
              <span className="text-[12px] font-extrabold text-teal-light">Correct! MashaAllah</span>
            </div>
          </div>

          {/* streak card */}
          <div className="w-[210px] self-end rotate-[4deg] rounded-[26px] border border-[#3E4A2C] bg-panel p-5 shadow-[0_30px_70px_rgba(0,0,0,0.55)] animate-[dqFloat_6s_ease-in-out_infinite_1s]">
            <div className="flex items-center gap-[11px]">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="#EFB65A">
                <path d={flamePath} />
              </svg>
              <div>
                <div className="text-[26px] leading-none font-black text-heading">12</div>
                <div className="text-[10px] font-extrabold tracking-[0.1em] text-gold">DAY STREAK</div>
              </div>
            </div>
            <div className="mt-[14px] flex justify-between">
              <span className="grid h-[20px] w-[20px] place-items-center rounded-full bg-teal-tint text-[9px] font-black text-teal">✓</span>
              <span className="grid h-[20px] w-[20px] place-items-center rounded-full bg-teal-tint text-[9px] font-black text-teal">✓</span>
              <span className="grid h-[20px] w-[20px] place-items-center rounded-full bg-teal-tint text-[9px] font-black text-teal">✓</span>
              <span className="grid h-[20px] w-[20px] place-items-center rounded-full border-2 border-gold text-[9px] font-black text-gold">•</span>
              <span className="h-[20px] w-[20px] rounded-full border-2 border-[#2C464C]" />
              <span className="h-[20px] w-[20px] rounded-full border-2 border-[#2C464C]" />
            </div>
            <div className="mt-[16px] h-[10px] overflow-hidden rounded-[6px] bg-[#0F1D20]">
              <div className="h-full w-[64%] rounded-[6px] bg-[linear-gradient(90deg,#2CC9B5,#5EE0CE)]" />
            </div>
            <div className="mt-[7px] text-[11px] font-extrabold text-body">320 / 500 XP · Level 4</div>
          </div>
        </div>
      </div>
    </div>
  );
}
