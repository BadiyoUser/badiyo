import { ArrowLeft } from "lucide-react";

export function BookingSummaryScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">
            Booking Summary
          </h1>
        </div>
        <div className="mt-16 text-center text-sm text-muted-foreground">
          Coming soon
        </div>
      </div>
    </main>
  );
}
