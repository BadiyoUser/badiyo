import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AddAddressMapScreen, type PickedAddress } from "./AddAddressMapScreen";

export type SavedAddress = {
  id: string;
  label: string | null;
  full_address: string;
  area: string | null;
  city: string | null;
  is_default: boolean | null;
};

async function fetchAddresses(): Promise<SavedAddress[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("addresses")
    .select("id, label, full_address, area, city, is_default")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedAddress[];
}

export function LocationPickerSheet({
  open,
  activeId,
  onClose,
  onSelect,
}: {
  open: boolean;
  activeId: string | null;
  onClose: () => void;
  onSelect: (a: SavedAddress) => void;
}) {
  const qc = useQueryClient();
  const [showMap, setShowMap] = useState(false);
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: fetchAddresses,
    enabled: open,
  });

  useEffect(() => {
    if (!open) setShowMap(false);
  }, [open]);

  const addMutation = useMutation({
    mutationFn: async (input: PickedAddress) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in to save an address.");
      await supabase.from("users").upsert({ id: uid }, { onConflict: "id" });

      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: uid,
          label: input.label,
          full_address: input.full_address,
          area: input.area,
          city: input.city ?? undefined,
          latitude: input.latitude,
          longitude: input.longitude,
          is_default: addresses.length === 0,
        })
        .select("id, label, full_address, area, city, is_default")
        .single();
      if (error) throw error;
      const created = data as SavedAddress;

      if (input.photo) {
        const ext = (input.photo.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${uid}/${created.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("address-photos")
          .upload(path, input.photo, {
            upsert: true,
            contentType: input.photo.type || "image/jpeg",
          });
        if (!upErr) {
          const { data: pub } = supabase.storage
            .from("address-photos")
            .getPublicUrl(path);
          await supabase
            .from("addresses")
            .update({ landmark_photo_url: pub.publicUrl })
            .eq("id", created.id);
        }
      }
      return created;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setShowMap(false);
      onSelect(created);
    },
  });

  if (!open) return null;

  if (showMap) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <AddAddressMapScreen
          onBack={() => setShowMap(false)}
          onSave={(a) => addMutation.mutate(a)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button
        aria-label="Close"
        className="flex-1"
        onClick={onClose}
      />
      <div className="mx-auto w-full max-w-md rounded-t-[24px] bg-card p-5 pb-8 shadow-lg">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground">
            Select delivery location
          </h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : addresses.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No saved addresses — add one to get started
            </p>
          ) : (
            addresses.map((a) => {
              const active = a.id === activeId;
              return (
                <button
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className={`flex w-full items-start gap-3 rounded-[16px] border p-3 text-left transition ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">
                      {a.label ?? "Address"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {a.area ?? a.full_address}
                    </div>
                  </div>
                  {active && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={() => setShowMap(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-primary/60 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          Add New Address
        </button>
      </div>
    </div>
  );
}
