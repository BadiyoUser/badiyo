import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { SelectedAddress } from "../BookingSummaryScreen";

declare global {
  interface Window {
    google?: any;
    __badiyoInitMap?: () => void;
  }
}

let mapsLoaderPromise: Promise<void> | null = null;
function loadMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (mapsLoaderPromise) return mapsLoaderPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  if (!key) return Promise.reject(new Error("Google Maps browser key missing"));

  mapsLoaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-badiyo-gmaps="1"]');
    if (existing) {
      const prev = window.__badiyoInitMap;
      window.__badiyoInitMap = () => {
        prev?.();
        resolve();
      };
      return;
    }
    window.__badiyoInitMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__badiyoInitMap`;
    s.async = true;
    s.defer = true;
    s.dataset.badiyoGmaps = "1";
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return mapsLoaderPromise;
}

/**
 * Shared static-style map card used on customer-facing tracking screens.
 * Renders a small non-interactive Google Map centered on the service address
 * using the project's Google Maps browser key. Falls back to a branded
 * gradient placeholder when coordinates are missing or the JS API fails to load.
 */
export function ServiceLocationMap({ address }: { address: SelectedAddress }) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const hasCoords = !!(address.latitude && address.longitude);

  useEffect(() => {
    if (!hasCoords) return;
    let cancelled = false;
    loadMapsScript()
      .then(() => {
        if (cancelled || !mapDivRef.current || !window.google?.maps) return;
        const center = { lat: address.latitude!, lng: address.longitude! };
        const map = new window.google.maps.Map(mapDivRef.current, {
          center,
          zoom: 16,
          disableDefaultUI: true,
          gestureHandling: "none",
          keyboardShortcuts: false,
          clickableIcons: false,
          draggable: false,
          zoomControl: false,
        });
        new window.google.maps.Marker({ position: center, map });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hasCoords, address.latitude, address.longitude]);

  const showMap = hasCoords && !failed;

  return (
    <section className="mt-5 overflow-hidden rounded-[18px] border border-border bg-card">
      <div className="relative h-48 w-full bg-muted">
        {showMap ? (
          <>
            <div ref={mapDivRef} className="h-full w-full" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <MapPin className="h-10 w-10 text-primary/60" />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-center">
            <MapPin className="h-10 w-10 text-primary" />
            <div className="mt-2 text-xs font-medium text-muted-foreground">
              {hasCoords ? "Map preview unavailable" : "Live tracking coming soon"}
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm font-bold text-foreground">Service location</div>
        <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {address.full_address}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          Live expert tracking is coming soon.
        </div>
      </div>
    </section>
  );
}
