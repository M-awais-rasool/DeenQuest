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
        <div className="mt-[26px] flex justify-center gap-[12px]">
          <button
            type="button"
            className="btn-soft inline-flex cursor-pointer items-center gap-2 rounded-[13px] border border-line2 bg-panel px-[18px] py-[10px]"
          >
            <span className="text-[16px] font-semibold text-heading"></span>
            <span className="text-[13px] font-extrabold text-heading">App Store</span>
          </button>
          <button
            type="button"
            className="btn-soft inline-flex cursor-pointer items-center gap-2 rounded-[13px] border border-line2 bg-panel px-[18px] py-[10px]"
          >
            <span className="text-[14px] font-black text-teal-light">▶</span>
            <span className="text-[13px] font-extrabold text-heading">Google Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}
