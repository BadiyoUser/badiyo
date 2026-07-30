import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export type ReverseGeocodeResult = {
  formatted_address: string;
  area: string | null;
  city: string | null;
};

export const reverseGeocode = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ReverseGeocodeResult> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Missing Google Maps connector credentials");
    }
    const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?latlng=${data.lat},${data.lng}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Geocoding failed [${res.status}]: ${body}`);
    }
    const json = (await res.json()) as {
      status: string;
      results?: Array<{
        formatted_address: string;
        address_components: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
      }>;
    };
    if (json.status !== "OK" || !json.results?.length) {
      const msg = (json as any).error_message || json.status || "No results";
      throw new Error(`Geocoding failed: ${msg}`);
    }
    const top = json.results[0];
    const findComponent = (types: string[]) =>
      top.address_components.find((c) => types.some((t) => c.types.includes(t)))
        ?.long_name ?? null;
    return {
      formatted_address: top.formatted_address,
      area:
        findComponent(["sublocality", "sublocality_level_1", "neighborhood"]) ??
        findComponent(["locality"]),
      city:
        findComponent(["locality"]) ??
        findComponent(["administrative_area_level_2"]),
    };
  });

export type PlaceSuggestion = {
  placeId: string;
  primary: string;
  secondary: string;
};

export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        query: z.string().min(1),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<PlaceSuggestion[]> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Missing Google Maps connector credentials");
    }
    const body: Record<string, unknown> = {
      input: data.query,
      includedRegionCodes: ["in"],
    };
    if (typeof data.lat === "number" && typeof data.lng === "number") {
      body.locationBias = {
        circle: {
          center: { latitude: data.lat, longitude: data.lng },
          radius: 50000,
        },
      };
    }
    const res = await fetch(
      "https://connector-gateway.lovable.dev/google_maps/places/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Places autocomplete failed [${res.status}]: ${text}`);
    }
    const json = (await res.json()) as {
      suggestions?: Array<{
        placePrediction?: {
          placeId: string;
          structuredFormat?: {
            mainText?: { text?: string };
            secondaryText?: { text?: string };
          };
          text?: { text?: string };
        };
      }>;
    };
    return (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
      .map((p) => ({
        placeId: p.placeId,
        primary: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
        secondary: p.structuredFormat?.secondaryText?.text ?? "",
      }));
  });

export type PlaceDetails = {
  latitude: number;
  longitude: number;
  formatted_address: string;
};

export const getPlaceDetails = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ placeId: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<PlaceDetails> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Missing Google Maps connector credentials");
    }
    const res = await fetch(
      `https://connector-gateway.lovable.dev/google_maps/places/v1/places/${encodeURIComponent(data.placeId)}`,
      {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "id,formattedAddress,location",
        },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Place details failed [${res.status}]: ${text}`);
    }
    const json = (await res.json()) as {
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
    };
    if (!json.location) throw new Error("Place has no location");
    return {
      latitude: json.location.latitude,
      longitude: json.location.longitude,
      formatted_address: json.formattedAddress ?? "",
    };
  });
