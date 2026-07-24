import { useMemo, useState } from "react";
import { ArrowLeft, Clock } from "lucide-react";

export type SelectedService = {
  duration_label: string;
  price: number;
  subtitle: string | null;
  icon: string | null;
};

export type SelectedSlot =
  | { mode: "now" }
  | { mode: "later"; day: string; slotId: "morning" | "afternoon" | "evening"; slotLabel: string; slotRange: string };

type Mode = "now" | "later";
type TimeSlot = "morning" | "afternoon" | "evening";

const TIME_SLOTS: { id: TimeSlot; label: string; range: string }[] = [
  { id: "morning", label: "Morning", range: "9 – 12" },
  { id: "afternoon", label: "Afternoon", range: "12 – 4" },
  { id: "evening", label: "Evening", range: "4 – 8" },
];

function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export function SlotSelectionScreen({
  service,
  onBack,
  onContinue,
}: {
  service: SelectedService;
  onBack: () => void;
  onContinue: (slot: SelectedSlot) => void;
}) {
  const [mode, setMode] = useState<Mode>("now");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const days = useMemo(getNext7Days, []);

  const canContinue =
    mode === "now" || (selectedDay !== null && selectedSlot !== null);

  return (
    <main className="min-h-screen w-full bg-background pb-28">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-sm font-bold text-foreground">
            {service.duration_label} · Rs {service.price}
          </h1>
        </div>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-[14px] border border-border bg-card p-1">
          {(["now", "later"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-[10px] px-4 py-2.5 text-sm font-bold transition ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {m === "now" ? "Book Now" : "Schedule Later"}
            </button>
          ))}
        </div>

        {/* Book Now content */}
        {mode === "now" && (
          <div className="mt-6 flex items-start gap-4 rounded-[18px] border border-border bg-card p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-base font-bold text-foreground">
                Expert will arrive shortly
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Within 30 – 45 minutes at your location
              </p>
            </div>
          </div>
        )}

        {/* Schedule Later content */}
        {mode === "later" && (
          <>
            <h2 className="mt-6 text-sm font-bold text-foreground">
              Choose a day
            </h2>
            <div className="mt-3 -mx-5 overflow-x-auto px-5">
              <div className="flex gap-2 pb-1">
                {days.map((d) => {
                  const key = d.toDateString();
                  const active = selectedDay === key;
                  const weekday = d.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(key)}
                      className={`flex min-w-[64px] flex-col items-center rounded-[14px] border px-3 py-3 text-center transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      <span className="text-xs font-semibold text-muted-foreground">
                        {weekday}
                      </span>
                      <span className="mt-1 text-lg font-bold">
                        {d.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <h2 className="mt-6 text-sm font-bold text-foreground">
              Choose a time
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = selectedSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`rounded-[14px] border px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground"
                    }`}
                  >
                    {slot.label}{" "}
                    <span className="font-normal text-muted-foreground">
                      {slot.range}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Fixed continue button */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card">
        <div className="mx-auto w-full max-w-md px-5 py-4">
          <button
            disabled={!canContinue}
            onClick={() => {
              if (mode === "now") {
                onContinue({ mode: "now" });
              } else if (selectedDay && selectedSlot) {
                const s = TIME_SLOTS.find((x) => x.id === selectedSlot)!;
                onContinue({
                  mode: "later",
                  day: selectedDay,
                  slotId: selectedSlot,
                  slotLabel: s.label,
                  slotRange: s.range,
                });
              }
            }}
            className={`w-full rounded-[14px] px-4 py-3.5 text-sm font-bold transition ${
              canContinue
                ? "bg-primary text-primary-foreground active:scale-[0.99]"
                : "bg-primary/30 text-primary-foreground/70"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </main>
  );
}
