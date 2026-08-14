import { useState } from "react";
import { ArrowLeft, Check, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage, useT, type Lang } from "@/i18n";

const OPTIONS: { value: Lang; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "mr", label: "Marathi", native: "मराठी" },
];

export function LanguageScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { lang, setLang } = useLanguage();
  const [busy, setBusy] = useState<Lang | null>(null);

  async function pick(next: Lang) {
    if (busy) return;
    setBusy(next);
    try {
      await setLang(next);
      toast.success(next === "mr" ? "भाषा बदलली" : "Language updated");
    } catch {
      toast.error(t("language.saveFailed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen w-full bg-background pb-10">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <header className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label={t("common.back")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t("language.title")}</h1>
        </header>

        <p className="mt-3 text-sm text-muted-foreground">{t("language.subtitle")}</p>

        <section className="mt-6 divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card shadow-sm">
          {OPTIONS.map((o) => {
            const active = lang === o.value;
            return (
              <button
                key={o.value}
                onClick={() => pick(o.value)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-muted/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <p className="min-w-0 flex-1 text-sm font-bold text-foreground">
                  {o.native}
                </p>
                {busy === o.value ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : active ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : null}
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
