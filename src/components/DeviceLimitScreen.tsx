import { useState } from "react";
import { Smartphone, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatLastActive, registerThisDevice, revokeDevice, type DeviceSession } from "@/lib/devices";
import { getErrorMessage } from "@/lib/errorMessage";

export function DeviceLimitScreen({
  devices,
  onContinue,
  onCancel,
}: {
  devices: DeviceSession[];
  onContinue: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [list, setList] = useState<DeviceSession[]>(devices);

  async function handleLogout(d: DeviceSession) {
    setBusy(d.device_id);
    try {
      await revokeDevice(d.device_id);
      setList((prev) => prev.filter((x) => x.device_id !== d.device_id));
      const res = await registerThisDevice();
      if (res.status === "registered") {
        toast.success("Device logged out. You're all set.");
        onContinue();
      } else {
        setList(res.devices);
      }
    } catch (e) {
      toast.error(await getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    try {
      await supabase.auth.signOut();
    } catch {
      /* noop */
    }
    onCancel();
  }

  return (
    <main className="min-h-screen w-full bg-background pb-10">
      <div className="mx-auto w-full max-w-md px-5 pt-10">
        <h1 className="text-xl font-extrabold text-foreground">Device limit reached</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your badiyos account can be used on 2 devices at a time. Log out of one to continue on this
          device.
        </p>

        <section className="mt-6 divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card shadow-sm">
          {list.map((d) => (
            <div key={d.device_id} className="flex items-center gap-3 px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {d.device_label || "Unknown device"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last active {formatLastActive(d.last_active_at)}
                </p>
              </div>
              <button
                onClick={() => handleLogout(d)}
                disabled={busy !== null}
                className="flex items-center gap-1.5 rounded-[12px] border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive disabled:opacity-50"
              >
                {busy === d.device_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Log out
              </button>
            </div>
          ))}
        </section>

        <button
          onClick={handleCancel}
          className="mt-6 w-full rounded-[14px] border border-border bg-card py-3 text-sm font-bold text-foreground"
        >
          Cancel & sign out
        </button>
      </div>
    </main>
  );
}
