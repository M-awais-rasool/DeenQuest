import { Eyebrow } from "./primitives";

function Testimonial({
  quote,
  avatarGradient,
  avatarColor,
  initial,
  name,
  meta,
}: {
  quote: string;
  avatarGradient: string;
  avatarColor: string;
  initial: string;
  name: string;
  meta: string;
}) {
  return (
    <div className="min-w-[280px] flex-1 rounded-[24px] border border-line2 bg-panel p-7">
      <div className="font-serif text-[15px] tracking-[3px] text-gold">★★★★★</div>
      <div className="mt-4 text-[15.5px] leading-[1.7] font-semibold text-body2">{quote}</div>
      <div className="mt-[22px] flex items-center gap-[12px]">
        <div
          className="grid h-[44px] w-[44px] place-items-center rounded-full text-[17px] font-black"
          style={{ background: avatarGradient, color: avatarColor }}
        >
          {initial}
        </div>
        <div>
          <div className="text-[14px] font-extrabold text-heading">{name}</div>
          <div className="text-[12px] font-semibold text-faint">{meta}</div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <div className="border-t border-line bg-ink2">
      <div className="mx-auto max-w-[1180px] px-8 py-[100px]">
        <div className="text-center">
          <Eyebrow className="text-gold">LOVED AROUND THE WORLD</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            Stories from the ummah
          </h2>
        </div>
        <div className="stagger mt-[50px] flex flex-wrap gap-[24px]">
          <Testimonial
            quote={'"I\'m 34 and always felt embarrassed that I couldn\'t read the Qur\'an. DeenQuest let me learn privately, five minutes at a time. Last Ramadan I read from the mushaf for the first time. I cried."'}
            avatarGradient="linear-gradient(135deg,#2CC9B5,#6EC1E8)"
            avatarColor="#06302B"
            initial="S"
            name="Sarah K."
            meta="London · 156-day streak"
          />
          <Testimonial
            quote={'"My kids fight over who gets to do their lesson first. FIGHT. Over Qaida practice. The mini-games and the duels did what two years of Sunday school couldn\'t."'}
            avatarGradient="linear-gradient(135deg,#F79A59,#F27FB2)"
            avatarColor="#3A1024"
            initial="A"
            name="Ahmed R."
            meta="Toronto · father of 3"
          />
          <Testimonial
            quote={'"The AI coach caught that I rush my long vowels — something even my teacher missed. Two weeks of its little practice drills and my tajweed genuinely transformed."'}
            avatarGradient="linear-gradient(135deg,#A78BFA,#6EC1E8)"
            avatarColor="#241A45"
            initial="F"
            name="Fatima Z."
            meta="Kuala Lumpur · hifz student"
          />
        </div>
      </div>
    </div>
  );
}
