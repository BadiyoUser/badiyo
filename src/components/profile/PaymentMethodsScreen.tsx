import { ArrowLeft, CreditCard, Smartphone } from "lucide-react";

export function PaymentMethodsScreen({ onBack }: { onBack: () => void }) {
  const methods = [
    { key: "upi", label: "UPI", desc: "Pay via any UPI app", Icon: Smartphone },
    { key: "cards", label: "Cards", desc: "Credit or debit cards", Icon: CreditCard },
  ];

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
          <h1 className="text-lg font-bold text-foreground">Payment Methods</h1>
        </header>

        <p className="mt-5 text-xs text-muted-foreground">
          Add a preferred payment method for faster checkout. You can also pick a method at
          checkout via Razorpay.
        </p>

        <section className="mt-4 space-y-2">
          {methods.map((m) => (
            <div
              key={m.key}
              className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <m.Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-[12px] border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
              >
                Add
              </button>
            </div>
          ))}
        </section>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Saved methods will be used to speed up future bookings.
        </p>
      </div>
    </main>
  );
}
