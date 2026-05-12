import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Levels } from "@/components/landing/Levels";
import { DailyTasks } from "@/components/landing/DailyTasks";
import { Gamification } from "@/components/landing/Gamification";
import { MiniGames } from "@/components/landing/MiniGames";
import { Community } from "@/components/landing/Community";
import { Testimonials } from "@/components/landing/Testimonials";
import { Download } from "@/components/landing/Download";
import { Footer } from "@/components/landing/Footer";
import { FloatingNotification } from "@/components/landing/FloatingNotification";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Nuur — Level Up Your Deen | Gamified Islamic Learning" },
      {
        name: "description",
        content:
          "Build Islamic habits, learn Quran Qaida, complete daily missions, and grow spiritually through a fun gamified experience.",
      },
      { property: "og:title", content: "Nuur — Level Up Your Deen" },
      {
        property: "og:description",
        content: "Gamified Islamic learning: Quran Qaida, Hadith, Duas, XP, streaks and levels.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Levels />
      <DailyTasks />
      <Gamification />
      <MiniGames />
      <Community />
      <Testimonials />
      <Download />
      <Footer />
      <FloatingNotification />
    </main>
  );
}
