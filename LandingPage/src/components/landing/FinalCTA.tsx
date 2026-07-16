import { Logo } from "./Logo";

export function FinalCTA() {
  return (
    <div id="get-started" className="relative overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute -top-[160px] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(239,182,90,0.12)_0%,rgba(239,182,90,0)_62%)]" />
      <div className="relative mx-auto max-w-[760px] px-8 pt-[110px] pb-[100px] text-center">
        <Logo
          size={84}
          radius={22}
          rectRadius={20}
          gradientId="cta-logo"
          className="mx-auto"
          style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5),0 0 60px rgba(239,182,90,0.2)" }}
        />
        <h2 className="mt-[30px] text-[34px] leading-[1.12] font-black text-heading sm:text-[48px]">
          Your first letter is waiting<span className="text-gold">.</span>
        </h2>
        <p className="mt-[16px] text-[17px] leading-[1.7] font-semibold text-body">
          Free forever. No ads inside worship. Start tonight, and in five minutes you'll already know
          أ.
        </p>
        <div className="mt-[34px] flex flex-wrap justify-center gap-[14px]">
          <button
            type="button"
            className="btn3d cursor-pointer rounded-[18px] bg-gold px-[38px] py-[18px] text-[16px] font-black tracking-[0.06em] text-[#3A2A08] shadow-[0_6px_0_#c98f35]"
          >
            BEGIN YOUR SACRED JOURNEY
          </button>
        </div>
        <div className="mt-[30px] flex flex-col items-center gap-[18px]">
          {/* Coming-soon badge — pulsing dot + shimmering gold label */}
          <div className="inline-flex items-center gap-[11px] rounded-full border border-gold/40 bg-gold-tint/60 px-[20px] py-[9px] shadow-[0_0_38px_rgba(239,182,90,0.18)] backdrop-blur-sm">
            <span className="relative grid h-[10px] w-[10px] place-items-center">
              <span className="absolute h-full w-full rounded-full bg-gold animate-[dqPing_1.8s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <span className="relative h-[10px] w-[10px] rounded-full bg-gold shadow-[0_0_10px_rgba(239,182,90,0.9)]" />
            </span>
            <span
              className="bg-[linear-gradient(100deg,#efb65a_0%,#fff4dc_45%,#efb65a_60%,#efb65a_100%)] bg-clip-text text-[12.5px] font-black tracking-[0.18em] text-transparent animate-[dqShimmer_3.2s_linear_infinite]"
              style={{ backgroundSize: "220% 100%" }}
            >
              COMING SOON
            </span>
          </div>

          <p className="max-w-[430px] text-[14.5px] leading-[1.6] font-semibold text-body">
            The DeenQuest app is almost here. iOS &amp; Android launch soon —
            <span className="text-heading"> begin above to be first in line.</span>
          </p>

          {/* Store chips — dimmed + tagged so it's clear they aren't live yet */}
          <div className="flex flex-wrap justify-center gap-[13px]">
            {/* App Store */}
            <div className="relative inline-flex cursor-not-allowed select-none items-center gap-[11px] rounded-[15px] border border-line2 bg-panel px-[18px] py-[11px] opacity-75 grayscale-[0.25]">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" className="text-heading" aria-hidden="true">
                <path d="M16.36 12.9c.02 2.32 2.04 3.09 2.06 3.1-.02.05-.32 1.11-1.07 2.2-.64.95-1.31 1.9-2.37 1.92-1.03.02-1.37-.61-2.55-.61s-1.55.59-2.53.63c-1.02.04-1.79-1.02-2.44-1.97-1.32-1.92-2.33-5.42-.98-7.79.67-1.17 1.87-1.92 3.17-1.94 1-.02 1.94.67 2.55.67.61 0 1.76-.83 2.96-.71.5.02 1.92.2 2.83 1.53-.07.05-1.69.99-1.67 2.95zM14.5 5.9c.54-.66.9-1.57.8-2.48-.78.03-1.72.52-2.28 1.17-.5.58-.94 1.51-.82 2.4.87.07 1.76-.44 2.3-1.09z" />
              </svg>
              <div className="text-left">
                <div className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-faint">Soon on the</div>
                <div className="text-[14px] font-black leading-[1.1] text-heading">App Store</div>
              </div>
              <span className="absolute -top-[9px] -right-[8px] rounded-full bg-gold px-[8px] py-[2px] text-[8.5px] font-black tracking-[0.07em] text-gold-ink shadow-[0_3px_9px_rgba(0,0,0,0.45)]">
                SOON
              </span>
            </div>

            {/* Google Play */}
            <div className="relative inline-flex cursor-not-allowed select-none items-center gap-[11px] rounded-[15px] border border-line2 bg-panel px-[18px] py-[11px] opacity-75 grayscale-[0.25]">
              <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.6 2.4c-.28.2-.45.56-.45 1.04v17.12c0 .48.17.84.45 1.04l.09.08L13 12.65v-.2L3.69 2.32l-.09.08z" fill="#5ee0ce" />
                <path d="M16.3 15.94L13 12.65v-.2l3.3-3.29.08.04 3.9 2.22c1.11.63 1.11 1.66 0 2.29l-3.9 2.22-.08-.03z" fill="#efb65a" />
                <path d="M16.38 15.9L13 12.55 3.6 21.6c.37.39.97.44 1.65.05l11.13-6.33z" fill="#f0838c" />
                <path d="M16.38 9.2L5.25 2.87c-.68-.39-1.28-.34-1.65.05L13 12.55l3.38-3.35z" fill="#6ec1e8" />
              </svg>
              <div className="text-left">
                <div className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-faint">Soon on</div>
                <div className="text-[14px] font-black leading-[1.1] text-heading">Google Play</div>
              </div>
              <span className="absolute -top-[9px] -right-[8px] rounded-full bg-gold px-[8px] py-[2px] text-[8.5px] font-black tracking-[0.07em] text-gold-ink shadow-[0_3px_9px_rgba(0,0,0,0.45)]">
                SOON
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
