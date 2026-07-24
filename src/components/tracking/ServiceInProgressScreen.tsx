import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function ServiceInProgressScreen({
  bookingId,
  onSimulateComplete,
}: {
  bookingId: string | null;
  onSimulateComplete: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!bookingId) return;
    supabase
      .from("bookings")
      .update({ status: "in_progress" })
      .eq("id", bookingId)
      .then(({ error }) => {
        if (error) console.error("status update failed:", error);
      });
  }, [bookingId]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pt-16">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mt-6 text-xl font-bold text-foreground">
            Your home is being cleaned
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sit back and relax — we'll notify you when it's done.
          </p>
        </div>

        <div className="mt-10 rounded-[18px] border border-border bg-card p-6 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Time elapsed
          </div>
          <div className="mt-2 font-mono text-4xl font-bold tabular-nums text-foreground">
            {formatTime(elapsed)}
          </div>
        </div>

        <div className="mt-auto pb-8 pt-10">
          <button
            type="button"
            onClick={onSimulateComplete}
            className="w-full rounded-[14px] border-2 border-dashed border-muted-foreground/40 bg-transparent px-4 py-3.5 text-sm font-bold text-muted-foreground active:scale-[0.99]"
          >
            Simulate: Service Complete
          </button>
          <p className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground/70">
            Testing aid · will be removed
          </p>
        </div>
      </div>
    </main>
  );
}
