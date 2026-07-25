import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { captureReferralCode } from "@/lib/referrals";

export const Route = createFileRoute("/invite/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Join badiyo with code ${params.code}` },
      {
        name: "description",
        content:
          "You've been invited to badiyo — trusted home cleaning in Latur. Tap to claim your invite and get started.",
      },
      { property: "og:title", content: `Join badiyo with code ${params.code}` },
      {
        property: "og:description",
        content: "You've been invited to badiyo — trusted home cleaning in Latur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { code } = useParams({ from: "/invite/$code" });
  const navigate = useNavigate();

  useEffect(() => {
    // Persist the referral code so it survives sign-in, then continue to the app.
    captureReferralCode();
    navigate({ to: "/", replace: true });
  }, [code, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-sm">
        <h1 className="text-2xl font-extrabold text-foreground">You're invited to badiyo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Applying invite code <span className="font-bold text-primary">{code}</span>…
        </p>
      </div>
    </main>
  );
}
