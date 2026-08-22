import { createFileRoute, Link } from "@tanstack/react-router";
import { Bullets, LegalLayout, Section } from "@/components/legal/LegalLayout";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({
    meta: [
      { title: "Terms of Service — DeenQuest" },
      {
        name: "description",
        content: "The rules for using DeenQuest, in plain language.",
      },
    ],
  }),
});

const CONTACT = "support@deenquest.online";

function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="23 August 2026"
      intro="These are the rules for using DeenQuest. By creating an account or using the app you agree to them. We have kept them short and in plain language."
    >
      <Section title="Your account">
        <p>
          You sign in with Google or Apple — DeenQuest has no passwords of its
          own. You are responsible for keeping access to that Google or Apple
          account secure, because anyone who can sign into it can reach your
          DeenQuest account.
        </p>
        <p>
          One account is meant for one person. If you think someone else has
          access, open Settings → Devices and sign the unknown device out, then
          email us at{" "}
          <a className="font-bold text-teal" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section title="Using DeenQuest">
        <p>You agree not to:</p>
        <Bullets
          items={[
            "Use the app to break the law, or to harass, abuse or impersonate anyone.",
            "Cheat the XP, streak, leaderboard or challenge systems, or use bots and scripts against our servers.",
            "Try to break into, overload, or reverse-engineer our services.",
            "Copy or redistribute the app's lessons and content as your own product.",
          ]}
        />
        <p>
          If you break these rules we may suspend or remove your account. Where
          it is reasonable to do so, we will tell you why first.
        </p>
      </Section>

      <Section title="Content in the app">
        <p>
          Qur'anic text and recitation audio come from established public
          sources, and we credit them where required. The lessons, artwork,
          mascot, and the app itself belong to DeenQuest and may not be copied or
          resold.
        </p>
        <p>
          We work to keep the Qur'anic content and translations accurate. If you
          spot a mistake, please tell us — corrections matter to us and we will
          fix them quickly.
        </p>
      </Section>

      <Section title="The recitation coach">
        <p>
          The recitation coach is an automated learning aid. It can be wrong, and
          it is not a replacement for a qualified teacher. Please treat its
          feedback as practice guidance, not a ruling on your recitation.
        </p>
      </Section>

      <Section title="Availability">
        <p>
          We work to keep DeenQuest running, but we do not promise it will be
          available without interruption. We may add, change or remove features
          over time. If we ever discontinue the service, we will give notice and
          a way to export your data.
        </p>
      </Section>

      <Section title="Payments">
        <p>
          The core of DeenQuest is free. If we introduce paid features, the price
          and what is included will be shown clearly before you pay, and
          purchases will be handled by the App Store or Google Play under their
          own refund rules.
        </p>
      </Section>

      <Section title="Ending your account">
        <p>
          You can delete your account at any time from Settings → Delete Account,
          or by emailing{" "}
          <a className="font-bold text-teal" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          . Deleting removes your account and learning data. Your streak, XP and
          progress cannot be restored afterwards.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          DeenQuest is provided as-is. To the extent the law allows, we are not
          liable for indirect or incidental losses arising from your use of the
          app. Nothing here limits rights you have that cannot be limited by law.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If we change these terms we will update this page and the date at the
          top. Continuing to use DeenQuest after a change means you accept the
          updated terms.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms:{" "}
          <a className="font-bold text-teal" href={`mailto:${CONTACT}`}>
            {CONTACT}
          </a>
          . See also our{" "}
          <Link className="font-bold text-teal" to="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
