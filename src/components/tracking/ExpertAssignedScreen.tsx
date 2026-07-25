import { useEffect } from "react";
import { Phone, MessageCircle, Star, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedAddress } from "../BookingSummaryScreen";

export function ExpertAssignedScreen({
  bookingId,
  address,
  onSimulateArrived,
  currentStatus,
}: {
  bookingId: string | null;
  address: SelectedAddress;
  onSimulateArrived: () => void;
  currentStatus?: string;
}) {
  const isWaitingForAssignment = currentStatus === "accepted";

  useEffect(() => {
    if (!bookingId) return;
    // Don't downgrade or force-advance if staff has only accepted (not yet assigned an expert).
    if (isWaitingForAssignment) return;
    supabase
      .rpc("advance_booking_status", { _booking_id: bookingId, _new_status: "expert_assigned" })
      .then(({ error }) => {
        if (error) console.error("status update failed:", error);
      });
  }, [bookingId, isWaitingForAssignment]);

  const mapSrc =
    address.latitude && address.longitude
      ? `https://staticmap.openstreetmap.de/staticmap.php?center=${address.latitude},${address.longitude}&zoom=15&size=600x300&markers=${address.latitude},${address.longitude},red-pushpin`
      : null;

  return (
    <main className="min-h-screen w-full bg-background pb-8">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <h1 className="text-lg font-bold text-foreground">
          {isWaitingForAssignment ? "Waiting for expert assignment" : "Expert on the way"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">Booking #{bookingId?.slice(0, 8) ?? "—"}</p>


        {/* Expert card */}
        <section className="mt-5 rounded-[18px] border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-foreground">Rekha Sharma</div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="font-bold text-foreground">4.8</span>
                <span>· Verified Expert</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">ETA</div>
              <div className="text-sm font-bold text-primary">25 mins</div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              aria-label="Call expert"
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-primary px-4 py-3 text-sm font-bold text-primary-foreground active:scale-[0.99]"
            >
              <Phone className="h-4 w-4" />
              Call
            </button>
            <button
              type="button"
              aria-label="Message expert"
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border border-border bg-card px-4 py-3 text-sm font-bold text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </button>
          </div>
        </section>

        {/* Map preview */}
        <section className="mt-5 overflow-hidden rounded-[18px] border border-border bg-card">
          <div className="relative h-48 w-full bg-muted">
            {mapSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mapSrc}
                alt="Expert route preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <MapPin className="h-10 w-10 text-primary" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-primary p-2 shadow-lg">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="text-sm font-bold text-foreground">Expert is on the way</div>
            <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {address.full_address}
            </div>
          </div>
        </section>

        {/* Test-only simulate button */}
        <button
          type="button"
          onClick={onSimulateArrived}
          className="mt-8 w-full rounded-[14px] border-2 border-dashed border-muted-foreground/40 bg-transparent px-4 py-3.5 text-sm font-bold text-muted-foreground active:scale-[0.99]"
        >
          Simulate: Expert Arrived
        </button>
        <p className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground/70">
          Testing aid · will be removed
        </p>
      </div>
    </main>
  );
}
