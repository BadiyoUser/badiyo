import { useState } from "react";
import { BadiyoLogo } from "./BadiyoLogo";
import { GoogleIcon } from "./GoogleIcon";
import { supabase } from "@/integrations/supabase/client";

export function LoginScreen({ onContinue }: { onContinue?: () => void } = {}) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const isValid = phone.length === 10;

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data: existing } = await supabase.auth.getSession();
      let userId = existing.session?.user.id ?? null;
      if (!userId) {
        const { data, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
        userId = data.user?.id ?? null;
      }
      if (!userId) throw new Error("Could not create session");

      const { error: upsertError } = await supabase
        .from("users")
        .upsert({ id: userId, phone: `+91${phone}` }, { onConflict: "id" });
      if (upsertError) throw upsertError;

      onContinue?.();
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    console.log("Continue with Google");
    onContinue?.();
  };

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-16 pb-10">
        {/* Logo */}
        <div className="flex justify-center">
          <BadiyoLogo variant="green" className="h-12 w-auto" />
        </div>

        {/* Heading */}
        <div className="mt-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome to badiyo
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to book trusted home cleaning services
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleContinue} className="mt-10 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-foreground">
              Mobile number
            </span>
            <div className="flex items-center gap-2 rounded-[14px] border border-border bg-card px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
              <span className="text-sm font-semibold text-foreground select-none">
                +91
              </span>
              <span className="h-5 w-px bg-border" />
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full rounded-[14px] bg-primary px-4 py-3.5 text-base font-bold text-primary-foreground transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3.5 text-base font-semibold text-foreground transition hover:bg-muted active:scale-[0.99]"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
          By continuing, you agree to badiyo's Terms & Privacy Policy.
        </p>
      </div>
    </main>
  );
}
