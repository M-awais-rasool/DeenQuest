import { Eyebrow } from "./primitives";

function Connector({ active }: { active?: boolean }) {
  return (
    <div
      className={`mb-[30px] hidden h-[4px] w-[70px] rounded-[2px] sm:block ${
        active
          ? "bg-[repeating-linear-gradient(90deg,#2CC9B5_0_8px,transparent_8px_16px)]"
          : "bg-[repeating-linear-gradient(90deg,#2C464C_0_8px,transparent_8px_16px)]"
      }`}
    />
  );
}

export function StoryJourney() {
  return (
    <div id="journey" className="relative overflow-hidden">
      <div className="mx-auto max-w-[1180px] px-8 pt-[110px] pb-[40px] text-center">
        <Eyebrow className="text-gold">YOUR STORY BEGINS</Eyebrow>
        <h2 className="mt-[14px] text-[34px] leading-[1.15] font-black text-heading sm:text-[46px]">
          It starts with a single letter<span className="text-teal">.</span>
        </h2>
        <p className="mx-auto mt-[16px] max-w-[620px] text-[17px] leading-[1.7] font-semibold text-body">
          Remember أ ب ت? That's day one. From the alphabet to your first word, your first ayah, your
          first surah — one small win at a time, on a path built just for you.
        </p>
      </div>

      <div className="stagger mx-auto flex max-w-[1180px] flex-wrap items-center justify-center px-8 pt-[30px] pb-[90px]">
        <div className="flex flex-col items-center gap-[12px] px-2">
          <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-teal shadow-[0_8px_0_#1b9484]">
            <span className="font-arabic text-[38px] font-bold text-teal-deep">أ</span>
          </div>
          <span className="text-[13px] font-extrabold text-heading">Letters</span>
        </div>
        <Connector active />
        <div className="flex flex-col items-center gap-[12px] px-2">
          <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-teal shadow-[0_8px_0_#1b9484]">
            <span className="font-arabic text-[30px] font-bold text-teal-deep">بَ</span>
          </div>
          <span className="text-[13px] font-extrabold text-heading">Harakat</span>
        </div>
        <Connector active />
        <div className="flex flex-col items-center gap-[12px] px-2">
          <div className="grid h-[100px] w-[100px] place-items-center rounded-full bg-gold shadow-[0_9px_0_#c98f35] animate-[dqPulse_2.2s_infinite]">
            <span className="font-arabic text-[30px] font-bold text-[#3A2A08]">تَمْر</span>
          </div>
          <span className="text-[13px] font-black text-gold">Words ← you are here</span>
        </div>
        <Connector />
        <div className="flex flex-col items-center gap-[12px] px-2">
          <div className="grid h-[88px] w-[88px] place-items-center rounded-full border-[3px] border-[#2C464C] bg-panel2">
            <span className="font-arabic text-[26px] font-bold text-faint">آية</span>
          </div>
          <span className="text-[13px] font-extrabold text-faint">Ayahs</span>
        </div>
        <Connector />
        <div className="flex flex-col items-center gap-[12px] px-2">
          <div className="grid h-[88px] w-[88px] place-items-center rounded-full border-[3px] border-[#2C464C] bg-panel2">
            <span className="font-serif text-[30px]">📖</span>
          </div>
          <span className="text-[13px] font-extrabold text-faint">Fluent recitation</span>
        </div>
      </div>
    </div>
  );
}
