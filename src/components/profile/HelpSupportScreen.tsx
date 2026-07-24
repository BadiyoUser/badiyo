import { ArrowLeft, ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    q: "How do I book a cleaning?",
    a: "From the Home screen, pick a service, choose Now or Schedule Later, confirm your address, and proceed to payment.",
  },
  {
    q: "Can I reschedule or cancel a booking?",
    a: "You can manage upcoming bookings from My Bookings. Cancellations are free up to 1 hour before the scheduled slot.",
  },
  {
    q: "How do payments work?",
    a: "Payments are handled securely through Razorpay. You'll only be charged after your booking is confirmed.",
  },
  {
    q: "What are Badiyo coins?",
    a: "Coins are rewards earned by completing missions and referring friends. Use them to get discounts on future bookings.",
  },
  {
    q: "How do I contact my expert?",
    a: "Once an expert is assigned, you'll see call and message options on the tracking screen.",
  },
];

export function HelpSupportScreen({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(0);

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
          <h1 className="text-lg font-bold text-foreground">Help & Support</h1>
        </header>

        <h2 className="mt-6 text-sm font-bold text-foreground">Frequently Asked Questions</h2>
        <section className="mt-3 divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card shadow-sm">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left"
                >
                  <p className="min-w-0 flex-1 text-sm font-bold text-foreground">{f.q}</p>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</div>
                )}
              </div>
            );
          })}
        </section>

        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="mt-6 flex items-center gap-3 rounded-[18px] bg-primary/10 p-4"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">Chat with us</p>
            <p className="text-xs text-muted-foreground">We typically reply within a few minutes on WhatsApp</p>
          </div>
        </a>
      </div>
    </main>
  );
}
