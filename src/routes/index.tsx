import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadiyoLogo } from "@/components/BadiyoLogo";
import { LoginScreen } from "@/components/LoginScreen";
import { HomeScreen } from "@/components/HomeScreen";
import {
  SlotSelectionScreen,
  type SelectedService,
  type SelectedSlot,
} from "@/components/SlotSelectionScreen";
import {
  AddressSelectionScreen,
} from "@/components/AddressSelectionScreen";
import {
  BookingSummaryScreen,
  type SelectedAddress,
} from "@/components/BookingSummaryScreen";
import { PaymentScreen } from "@/components/PaymentScreen";
import { ExpertAssignedScreen } from "@/components/tracking/ExpertAssignedScreen";
import { OtpScreen } from "@/components/tracking/OtpScreen";
import { ServiceInProgressScreen } from "@/components/tracking/ServiceInProgressScreen";
import { RateReviewScreen } from "@/components/tracking/RateReviewScreen";
import { MyBookingsScreen, type BookingRow } from "@/components/MyBookingsScreen";
import { BookingDetailsScreen } from "@/components/BookingDetailsScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { WalletScreen } from "@/components/WalletScreen";
import { RewardsScreen } from "@/components/RewardsScreen";
import { EditProfileScreen } from "@/components/profile/EditProfileScreen";
import { NotificationsScreen } from "@/components/profile/NotificationsScreen";
import { SettingsScreen } from "@/components/profile/SettingsScreen";
import { HelpSupportScreen } from "@/components/profile/HelpSupportScreen";
import { AboutScreen } from "@/components/profile/AboutScreen";
import { ReferralDashboardScreen } from "@/components/ReferralDashboardScreen";
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

type Phase =
  | "splash"
  | "splash-out"
  | "login"
  | "home"
  | "slot"
  | "address"
  | "summary"
  | "payment"
  | "expert-assigned"
  | "otp-start"
  | "in-progress"
  | "otp-end"
  | "rate-review"
  | "my-bookings"
  | "booking-details"
  | "profile"
  | "wallet"
  | "rewards"
  | "edit-profile"
  | "notifications"
  | "settings"
  | "help"
  | "about"
  | "referrals";

function Index() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<SelectedAddress | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);

  function resetAndGoHome() {
    setActiveBookingId(null);
    setSelectedService(null);
    setSelectedSlot(null);
    setSelectedAddress(null);
    setPhase("home");
  }

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("splash-out"), 1800);
    const t2 = setTimeout(() => setPhase("login"), 2300);
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
            onOpenProfile={() => setPhase("profile")}
            onOpenRewards={() => setPhase("rewards")}
          />
        </div>
      )}
      {phase === "slot" && selectedService && (
        <div className="animate-fade-slide-in">
          <SlotSelectionScreen
            service={selectedService}
            onBack={() => setPhase("home")}
            onContinue={(slot) => {
              setSelectedSlot(slot);
              setPhase("address");
            }}
          />
        </div>
      )}
      {phase === "address" && (
        <div className="animate-fade-slide-in">
          <AddressSelectionScreen
            onBack={() => setPhase("slot")}
            onContinue={(addr) => {
              setSelectedAddress(addr);
              setPhase("summary");
            }}
          />
        </div>
      )}
      {phase === "summary" && selectedService && selectedSlot && selectedAddress && (
        <div className="animate-fade-slide-in">
          <BookingSummaryScreen
            service={selectedService}
            slot={selectedSlot}
            address={selectedAddress}
            onBack={() => setPhase("address")}
            onEditAddress={() => setPhase("address")}
            onProceedToPay={() => setPhase("payment")}
          />
        </div>
      )}
      {phase === "payment" && selectedService && selectedSlot && selectedAddress && (
        <div className="animate-fade-slide-in">
          <PaymentScreen
            service={selectedService}
            slot={selectedSlot}
            address={selectedAddress}
            onBack={() => setPhase("summary")}
            onDone={resetAndGoHome}
            onTrackBooking={(id) => {
              setActiveBookingId(id);
              setPhase("expert-assigned");
            }}
          />
        </div>
      )}
      {phase === "expert-assigned" && selectedAddress && (
        <div className="animate-fade-slide-in">
          <ExpertAssignedScreen
            bookingId={activeBookingId}
            address={selectedAddress}
            onSimulateArrived={() => setPhase("otp-start")}
          />
        </div>
      )}
      {phase === "otp-start" && (
        <div className="animate-fade-slide-in">
          <OtpScreen
            title="Share this OTP with your expert"
            subtitle="Give this code to your expert to start the service."
            code="4821"
            ctaLabel="Service Started"
            onContinue={() => setPhase("in-progress")}
          />
        </div>
      )}
      {phase === "in-progress" && (
        <div className="animate-fade-slide-in">
          <ServiceInProgressScreen
            bookingId={activeBookingId}
            onSimulateComplete={() => setPhase("otp-end")}
          />
        </div>
      )}
      {phase === "otp-end" && (
        <div className="animate-fade-slide-in">
          <OtpScreen
            title="Share end OTP with your expert"
            subtitle="Give this code to your expert to confirm the service is complete."
            code="7392"
            ctaLabel="Confirm Completion"
            onContinue={() => setPhase("rate-review")}
          />
        </div>
      )}
      {phase === "rate-review" && (
        <div className="animate-fade-slide-in">
          <RateReviewScreen
            bookingId={activeBookingId}
            onSubmit={resetAndGoHome}
          />
        </div>
      )}
      {phase === "my-bookings" && (
        <div className="animate-fade-slide-in">
          <MyBookingsScreen
            onBack={() => setPhase("profile")}
            onGoHome={() => setPhase("home")}
            onOpenBooking={(b) => {
              setSelectedBooking(b);
              setPhase("booking-details");
            }}
          />
        </div>
      )}
      {phase === "booking-details" && selectedBooking && (
        <div className="animate-fade-slide-in">
          <BookingDetailsScreen
            booking={selectedBooking}
            onBack={() => setPhase("my-bookings")}
          />
        </div>
      )}
      {phase === "profile" && (
        <div className="animate-fade-slide-in">
          <ProfileScreen
            onBack={() => setPhase("home")}
            onOpenBookings={() => setPhase("my-bookings")}
            onOpenWallet={() => setPhase("wallet")}
            onOpenEditProfile={() => setPhase("edit-profile")}
            onOpenNotifications={() => setPhase("notifications")}
            onOpenSettings={() => setPhase("settings")}
            onOpenHelp={() => setPhase("help")}
            onOpenAbout={() => setPhase("about")}
            onOpenReferrals={() => setPhase("referrals")}
            onLogout={() => setPhase("login")}
          />
        </div>
      )}
      {phase === "referrals" && (
        <div className="animate-fade-slide-in">
          <ReferralDashboardScreen onBack={() => setPhase("profile")} />
        </div>
      )}
      {phase === "wallet" && (
        <div className="animate-fade-slide-in">
          <WalletScreen onBack={() => setPhase("profile")} />
        </div>
      )}
      {phase === "rewards" && (
        <div className="animate-fade-slide-in">
          <RewardsScreen
            onOpenHome={() => setPhase("home")}
            onOpenRewards={() => setPhase("rewards")}
          />
        </div>
      )}
      {phase === "edit-profile" && (
        <div className="animate-fade-slide-in">
          <EditProfileScreen onBack={() => setPhase("profile")} />
        </div>
      )}
      {phase === "notifications" && (
        <div className="animate-fade-slide-in">
          <NotificationsScreen onBack={() => setPhase("profile")} />
        </div>
      )}
      {phase === "settings" && (
        <div className="animate-fade-slide-in">
          <SettingsScreen
            onBack={() => setPhase("profile")}
            onOpenNotifications={() => setPhase("notifications")}
            onOpenAbout={() => setPhase("about")}
          />
        </div>
      )}
      {phase === "help" && (
        <div className="animate-fade-slide-in">
          <HelpSupportScreen onBack={() => setPhase("profile")} />
        </div>
      )}
      {phase === "about" && (
        <div className="animate-fade-slide-in">
          <AboutScreen onBack={() => setPhase("profile")} />
        </div>
      )}
    </div>
  );
}
