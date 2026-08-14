import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const TABS = ["About", "Terms", "Privacy"] as const;
type Tab = (typeof TABS)[number];

const CONTENT: Record<Tab, { title: string; paragraphs: string[] }> = {
  About: {
    title: "About badiyos",
    paragraphs: [
      "badiyos is your trusted home cleaning companion. We connect households with verified, background-checked cleaning experts who deliver quality service on demand.",
      "Our mission is to make home care effortless — book in seconds, pay securely, and relax while our experts handle the rest.",
      "Founded with a focus on quality and reliability, badiyos serves thousands of homes across the region.",
    ],
  },
  Terms: {
    title: "Terms of Service",
    paragraphs: [
      "By using badiyos, you agree to these Terms. Services are provided by independent experts partnered with badiyos.",
      "You are responsible for providing accurate address details and being available at the scheduled time.",
      "Cancellations within 1 hour of the scheduled slot may incur a small fee. Refunds are processed within 5-7 business days.",
      "badiyos reserves the right to update pricing, service coverage, and these terms with prior notice.",
    ],
  },
  Privacy: {
    title: "Privacy Policy",
    paragraphs: [
      "We respect your privacy. Personal information you provide (name, phone, address) is used solely to fulfil bookings and improve your experience.",
      "We never sell your data to third parties. Payment details are handled securely by our payment partner and are not stored on our servers.",
      "You can request deletion of your account and associated data at any time from the Settings screen.",
      "For any privacy concerns, contact us via the Help & Support screen.",
    ],
  },
};

export function AboutScreen({ onBack, initialTab = "About" }: { onBack: () => void; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const content = CONTENT[tab];

  return (
    <main className="min-h-screen w-full bg-background pb-10">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <header className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">About & Legal</h1>
        </header>

        <div className="mt-6 flex rounded-[14px] border border-border bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-[10px] py-2 text-xs font-bold transition ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="mt-6">
          <h2 className="text-base font-bold text-foreground">{content.title}</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {content.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
