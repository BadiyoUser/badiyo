import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Phone, MapPin, User, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedAddress } from "../BookingSummaryScreen";

type ExpertInfo = {
  id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
} | null;

async function fetchAssignedExpert(bookingId: string): Promise<ExpertInfo> {
  const { data, error } = await supabase
    .from("bookings")
    .select("assigned_expert_id, experts:assigned_expert_id ( id, name, phone, photo_url )")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) {
    console.error("fetchAssignedExpert failed:", error);
    return null;
  }
  const e = (data as { experts?: ExpertInfo } | null)?.experts ?? null;
  return e;
}

export function ExpertAssignedScreen({
  bookingId,
  address,
  currentStatus,
  onShowStartOtp,
}: {
  bookingId: string | null;
  address: SelectedAddress;
  currentStatus?: string;
  onShowStartOtp?: () => void;
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

  const { data: expert } = useQuery({
    queryKey: ["assigned-expert", bookingId],
    queryFn: () => fetchAssignedExpert(bookingId!),
    enabled: !!bookingId && !isWaitingForAssignment,
    staleTime: 30_000,
  });

  const mapSrc =
    address.latitude && address.longitude
      ? `https://staticmap.openstreetmap.de/staticmap.php?center=${address.latitude},${address.longitude}&zoom=15&size=600x300&markers=${address.latitude},${address.longitude},red-pushpin`
      : null;

  return (
    <main className="min-h-screen w-full bg-background pb-8">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <h1 className="text-lg font-bold text-foreground">
          {isWaitingForAssignment ? "Waiting for expert assignment" : "Expert assigned"}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">Booking #{bookingId?.slice(0, 8) ?? "—"}</p>


        {/* Expert card */}
        {isWaitingForAssignment ? (
          <section className="mt-5 rounded-[18px] border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-foreground">Assigning your expert</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Our team has accepted your booking and is assigning the best expert nearby. You'll be notified as soon as they're on the way.
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-[18px] border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {expert?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={expert.photo_url}
                    alt={expert.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <User className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-base font-bold text-foreground">
                  {expert?.name ?? "Your expert"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Verified Expert
                </div>
              </div>
            </div>

            {expert?.phone && (
              <div className="mt-4">
                <a
                  href={`tel:${expert.phone}`}
                  aria-label="Call expert"
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-4 py-3 text-sm font-bold text-primary-foreground active:scale-[0.99]"
                >
                  <Phone className="h-4 w-4" />
                  Call expert
                </a>
              </div>
            )}
            {onShowStartOtp && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={onShowStartOtp}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-primary bg-primary/10 px-4 py-3 text-sm font-bold text-primary active:scale-[0.99]"
                >
                  <KeyRound className="h-4 w-4" />
                  Show start code
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Show this to your expert once they arrive.
                </p>
              </div>
            )}
          </section>
        )}


        {/* Map preview */}
        <section className="mt-5 overflow-hidden rounded-[18px] border border-border bg-card">
          <div className="relative h-48 w-full bg-muted">
            {mapSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mapSrc}
                alt="Service location"
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
            <div className="text-sm font-bold text-foreground">
              {isWaitingForAssignment ? "Waiting for expert assignment" : "Expert assigned"}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {address.full_address}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
