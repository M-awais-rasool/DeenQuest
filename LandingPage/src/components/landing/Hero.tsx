import { handleAnchorClick } from "@/lib/smoothScroll";

const flamePath =
  "M12 2c1.2 4.2-5 6.5-5 12a5 5 0 0 0 10 0c0-2.6-1.2-4.2-2.3-5.8-.5 1.2-1.2 1.8-2.2 2.4C13 8.5 12.6 5.5 12 2z";

function Avatar({
  letter,
  gradient,
  color,
  overlap,
}: {
  letter: string;
  gradient: string;
  color: string;
  overlap?: boolean;
}) {
  return (
    <span
      className={`grid h-[34px] w-[34px] place-items-center rounded-full border-[2.5px] border-ink text-[13px] font-black ${
        overlap ? "-ml-[10px]" : ""
      }`}
      style={{ background: gradient, color }}
    >
      {letter}
    </span>
  );
}

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-[220px] left-1/2 h-[750px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(44,201,181,0.13)_0%,rgba(44,201,181,0)_62%)]" />
      <div className="pointer-events-none absolute top-[120px] -right-[140px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(239,182,90,0.09)_0%,rgba(239,182,90,0)_65%)]" />

      <div className="relative mx-auto flex max-w-[1180px] flex-col items-center gap-[60px] px-8 pt-[84px] pb-[110px] lg:flex-row">
        {/* left column */}
        <div className="min-w-0 flex-[1.1]">
          <div className="inline-flex items-center gap-[9px] rounded-[22px] border border-[#1E4A44] bg-[#0F2A2C] px-4 py-2">
            <span className="font-serif text-[13px] text-gold">✦</span>
            <span className="text-[12.5px] font-extrabold tracking-[0.08em] text-teal-light">
              THE #1 FUN WAY TO LEARN QUR'AN
            </span>
          </div>

          <h1 className="mt-[22px] text-[40px] leading-[1.08] font-black tracking-[-0.015em] text-heading sm:text-[54px] lg:text-[62px] lg:leading-[1.06]">
            Five minutes a day.
            <br />
            <span className="text-teal">A lifetime</span> of light
            <span className="text-gold">.</span>
          </h1>

          <p className="mt-[22px] max-w-[490px] text-[19px] leading-[1.65] font-semibold text-body">
            DeenQuest turns learning to read the Qur'an into a joyful daily habit — bite-size
            lessons, streaks that keep you honest, and an AI coach that hears your recitation.
          </p>

          <div className="mt-[34px] flex flex-wrap gap-[14px]">
            <a
              href="#get-started"
              onClick={handleAnchorClick}
              className="btn3d cursor-pointer rounded-[18px] bg-teal px-[34px] py-[18px] text-[16px] font-black tracking-[0.06em] text-teal-deep shadow-[0_6px_0_#1b9484]"
            >
              START YOUR JOURNEY — FREE
            </a>
            <a
              href="#how"
              onClick={handleAnchorClick}
              className="btn-soft inline-flex cursor-pointer items-center gap-[9px] rounded-[18px] border-2 border-line2 px-[28px] py-4 text-[15px] font-black text-body"
            >
              <span className="text-teal-light">▶</span> WATCH HOW IT WORKS
            </a>
          </div>

          <div className="mt-[30px] flex items-center gap-[12px]">
            <div className="flex">
              <Avatar letter="A" gradient="linear-gradient(135deg,#2CC9B5,#EFB65A)" color="#06302B" />
              <Avatar letter="M" gradient="linear-gradient(135deg,#F79A59,#F27FB2)" color="#3A1024" overlap />
              <Avatar letter="Y" gradient="linear-gradient(135deg,#6EC1E8,#A78BFA)" color="#0E2A3A" overlap />
              <Avatar letter="Z" gradient="linear-gradient(135deg,#A78BFA,#F27FB2)" color="#241A45" overlap />
            </div>
            <span className="text-[13.5px] font-bold text-body">
              <strong className="text-heading">2M+ learners</strong> · ★★★★★ 4.9 on the App Store
            </span>
          </div>
        </div>

        {/* right column — phone mockup */}
        <div className="relative flex min-w-0 flex-[0.9] justify-center">
          {/* floating: streak */}
          <div className="absolute top-[30px] -left-[8px] z-[2] flex items-center gap-[10px] rounded-[18px] border border-[#3E4A2C] bg-panel2 px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.5)] animate-[dqFloat2_4.5s_ease-in-out_infinite]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#EFB65A">
              <path d={flamePath} />
            </svg>
            <div>
              <div className="text-[15px] leading-none font-black text-heading">12-day streak</div>
              <div className="text-[10.5px] font-bold text-gold">MashaAllah!</div>
            </div>
          </div>

          {/* floating: coach */}
          <div className="absolute right-[-14px] bottom-[70px] z-[2] flex items-center gap-[10px] rounded-[18px] border-[1.5px] border-teal bg-[#0F2A2C] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.5)] animate-[dqFloat3_5s_ease-in-out_infinite_0.8s]">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[12px] bg-[linear-gradient(150deg,#2ED9C0,#0E6B5E)]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#06302B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
              </svg>
            </span>
            <div>
              <div className="text-[13px] leading-[1.2] font-black text-heading">Coach: your Ta is</div>
              <div className="text-[13px] leading-[1.2] font-black text-teal-light">95% accurate! ✓</div>
            </div>
          </div>

          {/* phone */}
          <div className="relative flex h-[680px] w-[330px] flex-col overflow-hidden rounded-[44px] border border-line2 bg-panel shadow-[0_40px_90px_rgba(0,0,0,0.65)] animate-[dqFloat_6s_ease-in-out_infinite]">
            {/* status bar */}
            <div className="flex items-center justify-between px-6 pt-[14px] pb-1 text-[12px] font-extrabold text-heading">
              <span>9:41</span>
              <span className="inline-block h-[10px] w-[20px] rounded-[3px] border border-[#4E6A68] bg-teal" />
            </div>
            {/* header */}
            <div className="flex items-center justify-between px-5 pt-[10px] pb-2">
              <div className="text-[16px] font-black text-heading">Qaida Course</div>
              <div className="flex items-center gap-[5px] rounded-[13px] border-[1.5px] border-gold bg-gold-tint px-[10px] py-[5px]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#EFB65A">
                  <path d={flamePath} />
                </svg>
                <span className="text-[12px] font-black text-gold">12</span>
              </div>
            </div>
            {/* section card */}
            <div className="mx-[14px] rounded-[15px] border border-[#3B2F6B] bg-[linear-gradient(120deg,#241A45,#1C1636)] px-[15px] py-[11px]">
              <div className="text-[9.5px] font-extrabold tracking-[0.12em] text-purple">
                SECTION 2 · UNIT 3
              </div>
              <div className="mt-[2px] text-[14px] font-black text-heading">Arabic Foundations</div>
            </div>
            {/* path */}
            <div className="relative flex-1 pt-[20px]">
              <div className="flex flex-col items-center gap-[17px]">
                <div className="-ml-[100px] grid h-[60px] w-[60px] place-items-center rounded-full bg-teal shadow-[0_6px_0_#1b9484]">
                  <span className="text-[21px] font-black text-teal-deep">✓</span>
                </div>
                <div className="-ml-[30px] grid h-[60px] w-[60px] place-items-center rounded-full bg-teal shadow-[0_6px_0_#1b9484]">
                  <span className="text-[21px] font-black text-teal-deep">✓</span>
                </div>
                <div className="ml-[52px] flex flex-col items-center gap-[6px]">
                  <span className="rounded-[9px] bg-heading px-[10px] py-1 text-[9.5px] font-black tracking-[0.08em] text-[#0B1517]">
                    START
                  </span>
                  <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-gold shadow-[0_7px_0_#c98f35] animate-[dqPulse_2s_infinite]">
                    <span className="font-arabic text-[29px] font-bold text-[#3A2A08]">ت</span>
                  </div>
                </div>
                <div className="-ml-[16px] grid h-[60px] w-[60px] place-items-center rounded-full border-[3px] border-[#2C464C] bg-panel2">
                  <span className="font-arabic text-[21px] font-bold text-faint">ث</span>
                </div>
                <div className="-ml-[94px] grid h-[60px] w-[60px] place-items-center rounded-full border-[3px] border-[#1E3238] bg-panel3 opacity-55">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5F7E7C" strokeWidth="2.2" strokeLinecap="round">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </div>
              </div>
            </div>
            {/* bottom nav */}
            <div className="absolute right-[12px] bottom-[12px] left-[12px] flex items-center justify-between rounded-[22px] border border-line2 bg-[rgba(16,29,32,0.96)] px-[10px] py-2">
              <div className="px-[11px] py-2 text-faint">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l9-8 9 8" />
                  <path d="M5 10v10h14V10" />
                </svg>
              </div>
              <div className="flex items-center gap-[6px] rounded-[15px] border-[1.5px] border-purple bg-purple-tint px-[13px] py-2 text-purple-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6c-2-1.6-6-1.6-9-.6V19c3-1 7-1 9 .6 2-1.6 6-1.6 9-.6V5.4c-3-1-7-1-9 .6z" />
                  <path d="M12 6v13.6" />
                </svg>
                <span className="text-[11px] font-black">Learn</span>
              </div>
              <div className="px-[11px] py-2 text-faint">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
                  <path d="M9 7h7" />
                </svg>
              </div>
              <div className="px-[11px] py-2 text-faint">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
                  <path d="M12 13v4M8.5 20h7" />
                </svg>
              </div>
              <div className="px-[11px] py-2 text-faint">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c1-4 4.5-5 7-5s6 1 7 5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
