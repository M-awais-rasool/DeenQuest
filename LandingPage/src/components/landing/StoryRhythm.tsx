import { Eyebrow, StatMini } from "./primitives";

export function StoryRhythm() {
  return (
    <div className="relative overflow-hidden border-t border-line">
      <div className="pointer-events-none absolute -top-[120px] -left-[140px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(110,193,232,0.1)_0%,rgba(110,193,232,0)_65%)]" />
      <div className="stagger-sides relative mx-auto flex max-w-[1180px] flex-wrap-reverse items-center gap-[70px] px-8 py-[100px]">
        {/* card */}
        <div className="flex min-w-[320px] flex-1 justify-center">
          <div className="relative w-[340px] overflow-hidden rounded-[28px] border-[1.5px] border-[#24505F] bg-[radial-gradient(circle_at_50%_0%,#1B4E5E_0%,#0B1517_75%)] px-[22px] py-[26px] text-center shadow-[0_30px_80px_rgba(0,0,0,0.55)] animate-[dqFloat_6s_ease-in-out_infinite]">
            <span className="absolute top-[16px] left-[20px] font-serif text-[13px] text-blue opacity-60">✦</span>
            <span className="absolute top-[24px] right-[26px] font-serif text-[11px] text-gold opacity-70">✦</span>
            <div className="text-[11px] font-extrabold tracking-[0.16em] text-blue-light">NEXT PRAYER · ASR</div>
            <div className="mt-[10px] text-[46px] leading-none font-black text-heading">
              3:47<span className="text-[21px] text-body"> PM</span>
            </div>
            <div className="mt-[12px] inline-flex items-center gap-[7px] rounded-[13px] border border-[#24505F] bg-[rgba(11,21,23,0.5)] px-[14px] py-[7px]">
              <span className="h-[7px] w-[7px] rounded-full bg-blue" />
              <span className="text-[12px] font-extrabold text-blue-light">in 1h 24m</span>
            </div>
            <div className="mt-[20px] flex flex-col gap-[9px] text-left">
              <div className="flex items-center gap-[11px] rounded-[13px] bg-[rgba(11,21,23,0.45)] px-[13px] py-[10px]">
                <span className="font-serif text-[13px] text-teal">☾</span>
                <span className="flex-1 text-[13px] font-extrabold text-heading">Fajr</span>
                <span className="text-[12px] font-bold text-body">4:12</span>
                <span className="grid h-[20px] w-[20px] place-items-center rounded-full bg-teal text-[10px] font-black text-teal-deep">✓</span>
              </div>
              <div className="flex items-center gap-[11px] rounded-[13px] bg-[rgba(11,21,23,0.45)] px-[13px] py-[10px]">
                <span className="font-serif text-[13px] text-gold">☀</span>
                <span className="flex-1 text-[13px] font-extrabold text-heading">Dhuhr</span>
                <span className="text-[12px] font-bold text-body">12:08</span>
                <span className="grid h-[20px] w-[20px] place-items-center rounded-full bg-teal text-[10px] font-black text-teal-deep">✓</span>
              </div>
              <div className="flex items-center gap-[11px] rounded-[13px] border border-[#24505F] bg-[rgba(110,193,232,0.1)] px-[13px] py-[10px]">
                <span className="font-serif text-[13px] text-blue-light">☀</span>
                <span className="flex-1 text-[13px] font-black text-blue-light">Asr</span>
                <span className="text-[12px] font-black text-blue-light">3:47</span>
                <span className="rounded-[8px] bg-blue-tint px-[7px] py-[3px] text-[8.5px] font-extrabold tracking-[0.08em] text-blue-light">NEXT</span>
              </div>
            </div>
          </div>
        </div>

        {/* text */}
        <div className="min-w-[320px] flex-1">
          <Eyebrow className="text-blue-light">CHAPTER SIX · RHYTHM</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            Your whole day finds its beat
          </h2>
          <p className="mt-[18px] text-[16.5px] leading-[1.7] font-semibold text-body">
            Five prayers are the heartbeat of a Muslim's day. DeenQuest weaves your learning around
            them — accurate prayer times for your city, a Qibla compass, and gentle adhan reminders
            that turn scattered days into a steady rhythm.
          </p>
          <div className="mt-[28px] flex flex-wrap gap-[26px]">
            <StatMini colorClass="text-blue-light" value="5×" label="DAILY ANCHORS" />
            <StatMini colorClass="text-teal-light" value="1°" label="QIBLA PRECISION" />
            <StatMini colorClass="text-gold" value="10 min" label="EARLY REMINDERS" />
          </div>
        </div>
      </div>
    </div>
  );
}
