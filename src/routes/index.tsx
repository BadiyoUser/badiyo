import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadiyoLogo } from "@/components/BadiyoLogo";
import { LoginScreen } from "@/components/LoginScreen";
import { HomeScreen } from "@/components/HomeScreen";
import {
  SlotSelectionScreen,
  type SelectedService,
} from "@/components/SlotSelectionScreen";
import { AddressSelectionScreen } from "@/components/AddressSelectionScreen";
import { BookingSummaryScreen } from "@/components/BookingSummaryScreen";
import { ensureUserRow } from "@/lib/ensureUserRow";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "badiyo — Home cleaning, on demand" },
      { name: "description", content: "Book trusted home cleaning services with badiyo. Fast, reliable, and just a tap away." },
      { property: "og:title", content: "badiyo — Home cleaning, on demand" },
      { property: "og:description", content: "Book trusted home cleaning services with badiyo. Fast, reliable, and just a tap away." },
    ],
  }),
  component: Index,
});

type Phase = "splash" | "splash-out" | "login" | "home" | "slot" | "address" | "summary";

function Index() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("splash-out"), 1800);
    const t2 = setTimeout(() => setPhase("login"), 2300);
    // Ensure a public.users row exists whenever we already have (or gain) a session.
    ensureUserRow().catch((e) => console.error("startup ensureUserRow failed:", e));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        ensureUserRow().catch((e) => console.error("ensureUserRow failed:", e));
      }
    });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {(phase === "splash" || phase === "splash-out") && (
        <div
          className={`fixed inset-0 flex items-center justify-center badiyo-green ${
            phase === "splash-out" ? "animate-fade-out" : ""
          }`}
        >
          <div className="flex flex-col items-center">
            <BadiyoLogo className="w-64 max-w-[70vw] animate-logo-in" />
            <p className="mt-4 text-center text-sm font-light text-white/90">
              हर घर का अपना साथी
            </p>
          </div>
        </div>
      )}
      {phase === "login" && (
        <div className="animate-fade-slide-in">
          <LoginScreen onContinue={() => setPhase("home")} />
        </div>
      )}
      {phase === "home" && (
        <div className="animate-fade-slide-in">
          <HomeScreen
            onBookService={(s) => {
              setSelectedService(s);
              setPhase("slot");
            }}
          />
        </div>
      )}
      {phase === "slot" && selectedService && (
        <div className="animate-fade-slide-in">
          <SlotSelectionScreen
            service={selectedService}
            onBack={() => setPhase("home")}
            onContinue={() => setPhase("address")}
          />
        </div>
      )}
      {phase === "address" && (
        <div className="animate-fade-slide-in">
          <AddressSelectionScreen
            onBack={() => setPhase("slot")}
            onContinue={() => setPhase("summary")}
          />
        </div>
      )}
      {phase === "summary" && (
        <div className="animate-fade-slide-in">
          <BookingSummaryScreen onBack={() => setPhase("address")} />
        </div>
      )}
    </div>
  );
}
