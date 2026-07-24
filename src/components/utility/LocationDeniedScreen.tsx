import { MapPinOff } from "lucide-react";

export function LocationDeniedScreen({
  onEnterManually,
  onBack,
}: {
  onEnterManually: () => void;
  onBack?: () => void;
}) {
  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <MapPinOff className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mt-6 text-xl font-extrabold text-foreground">Location access needed</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          We use your location to match you with nearby experts. You can also enter your address
          manually.
        </p>
        <button
          onClick={onEnterManually}
          className="mt-8 w-full max-w-xs rounded-[14px] bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm active:scale-[0.99]"
        >
          Enter address manually
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-3 text-xs font-semibold text-muted-foreground"
          >
            Go back
          </button>
        )}
      </div>
    </main>
  );
}
