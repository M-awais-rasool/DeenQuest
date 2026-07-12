import { Eyebrow, IconRow } from "./primitives";

function MemoryRow({
  name,
  pct,
  barClass,
  label,
  labelClass,
}: {
  name: string;
  pct: string;
  barClass: string;
  label: string;
  labelClass: string;
}) {
  return (
    <div className="flex items-center gap-[12px]">
      <span className="w-[62px] font-arabic text-[17px] font-bold text-body" dir="rtl">
        {name}
      </span>
      <div className="h-[8px] flex-1 overflow-hidden rounded-[5px] bg-[#0F1D20]">
        <div className={`h-full rounded-[5px] ${barClass}`} style={{ width: pct }} />
      </div>
      <span className={`text-[10.5px] font-extrabold ${labelClass}`}>{label}</span>
    </div>
  );
}

export function StoryMemory() {
  return (
    <div className="relative overflow-hidden border-t border-line bg-ink2">
      <div className="pointer-events-none absolute -top-[140px] -right-[120px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(239,182,90,0.1)_0%,rgba(239,182,90,0)_65%)]" />
      <div className="stagger-sides relative mx-auto flex max-w-[1180px] flex-wrap items-center gap-[70px] px-8 py-[100px]">
        {/* text */}
        <div className="min-w-[320px] flex-1">
          <Eyebrow className="text-gold">CHAPTER FIVE · MEMORY</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            What you memorize, you keep forever
          </h2>
          <p className="mt-[18px] text-[16.5px] leading-[1.7] font-semibold text-body">
            Hifz isn't about memorizing once — it's about never forgetting. DeenQuest watches the
            strength of every surah in your heart and calls you back at exactly the right moment,
            before a fading ayah slips away.
          </p>
          <div className="mt-[28px] flex flex-col gap-[13px]">
            <IconRow bgClass="bg-teal-tint" colorClass="text-teal-light" glyph="◈" title="Memory strength" text=" — every surah rated Strong, Fading or Weak" />
            <IconRow bgClass="bg-gold-tint" colorClass="text-gold" glyph="↻" title="Smart reviews" text=" — 5-minute refreshers, timed by science" />
            <IconRow bgClass="bg-purple-tint" colorClass="text-purple-light" glyph="✦" title="142 ayahs by heart" text=" — and counting, one surah at a time" />
          </div>
        </div>

        {/* card */}
        <div className="flex min-w-[320px] flex-1 justify-center">
          <div className="w-[340px] rounded-[28px] border-[1.5px] border-gold bg-panel p-[22px] shadow-[0_30px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(239,182,90,0.1)] animate-[dqFloat_5.5s_ease-in-out_infinite]">
            <div className="flex items-center gap-[14px]">
              <div className="grid h-[74px] w-[74px] flex-none place-items-center rounded-full bg-[conic-gradient(#EFB65A_0_30%,#1B3036_30%_100%)]">
                <div className="flex h-[56px] w-[56px] flex-col items-center justify-center rounded-full bg-panel">
                  <span className="text-[19px] leading-none font-black text-gold">11</span>
                  <span className="text-[8px] font-extrabold text-faint">OF 37</span>
                </div>
              </div>
              <div>
                <div className="text-[16px] font-black text-heading">Surahs memorized</div>
                <div className="text-[12px] font-semibold text-body">An-Nas → Ad-Duha done</div>
              </div>
            </div>
            <div className="mt-[18px] flex flex-col gap-[11px]">
              <MemoryRow name="الناس" pct="95%" barClass="bg-teal" label="Strong" labelClass="text-teal-light" />
              <MemoryRow name="العاديات" pct="54%" barClass="bg-gold" label="Fading" labelClass="text-gold" />
              <MemoryRow name="التين" pct="30%" barClass="bg-coral" label="Weak" labelClass="text-coral" />
            </div>
            <div className="mt-[18px] rounded-[15px] bg-gold py-[13px] text-center text-[13px] font-black tracking-[0.06em] text-[#3A2A08] shadow-[0_4px_0_#c98f35]">
              START REVIEW · 5 MIN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
