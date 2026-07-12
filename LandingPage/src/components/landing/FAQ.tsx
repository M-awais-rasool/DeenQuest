import { Eyebrow } from "./primitives";

function FaqItem({
  badgeClass,
  question,
  answer,
}: {
  badgeClass: string;
  question: string;
  answer: string;
}) {
  return (
    <div className="rounded-[20px] border border-line2 bg-panel px-[26px] py-[24px]">
      <div className="flex items-center gap-[14px]">
        <span
          className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] text-[15px] font-black ${badgeClass}`}
        >
          ?
        </span>
        <span className="text-[17px] font-black text-heading">{question}</span>
      </div>
      <div className="mt-[12px] pl-[48px] text-[15px] leading-[1.7] font-semibold text-body">
        {answer}
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <div className="border-t border-line bg-ink2">
      <div className="mx-auto max-w-[860px] px-8 py-[100px]">
        <div className="text-center">
          <Eyebrow className="text-purple">QUESTIONS</Eyebrow>
          <h2 className="mt-[14px] text-[32px] leading-[1.15] font-black text-heading sm:text-[42px]">
            Asked with love, answered honestly
          </h2>
        </div>
        <div className="stagger mt-[48px] flex flex-col gap-[14px]">
          <FaqItem
            badgeClass="bg-teal-tint text-teal-light"
            question="I'm a complete beginner — is this for me?"
            answer="Especially for you. The path starts at أ — the very first letter — and assumes nothing. Most beginners read their first full word within a week."
          />
          <FaqItem
            badgeClass="bg-gold-tint text-gold"
            question="Is gamifying the Qur'an… okay?"
            answer="We drew a careful line: games live in the learning zone, where you master letters and tajweed. The Qur'an reader itself has no XP, no timers, no confetti — only calm. Scholars reviewed every design decision."
          />
          <FaqItem
            badgeClass="bg-purple-tint text-purple-light"
            question="How does the AI coach hear my recitation?"
            answer="You recite into your phone; the coach scores clarity, pace and makhraj on-device where possible. Your voice is never sold, shared, or used for anything but your own feedback."
          />
          <FaqItem
            badgeClass="bg-pink-tint text-pink-light"
            question="Is it safe for my kids?"
            answer="Yes — no ads, no strangers, no open chat. Duels are invite-only, and Parent Mode gives you full visibility into progress, time spent and accuracy."
          />
          <FaqItem
            badgeClass="bg-[#16303E] text-blue-light"
            question="What if I miss a day?"
            answer="Life happens — that's what streak freezes are for. And if the streak does break, the path remembers everything you've learned. You never start over."
          />
        </div>
      </div>
    </div>
  );
}
