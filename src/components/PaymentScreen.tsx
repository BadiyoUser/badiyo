import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedService, SelectedSlot } from "./SlotSelectionScreen";
import type { SelectedAddress } from "./BookingSummaryScreen";

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(
      `script[src="${SCRIPT_SRC}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Status = "loading" | "success" | "failed";

type BookingRow = {
  id: string;
  service_label: string;
  service_duration_minutes: number;
  price: number;
  slot_type: string;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  razorpay_payment_id: string | null;
};

export function PaymentScreen({
  service,
  slot,
  address,
  onBack,
  onDone,
  onTrackBooking,
}: {
  service: SelectedService;
  slot: SelectedSlot;
  address: SelectedAddress;
  onBack: () => void;
  onDone: () => void;
  onTrackBooking: (bookingId: string | null) => void;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [bookingLoadError, setBookingLoadError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const amountPaise = Math.round(Number(service.price) * 100);

  async function createBooking(paymentId: string, orderId: string) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not authenticated");

      const scheduled_date =
        slot.mode === "later" ? new Date(slot.day).toISOString().slice(0, 10) : null;
      const scheduled_time_slot =
        slot.mode === "later" ? `${slot.slotLabel} (${slot.slotRange})` : null;

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: uid,
          address_id: address.id,
          service_duration_minutes: service.duration_minutes,
          service_label: service.duration_label,
          price: service.price,
          slot_type: slot.mode === "now" ? "now" : "scheduled",
          scheduled_date,
          scheduled_time_slot,
          status: "confirmed",
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
        })
        .select(
          "id, service_label, service_duration_minutes, price, slot_type, scheduled_date, scheduled_time_slot, razorpay_payment_id",
        )
        .single();

      if (error) throw error;
      setBookingId(data.id);
      setBooking(data as BookingRow);
    } catch (e) {
      console.error("Failed to create booking record:", e);
      setBookingLoadError(
        "Booking saved, but there was an issue loading details - check My Bookings",
      );
    }
  }

  async function startCheckout() {
    setStatus("loading");
    setErrorMsg(null);
    setBookingLoadError(null);
    try {
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        throw new Error("Failed to load Razorpay Checkout");
      }

      const receipt = `bk_${Date.now()}`;
      const { data, error } = await supabase.functions.invoke(
        "create-razorpay-order",
        { body: { amount: amountPaise, currency: "INR", receipt } },
      );
      if (error) throw new Error(error.message);
      if (!data?.order_id || !data?.key_id) {
        throw new Error("Invalid order response");
      }

      const { data: userData } = await supabase.auth.getUser();
      const contact = userData.user?.phone || undefined;

      const rzp = new window.Razorpay({
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        name: "badiyo",
        description: service.duration_label,
        prefill: { contact },
        theme: { color: "#00B97A" },
        handler: (resp) => {
          setStatus("success");
          void createBooking(resp.razorpay_payment_id, resp.razorpay_order_id);
        },
        modal: {
          ondismiss: () => {
            setErrorMsg("Payment cancelled");
            setStatus("failed");
          },
        },
      });
      rzp.open();
    } catch (e) {
      console.error("Razorpay checkout error", e);
      setErrorMsg((e as Error).message || "Something went wrong");
      setStatus("failed");
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch booking by id (supports refresh scenarios in-session)
  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, service_label, service_duration_minutes, price, slot_type, scheduled_date, scheduled_time_slot, razorpay_payment_id",
        )
        .eq("id", bookingId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Failed to fetch booking:", error);
        setBookingLoadError(
          "Booking saved, but there was an issue loading details - check My Bookings",
        );
        return;
      }
      if (data) setBooking(data as BookingRow);
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const displayLabel = booking?.service_label ?? service.duration_label;
  const displayPrice = booking?.price ?? service.price;
  const displayWhen = booking
    ? booking.slot_type === "now"
      ? "Now · arriving in 30–45 mins"
      : `${booking.scheduled_date ?? ""} · ${booking.scheduled_time_slot ?? ""}`
    : slot.mode === "now"
      ? "Now · arriving in 30–45 mins"
      : `${slot.day} · ${slot.slotLabel} (${slot.slotRange})`;
  const displayPaymentId = booking?.razorpay_payment_id ?? null;

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        {status !== "success" && (
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-base font-bold text-foreground">Payment</h1>
          </div>
        )}

        {status === "loading" && (
          <div className="mt-24 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Opening secure checkout…
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 animate-logo-in">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-foreground">
              Booking Confirmed
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment was successful.
            </p>
            {displayPaymentId && (
              <p className="mt-1 text-xs text-muted-foreground">
                Payment ID: {displayPaymentId}
              </p>
            )}
            {bookingId && (
              <p className="mt-1 text-xs text-muted-foreground">
                Booking ID: {bookingId.slice(0, 8)}
              </p>
            )}

            {bookingLoadError && (
              <div className="mt-4 flex w-full items-start gap-2 rounded-[14px] border border-border bg-card p-3 text-left">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {bookingLoadError}
                </p>
              </div>
            )}

            <section className="mt-8 w-full rounded-[18px] border border-border bg-card p-5 text-left">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Service
              </div>
              <div className="mt-1 text-base font-bold text-foreground">
                {displayLabel}
              </div>
              {service.subtitle && (
                <div className="text-xs text-muted-foreground">
                  {service.subtitle}
                </div>
              )}

              <div className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                When
              </div>
              <div className="mt-1 text-sm text-foreground">{displayWhen}</div>

              <div className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Address
              </div>
              <div className="mt-1 text-sm text-foreground">
                {address.label || "Address"}
              </div>
              <div className="text-xs text-muted-foreground">
                {address.full_address}
              </div>

              <div className="my-4 h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  Total paid
                </span>
                <span className="text-sm font-bold text-foreground">
                  Rs {displayPrice}
                </span>
              </div>
            </section>

            <button
              onClick={onDone}
              className="mt-8 w-full rounded-[14px] bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-foreground">
              Payment Failed
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {errorMsg || "Your payment could not be completed."}
            </p>
            <button
              onClick={startCheckout}
              className="mt-8 w-full rounded-[14px] bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.99]"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="mt-3 w-full rounded-[14px] border border-border bg-card px-4 py-3.5 text-sm font-bold text-foreground"
            >
              Back to Summary
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
