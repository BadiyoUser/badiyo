import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getDeviceLabel } from "@/lib/deviceId";

export type DeviceSession = {
  device_id: string;
  device_label: string | null;
  last_active_at: string;
};

export type RegisterResult =
  | { status: "registered"; devices?: never }
  | { status: "limit_reached"; devices: DeviceSession[] };

/** Register (or refresh) this device for the signed-in customer. Max 2 devices. */
export async function registerThisDevice(): Promise<RegisterResult> {
  const deviceId = await getDeviceId();
  const { data, error } = await supabase.rpc("customer_register_device", {
    _device_id: deviceId,
    _device_label: getDeviceLabel(),
  });
  if (error) throw error;
  const res = data as unknown as RegisterResult;
  if (res?.status === "limit_reached") {
    return { status: "limit_reached", devices: (res.devices ?? []) as DeviceSession[] };
  }
  return { status: "registered" };
}

export async function listMyDevices(): Promise<DeviceSession[]> {
  const { data, error } = await supabase.rpc("customer_list_devices");
  if (error) throw error;
  return (data as unknown as DeviceSession[]) ?? [];
}

export async function revokeDevice(deviceId: string): Promise<void> {
  const { error } = await supabase.rpc("customer_revoke_device", { _device_id: deviceId });
  if (error) throw error;
}

export function formatLastActive(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Active now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
}
