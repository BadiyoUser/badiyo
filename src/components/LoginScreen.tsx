import { useState } from "react";
import { BadiyoLogo } from "./BadiyoLogo";
import { GoogleIcon } from "./GoogleIcon";

export function LoginScreen() {
  const [phone, setPhone] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const isValid = phone.length === 10;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    console.log("Continue with phone:", `+91${phone}`);
  };

  const handleGoogle = () => {
    console.log("Continue with Google");
  };

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-16 pb-10">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="rounded-2xl badiyo-green px-6 py-4">
            <BadiyoLogo className="h-10 w-auto" />
          </div>
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
