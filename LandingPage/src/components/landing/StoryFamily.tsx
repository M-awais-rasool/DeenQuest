import { Eyebrow, IconRow } from "./primitives";

export function StoryFamily() {
  return (
    <div id="family" className="relative overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute -bottom-[140px] -left-[100px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(242,127,178,0.09)_0%,rgba(242,127,178,0)_65%)]" />
      <div className="stagger-sides relative mx-auto flex max-w-[1180px] flex-wrap items-center gap-[70px] px-8 py-[100px]">
        {/* text */}
        <div className="min-w-[320px] flex-1">
          <Eyebrow className="text-pink-light">CHAPTER FOUR · TOGETHER</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            A journey the whole family walks
          </h2>
          <p className="mt-[18px] text-[16.5px] leading-[1.7] font-semibold text-body">
            Challenge a friend to a weekly duel. Finish Juz 30 together as a family khatm. And with
            Parent Mode, watch your kids' progress, celebrate their wins, and send a gentle nudge when
            the streak needs saving.
          </p>
          <div className="mt-[28px] flex flex-col gap-[13px]">
            <IconRow bgClass="bg-purple-tint" colorClass="text-purple-light" glyph="⚔" title="Weekly duels" text=" — friendly XP battles that keep you both going" />
            <IconRow bgClass="bg-teal-tint" colorClass="text-teal-light" glyph="☾" title="Family khatm" text=" — shared goals, shared barakah" />
            <IconRow bgClass="bg-pink-tint" colorClass="text-pink-light" glyph="♥" title="Parent dashboard" text=" — progress, accuracy and coach tips per child" />
          </div>
        </div>

        {/* card */}
        <div className="flex min-w-[320px] flex-1 justify-center">
          <div className="w-[340px] rounded-[28px] border-[1.5px] border-purple bg-panel p-[22px] shadow-[0_30px_80px_rgba(0,0,0,0.55)] animate-[dqFloat_6s_ease-in-out_infinite]">
            <div className="flex items-center justify-between">
              <span className="rounded-[9px] bg-purple px-[10px] py-1 text-[10.5px] font-black tracking-[0.1em] text-purple-deep">
                WEEKLY DUEL
              </span>
              <span className="text-[11.5px] font-extrabold text-purple-light">ends in 2d 6h</span>
            </div>
            <div className="mt-[18px] flex items-center gap-[14px]">
              <div className="flex flex-1 flex-col items-center gap-[6px]">
                <div className="grid h-[60px] w-[60px] place-items-center rounded-full border-[2.5px] border-teal-light bg-[linear-gradient(135deg,#2CC9B5,#EFB65A)] text-[24px] font-black text-teal-deep">
                  A
                </div>
                <span className="text-[13px] font-extrabold text-heading">You</span>
                <span className="text-[22px] leading-none font-black text-teal-light">
                  340<span className="text-[12px] text-body"> XP</span>
                </span>
              </div>
              <span className="text-[16px] font-black text-purple-light">VS</span>
              <div className="flex flex-1 flex-col items-center gap-[6px]">
                <div className="grid h-[60px] w-[60px] place-items-center rounded-full bg-[linear-gradient(135deg,#6EC1E8,#A78BFA)] text-[24px] font-black text-blue-deep">
                  Y
                </div>
                <span className="text-[13px] font-extrabold text-heading">Yusuf</span>
                <span className="text-[22px] leading-none font-black text-purple-light">
                  315<span className="text-[12px] text-body"> XP</span>
                </span>
              </div>
            </div>
            <div className="mt-[16px] flex h-[12px] overflow-hidden rounded-[7px] bg-[#0F1D20]">
              <div className="w-[52%] bg-[linear-gradient(90deg,#2CC9B5,#5EE0CE)]" />
              <div className="w-[48%] bg-[#3B2F6B]" />
            </div>
            <div className="mt-[12px] text-center text-[12px] font-bold text-purple-light">
              You lead by 25 XP — one lesson keeps you ahead!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
