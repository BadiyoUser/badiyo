export type Coords = { lat: number; lng: number };

export async function getCurrentCoords(): Promise<Coords> {
  if (typeof window === "undefined") {
    throw new Error("Geolocation is only available in the browser.");
  }

  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== "granted") {
      const req = await Geolocation.requestPermissions();
      if (req.location !== "granted") {
        throw new Error("Location permission denied.");
      }
    }
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  return new Promise<Coords>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Location permission denied.")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
