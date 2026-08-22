import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bullets,
  DataRow,
  LegalLayout,
  Section,
} from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy Policy — DeenQuest" },
      {
        name: "description",
        content:
          "What DeenQuest collects, why, how long we keep it, and how to delete your account.",
      },
    ],
  }),
});

const CONTACT = "support@deenquest.online";

function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="23 August 2026"
      intro="DeenQuest is a Qur'an learning app. This page explains exactly what we collect, why we collect it, how long we keep it, and how you can get it deleted. We do not sell your data and we do not use it for advertising."
    >
      <Section title="Who we are">
        <p>
          DeenQuest ("we", "us") provides the DeenQuest mobile app and this
          website. If you have any question about this policy, email us at{" "}
          <a className="font-bold text-teal" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section title="What we collect and why">
        <p>
          We only collect what the app needs in order to work. Each item below is
          tied to a specific feature.
        </p>

        <div className="grid gap-3">
          <DataRow
            what="Your name, email address and profile picture"
            why="Received from Google or Apple when you sign in. We use them to create your account, show your name and picture in the app, and recognise you when you sign in again on another device. We never receive your Google or Apple password."
            keptFor="As long as your account exists"
          />
          <DataRow
            what="Your learning progress"
            why="Lessons completed, XP, levels, streaks, memorisation (hifz) schedule and rewards. This is what lets the app show your progress, keep your streak alive and place you on the leaderboard."
            keptFor="As long as your account exists"
          />
          <DataRow
            what="Recitation audio"
            why="When you use the recitation coach, your recording is sent to our speech service so it can be compared with the verse and give you feedback. The audio is processed to produce that feedback and is not used to train anyone else's models."
            keptFor="Processed and discarded; only the resulting score is stored"
          />
          <DataRow
            what="Approximate location"
            why="Only if you turn on prayer times. Your device's location is used to calculate accurate prayer times for where you are. You can refuse this permission and the rest of the app works normally."
            keptFor="Not stored on our servers"
          />
          <DataRow
            what="Notification token"
            why="If you allow notifications, your device gets an anonymous push token so we can send prayer and streak reminders. Turning notifications off in your phone settings stops this."
            keptFor="Until you disable notifications or delete your account"
          />
          <DataRow
            what="Sign-in sessions"
            why="For each device you sign in on we store a device label and a one-way hash of a session token. This powers the Devices screen, so you can see where you are signed in and sign out a lost phone remotely. The token itself is never stored in a readable form."
            keptFor="60 days, or until you sign that device out"
          />
        </div>
      </Section>

      <Section title="What we do not do">
        <Bullets
          items={[
            "We do not sell or rent your personal information to anyone.",
            "We do not use your data for advertising, and we do not run third-party ad trackers in the app.",
            "We do not ask for or store passwords — signing in goes through Google or Apple.",
            "We do not request access to your contacts, photos, files, calendar, or any Google service beyond your basic profile.",
          ]}
        />
      </Section>

      <Section title="What we ask Google and Apple for">
        <p>
          When you sign in with Google we request three basic permissions only:{" "}
          <span className="font-bold text-body2">openid</span>,{" "}
          <span className="font-bold text-body2">email</span> and{" "}
          <span className="font-bold text-body2">profile</span>. That gives us
          your name, email address and profile picture — nothing else. We have no
          access to your Gmail, Drive, Contacts, Calendar or any other Google
          service.
        </p>
        <p>
          Sign in with Apple gives us your name and email address. If you choose
          Apple's "Hide My Email", we only ever see the private relay address,
          and that works fine.
        </p>
        <p>
          DeenQuest's use of information received from Google APIs follows the{" "}
          <a
            className="font-bold text-teal"
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including its Limited Use requirements.
        </p>
      </Section>

      <Section title="Who else can see your data">
        <p>We share data only with the services that make the app run:</p>
        <Bullets
          items={[
            <>
              <span className="font-bold text-body2">Google and Apple</span> —
              they verify who you are when you sign in.
            </>,
            <>
              <span className="font-bold text-body2">Our hosting and database providers</span>{" "}
              — they store your account and progress on our behalf.
            </>,
            <>
              <span className="font-bold text-body2">Expo push notifications</span>{" "}
              — delivers reminders to your device, if you enable them.
            </>,
            <>
              <span className="font-bold text-body2">Our speech service</span> —
              processes recitation audio to produce feedback.
            </>,
          ]}
        />
        <p>
          Other players can see your display name, profile picture, level and XP
          on the leaderboard and in challenges. They cannot see your email
          address.
        </p>
      </Section>

      <Section title="How we protect it">
        <Bullets
          items={[
            "All traffic between the app and our servers is encrypted in transit.",
            "Session tokens are stored on your device in the system keychain (iOS) or keystore (Android), and only as a one-way hash on our servers.",
            "Sessions expire and rotate automatically. If a session token is ever reused, that whole device session is revoked immediately.",
            "Only your own account can see or revoke your sessions.",
          ]}
        />
      </Section>

      <Section title="Your choices">
        <Bullets
          items={[
            <>
              <span className="font-bold text-body2">See your devices</span> —
              Settings → Devices shows everywhere you are signed in, and lets you
              sign any of them out.
            </>,
            <>
              <span className="font-bold text-body2">Turn features off</span> —
              location and notifications can be refused or revoked in your phone's
              settings at any time; the rest of the app keeps working.
            </>,
            <>
              <span className="font-bold text-body2">Delete your account</span> —
              Settings → Delete Account removes your account and its learning data
              from our systems. You can also email{" "}
              <a className="font-bold text-teal" href={`mailto:${CONTACT}`}>
                {CONTACT}
              </a>{" "}
              and we will do it for you.
            </>,
            <>
              <span className="font-bold text-body2">Get a copy of your data</span>{" "}
              — email us and we will send you what we hold.
            </>,
          ]}
        />
      </Section>

      <Section title="Children">
        <p>
          DeenQuest is built to be used by families, and younger children should
          use it with a parent or guardian's involvement. If you believe a child
          has created an account without a parent's permission, email{" "}
          <a className="font-bold text-teal" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>{" "}
          and we will remove it.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we change how we handle your data we will update this page and move
          the "last updated" date at the top. If the change is significant we
          will tell you in the app.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions, data requests or deletion requests:{" "}
          <a className="font-bold text-teal" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          . You can also read our{" "}
          <Link className="font-bold text-teal" to="/terms">
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
