import { useMemo, useState } from "react";
import { X } from "lucide-react";

type TimeSlot = "morning" | "afternoon" | "evening";

const TIME_SLOTS: { id: TimeSlot; label: string; range: string }[] = [
  { id: "morning", label: "Morning", range: "9 – 12" },
  { id: "afternoon", label: "Afternoon", range: "12 – 4" },
  { id: "evening", label: "Evening", range: "4 – 8" },
];

function getNext7Days() {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RescheduleSheet({
  open,
  initialDate,
  initialSlot,
  onClose,
  onConfirm,
  saving,
}: {
  open: boolean;
  initialDate: string | null;
  initialSlot: string | null;
  onClose: () => void;
  onConfirm: (date: string, slotLabel: string) => void;
  saving?: boolean;
}) {
  const days = useMemo(getNext7Days, []);
  const [selectedDay, setSelectedDay] = useState<string | null>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(() => {
    const match = TIME_SLOTS.find((t) => t.label === initialSlot);
    return match?.id ?? null;
  });

  if (!open) return null;

  const canContinue = selectedDay && selectedSlot;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="mx-auto w-full max-w-md animate-slide-up rounded-t-[24px] bg-card p-5 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Reschedule booking</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <h3 className="mt-3 text-sm font-bold text-foreground">Choose a day</h3>
        <div className="mt-2 -mx-1 overflow-x-auto px-1">
          <div className="flex gap-2 pb-1">
            {days.map((d) => {
              const key = toDateKey(d);
              const active = selectedDay === key;
              const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  className={`flex min-w-[60px] flex-col items-center rounded-[14px] border px-3 py-2.5 text-center transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  <span className="text-xs font-semibold text-muted-foreground">{weekday}</span>
                  <span className="mt-1 text-lg font-bold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <h3 className="mt-5 text-sm font-bold text-foreground">Choose a time</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIME_SLOTS.map((slot) => {
            const active = selectedSlot === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`rounded-[14px] border px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground"
                }`}
              >
                {slot.label}{" "}
                <span className="font-normal text-muted-foreground">{slot.range}</span>
              </button>
            );
          })}
        </div>

        <button
          disabled={!canContinue || saving}
          onClick={() => {
            if (!selectedDay || !selectedSlot) return;
            const s = TIME_SLOTS.find((x) => x.id === selectedSlot)!;
            onConfirm(selectedDay, s.label);
          }}
          className={`mt-6 w-full rounded-[14px] px-4 py-3.5 text-sm font-bold transition ${
            canContinue && !saving
              ? "bg-primary text-primary-foreground active:scale-[0.99]"
              : "bg-primary/30 text-primary-foreground/70"
          }`}
        >
          {saving ? "Saving…" : "Confirm reschedule"}
        </button>
      </div>
    </div>
  );
}
