import { ArrowLeft, ChevronRight, CalendarCheck, Wallet as WalletIcon, User } from "lucide-react";

export function ProfileScreen({
  onBack,
  onOpenBookings,
  onOpenWallet,
}: {
  onBack: () => void;
  onOpenBookings: () => void;
  onOpenWallet: () => void;
}) {
  const items = [
    { key: "bookings", label: "My Bookings", desc: "View past and upcoming services", icon: CalendarCheck, onClick: onOpenBookings },
    { key: "wallet", label: "Wallet", desc: "Badiyo coins & transactions", icon: WalletIcon, onClick: onOpenWallet },
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
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
        </header>

        <section className="mt-6 flex items-center gap-4 rounded-[18px] border border-border bg-card p-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/60 bg-primary/10">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">Hello!</p>
            <p className="text-xs text-muted-foreground">Manage your bookings and rewards</p>
          </div>
        </section>

        <section className="mt-5 space-y-2">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={it.onClick}
              className="flex w-full items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3 text-left transition active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <it.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{it.label}</p>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
