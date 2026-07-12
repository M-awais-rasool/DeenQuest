import { Eyebrow, StatMini } from "./primitives";

export function StoryCoach() {
  return (
    <div id="coach" className="relative overflow-hidden">
      <div className="pointer-events-none absolute top-[60px] -right-[160px] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(44,201,181,0.12)_0%,rgba(44,201,181,0)_65%)]" />
      <div className="stagger-sides relative mx-auto flex max-w-[1180px] flex-wrap-reverse items-center gap-[70px] px-8 py-[100px]">
        {/* coach card */}
        <div className="flex min-w-[320px] flex-1 justify-center">
          <div className="w-[340px] rounded-[28px] border-[1.5px] border-teal bg-[linear-gradient(150deg,#0F3A34_0%,#12262E_58%,#16272B_100%)] p-[22px] shadow-[0_30px_80px_rgba(0,0,0,0.55),0_0_70px_rgba(44,201,181,0.12)] animate-[dqFloat_5.5s_ease-in-out_infinite]">
            <div className="flex items-center gap-[12px]">
              <div className="grid h-[48px] w-[48px] place-items-center rounded-[16px] bg-[linear-gradient(150deg,#2ED9C0,#0E6B5E)] shadow-[0_6px_16px_rgba(44,201,181,0.35)]">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#06302B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                  <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
                </svg>
              </div>
              <div>
                <span className="text-[16px] font-black text-heading">Your Coach</span>
                <span className="ml-2 rounded-[8px] border border-teal bg-teal-tint px-[7px] py-[3px] text-[9px] font-black tracking-[0.1em] text-teal-light">
                  AI
                </span>
                <div className="text-[12px] font-semibold text-body">Watched your last 3 lessons</div>
              </div>
            </div>
            <div className="mt-[15px] rounded-[16px] border border-[#1E3E3B] bg-[rgba(11,21,23,0.55)] px-[15px] py-[14px]">
              <div className="text-[14px] leading-[1.6] font-bold text-[#D7E7E5]">
                I noticed you mix up{" "}
                <span className="font-arabic text-[18px] font-bold text-teal-light">ت</span> and{" "}
                <span className="font-arabic text-[18px] font-bold text-orange">ث</span> — it happened{" "}
                <strong className="text-heading">4 times</strong> this week. The dots are the key!
              </div>
            </div>
            <div className="mt-[14px] flex gap-[12px]">
              <div className="flex-1 rounded-[15px] border-[1.5px] border-coral bg-panel2 py-[11px] text-center">
                <div className="font-arabic text-[32px] leading-none font-bold text-coral">ت</div>
                <div className="mt-[5px] text-[10px] font-extrabold tracking-[0.06em] text-coral">TA · 2 DOTS</div>
              </div>
              <div className="flex-1 rounded-[15px] border-[1.5px] border-teal bg-teal-tint py-[11px] text-center">
                <div className="font-arabic text-[32px] leading-none font-bold text-teal-light">ث</div>
                <div className="mt-[5px] text-[10px] font-extrabold tracking-[0.06em] text-teal-light">THA · 3 DOTS</div>
              </div>
            </div>
            <div className="mt-[14px] rounded-[15px] bg-teal py-[13px] text-center text-[13px] font-black tracking-[0.06em] text-teal-deep shadow-[0_4px_0_#1b9484]">
              FIX IT · 2 MIN
            </div>
          </div>
        </div>

        {/* text */}
        <div className="min-w-[320px] flex-1">
          <Eyebrow className="text-teal-light">CHAPTER TWO · GUIDANCE</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            A coach that never sleeps, never judges
          </h2>
          <p className="mt-[18px] text-[16.5px] leading-[1.7] font-semibold text-body">
            Recite into your phone and the AI coach listens — scoring clarity, pace and makhraj. It
            remembers every slip, spots the patterns you can't see, and hands you a two-minute fix
            before a small mistake becomes a habit.
          </p>
          <div className="mt-[28px] flex flex-wrap gap-[26px]">
            <StatMini colorClass="text-teal-light" value="87" suffix="/100" label="RECITATION SCORE" />
            <StatMini colorClass="text-gold" value="3" label="PATTERNS SPOTTED" />
            <StatMini colorClass="text-pink" value="+9%" label="ACCURACY THIS WEEK" />
          </div>
        </div>
      </div>
    </div>
  );
}
