import { useState } from "react";
import { MapPin } from "lucide-react";
import type { SelectedAddress } from "../BookingSummaryScreen";

/**
 * Shared static map card used on customer-facing tracking screens.
 * Uses OpenStreetMap's staticmap service when coordinates are available,
 * and falls back to a branded gradient placeholder when the tile fetch
 * fails or the address has no coordinates. Always renders the pin overlay
 * and the address block so the card never appears blank.
 */
export function ServiceLocationMap({ address }: { address: SelectedAddress }) {
  const [imgFailed, setImgFailed] = useState(false);

  const hasCoords = !!(address.latitude && address.longitude);
  const mapSrc = hasCoords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${address.latitude},${address.longitude}&zoom=15&size=600x300&markers=${address.latitude},${address.longitude},red-pushpin`
    : null;

  const showImage = hasCoords && mapSrc && !imgFailed;

  return (
    <section className="mt-5 overflow-hidden rounded-[18px] border border-border bg-card">
      <div className="relative h-48 w-full bg-muted">
        {showImage ? (
          <img
            src={mapSrc!}
            alt="Service location"
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-center">
            <MapPin className="h-10 w-10 text-primary" />
            <div className="mt-2 text-xs font-medium text-muted-foreground">
              {hasCoords ? "Map preview unavailable" : "Live tracking coming soon"}
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-primary p-2 shadow-lg">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
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
