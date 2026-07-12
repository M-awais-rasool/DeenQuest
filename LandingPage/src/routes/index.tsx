import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { StoryJourney } from "@/components/landing/StoryJourney";
import { StoryPlay } from "@/components/landing/StoryPlay";
import { StoryCoach } from "@/components/landing/StoryCoach";
import { StoryQuran } from "@/components/landing/StoryQuran";
import { StoryFamily } from "@/components/landing/StoryFamily";
import { StoryMemory } from "@/components/landing/StoryMemory";
import { StoryRhythm } from "@/components/landing/StoryRhythm";
import { StoryCelebration } from "@/components/landing/StoryCelebration";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/landing/Reveal";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "DeenQuest — The #1 Fun Way to Learn Qur'an" },
      {
        name: "description",
        content:
          "DeenQuest turns learning to read the Qur'an into a joyful daily habit — bite-size lessons, streaks, and an AI coach that hears your recitation.",
      },
      { property: "og:title", content: "DeenQuest — Five minutes a day. A lifetime of light." },
      {
        property: "og:description",
        content:
          "Gamified Qur'an learning: Qaida, hifz, prayer times, an AI recitation coach, XP, streaks and levels.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="relative min-h-screen">
      <Navbar />
      <Reveal variant="up">
        <Hero />
      </Reveal>
      <Reveal variant="fade">
        <StatsStrip />
      </Reveal>
      <Reveal variant="fade">
        <StoryJourney />
      </Reveal>
      <Reveal variant="fade">
        <StoryPlay />
      </Reveal>
      <Reveal variant="fade">
        <StoryCoach />
      </Reveal>
      <Reveal variant="blur">
        <StoryQuran />
      </Reveal>
      <Reveal variant="fade">
        <StoryFamily />
      </Reveal>
      <Reveal variant="fade">
        <StoryMemory />
      </Reveal>
      <Reveal variant="fade">
        <StoryRhythm />
      </Reveal>
      <Reveal variant="fade">
        <StoryCelebration />
      </Reveal>
      <Reveal variant="fade">
        <HowItWorks />
      </Reveal>
      <Reveal variant="fade">
        <FeatureGrid />
      </Reveal>
      <Reveal variant="fade">
        <Pricing />
      </Reveal>
      <Reveal variant="fade">
        <FAQ />
      </Reveal>
      <Reveal variant="fade">
        <Testimonials />
      </Reveal>
      <Reveal variant="scale">
        <FinalCTA />
      </Reveal>
      <Footer />
    </main>
  );
}
