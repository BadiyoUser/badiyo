import { useEffect, useState } from "react";
import { ArrowLeft, Smartphone, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/deviceId";
import { formatLastActive, listMyDevices, revokeDevice, type DeviceSession } from "@/lib/devices";
import { getErrorMessage } from "@/lib/errorMessage";

export function ActiveDevicesScreen({
  onBack,
  onSignedOut,
}: {
  onBack: () => void;
  onSignedOut: () => void;
}) {
  const [devices, setDevices] = useState<DeviceSession[] | null>(null);
  const [thisId, setThisId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [id, list] = await Promise.all([getDeviceId(), listMyDevices()]);
        if (cancelled) return;
        setThisId(id);
        setDevices(list);
      } catch (e) {
        if (!cancelled) {
          setDevices([]);
          toast.error(await getErrorMessage(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout(d: DeviceSession) {
    setBusy(d.device_id);
    try {
      await revokeDevice(d.device_id);
      if (d.device_id === thisId) {
        await supabase.auth.signOut();
        onSignedOut();
        return;
      }
      setDevices((prev) => (prev ?? []).filter((x) => x.device_id !== d.device_id));
      toast.success("Device logged out.");
    } catch (e) {
      toast.error(await getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

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
          <h1 className="text-lg font-bold text-foreground">Active Devices</h1>
        </header>

        <p className="mt-3 text-sm text-muted-foreground">
          Your account can be signed in on up to 2 devices.
        </p>

        {devices === null ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : devices.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">No active devices.</p>
        ) : (
          <section className="mt-5 divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card shadow-sm">
            {devices.map((d) => (
              <div key={d.device_id} className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {d.device_label || "Unknown device"}
                    {d.device_id === thisId && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        This device
                      </span>
                    )}
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
        )}
      </div>
    </main>
  );
}
