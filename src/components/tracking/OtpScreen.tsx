import { ShieldCheck } from "lucide-react";

export function OtpScreen({
  title,
  subtitle,
  code,
  ctaLabel,
  onContinue,
}: {
  title: string;
  subtitle: string;
  code: string;
  ctaLabel: string;
  onContinue: () => void;
}) {
  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-16">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mt-10 flex justify-center gap-3">
          {code.split("").map((digit, i) => (
            <div
              key={i}
              className="flex h-16 w-14 items-center justify-center rounded-[14px] border-2 border-primary/30 bg-card text-3xl font-bold text-foreground"
            >
              {digit}
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Do not share this code with anyone else
        </p>

        <div className="mt-auto pb-8 pt-10">
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-[14px] border-2 border-dashed border-muted-foreground/40 bg-transparent px-4 py-3.5 text-sm font-bold text-muted-foreground active:scale-[0.99]"
          >
            {ctaLabel}
          </button>
          <p className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground/70">
            Testing aid · will be removed
          </p>
        </div>
      </div>
    </main>
  );
}
