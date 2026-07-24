import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadiyoLogo } from "@/components/BadiyoLogo";
import { LoginScreen } from "@/components/LoginScreen";

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

function Index() {
  const [phase, setPhase] = useState<"splash" | "splash-out" | "login">("splash");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("splash-out"), 1800);
    const t2 = setTimeout(() => setPhase("login"), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {phase !== "login" && (
        <div
          className={`fixed inset-0 flex items-center justify-center badiyo-green ${
            phase === "splash-out" ? "animate-fade-out" : ""
          }`}
        >
          <BadiyoLogo className="w-64 max-w-[70vw] animate-logo-in" />
        </div>
      )}
      {phase === "login" && (
        <div className="animate-fade-slide-in">
          <LoginScreen />
        </div>
      )}
    </div>
  );
}
