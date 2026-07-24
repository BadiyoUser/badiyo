import { ArrowLeft, Clock, Calendar, Home as HomeIcon, Star } from "lucide-react";
import type { BookingRow } from "./MyBookingsScreen";

function statusPillClasses(status: string): string {
  if (status === "completed") return "bg-primary/15 text-primary";
  if (status === "cancelled") return "bg-muted text-muted-foreground";
  return "bg-blue-100 text-blue-700";
}
function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function slotText(b: BookingRow): { title: string; subtitle: string } {
  if (b.slot_type === "now") {
    return { title: "Now", subtitle: "Booked as ASAP service" };
  }
  const day = b.scheduled_date
    ? new Date(b.scheduled_date).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Scheduled";
  return {
    title: b.scheduled_time_slot ? `${day} · ${b.scheduled_time_slot}` : day,
    subtitle: "Scheduled service",
  };
}

export function BookingDetailsScreen({
  booking,
  onBack,
}: {
  booking: BookingRow;
  onBack: () => void;
}) {
  const slot = slotText(booking);
  const addr = booking.addresses;

  return (
    <main className="min-h-screen w-full bg-background pb-10">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <header className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Booking Details</h1>
        </header>

        {/* Status */}
        <div className="mt-5 flex items-center justify-between rounded-[18px] border border-border bg-card p-4 shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="mt-0.5 text-base font-bold text-foreground">
              {statusLabel(booking.status)}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClasses(
              booking.status,
            )}`}
          >
            {statusLabel(booking.status)}
          </span>
        </div>

        {/* Service */}
        <section className="mt-3 rounded-[18px] border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-foreground">
                {booking.service_label}
              </h3>
              <p className="text-xs text-muted-foreground">
                {booking.service_duration_minutes} minutes
              </p>
            </div>
          </div>
        </section>

        {/* Slot */}
        <section className="mt-3 rounded-[18px] border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">When</p>
              <h3 className="truncate text-sm font-bold text-foreground">{slot.title}</h3>
              <p className="text-xs text-muted-foreground">{slot.subtitle}</p>
            </div>
          </div>
        </section>

        {/* Address */}
        {addr && (
          <section className="mt-3 rounded-[18px] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <HomeIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Address</p>
                <h3 className="text-sm font-bold text-foreground">
                  {addr.label ?? "Home"}
                </h3>
                <p className="text-xs text-muted-foreground">{addr.full_address}</p>
                {(addr.area || addr.city) && (
                  <p className="text-xs text-muted-foreground">
                    {[addr.area, addr.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Price breakdown */}
        <section className="mt-3 rounded-[18px] border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">Price breakdown</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Service" value={`Rs ${booking.price}`} />
            <Row label="Taxes & fees" value="Included" muted />
            <div className="my-2 h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Total paid</span>
              <span className="text-base font-bold text-primary">Rs {booking.price}</span>
            </div>
          </div>
        </section>

        {/* Rating (if any) */}
        {booking.rating ? (
          <section className="mt-3 rounded-[18px] border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Your rating</h3>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < (booking.rating ?? 0)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            {booking.review_text && (
              <p className="mt-2 text-sm text-muted-foreground">{booking.review_text}</p>
            )}
          </section>
        ) : null}

        {/* Booking id */}
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Booking ID: {booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-semibold text-foreground"}>
        {value}
      </span>
    </div>
  );
}
