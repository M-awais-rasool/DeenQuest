import { Eyebrow } from "./primitives";

export function StoryQuran() {
  return (
    <div
      id="quran"
      className="relative overflow-hidden border-t border-line bg-[linear-gradient(180deg,#081214_0%,#0A1A1E_100%)]"
    >
      <div className="pointer-events-none absolute top-[40px] left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(110,193,232,0.08)_0%,rgba(110,193,232,0)_65%)]" />
      <div className="relative mx-auto max-w-[900px] px-8 py-[100px] text-center">
        <Eyebrow className="text-blue">CHAPTER THREE · STILLNESS</Eyebrow>
        <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
          And when you open the Qur'an…
          <br />
          the game falls silent
        </h2>
        <p className="mx-auto mt-[18px] max-w-[560px] text-[16.5px] leading-[1.7] font-semibold text-body">
          No XP. No timers. No confetti. The Qur'an zone is a calm, dignified space — beautiful Amiri
          script, word-by-word audio from world-class reciters, and translations that stay out of the
          way.
        </p>

        <div className="mx-auto mt-[44px] max-w-[620px] rounded-[28px] border border-[#24505F] bg-panel px-[40px] py-[36px] text-center shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
          <div className="mb-[22px] flex items-center gap-[16px]">
            <span className="h-px flex-1 bg-line2" />
            <span className="font-arabic text-[22px] font-bold text-gold">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>
            <span className="h-px flex-1 bg-line2" />
          </div>
          <div className="font-arabic text-[34px] leading-[2.1] text-heading" dir="rtl">
            تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ
          </div>
          <div className="mt-[14px] text-[15px] leading-[1.7] font-semibold text-body">
            Blessed is He in whose hand is dominion, and He is over all things competent
          </div>
          <div className="mt-[24px] flex items-center justify-center gap-[14px]">
            <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-blue shadow-[0_4px_0_#3E8AB3]">
              <span className="flex gap-1">
                <span className="h-[15px] w-1 rounded-[2px] bg-blue-deep" />
                <span className="h-[15px] w-1 rounded-[2px] bg-blue-deep" />
              </span>
            </div>
            <div className="h-[7px] max-w-[260px] flex-1 overflow-hidden rounded-[4px] bg-[#0F1D20]">
              <div className="h-full w-[32%] rounded-[4px] bg-blue" />
            </div>
            <span className="text-[12.5px] font-extrabold text-body">Mishary Al-Afasy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
