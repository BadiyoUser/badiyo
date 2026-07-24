import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Clock, Gift, Home, MapPin, Mic, Search, Sparkles, User, Wind, type LucideIcon } from "lucide-react";
import { BadiyoLogo } from "./BadiyoLogo";
import { BottomNav } from "./BottomNav";
import { LocationPickerSheet, type SavedAddress } from "./LocationPickerSheet";
import { supabase } from "@/integrations/supabase/client";
import expertHouse from "@/assets/expert-house-cleaning.jpg";
import expertDusting from "@/assets/expert-dusting.jpg";
import expertDishes from "@/assets/expert-dishes.jpg";

const ICON_MAP: Record<string, LucideIcon> = {
  clock: Clock,
  "vacuum-cleaner": Wind,
  sparkles: Sparkles,
  gift: Gift,
  home: Home,
};

function Icon({ name, className }: { name?: string | null; className?: string }) {
  const Cmp = (name && ICON_MAP[name]) || Sparkles;
  return <Cmp className={className} />;
}

type Service = {
  id: string;
  icon: string | null;
  duration_label: string;
  duration_minutes: number;
  subtitle: string | null;
  price: number;
  display_order: number | null;
};

type HomepageSection = {
  section_type: string;
  display_order: number;
  payload: Record<string, any>;
};

async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("service_catalogue_config")
    .select("id, icon, duration_label, duration_minutes, subtitle, price, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Service[];
}

async function fetchSections(): Promise<HomepageSection[]> {
  const { data, error } = await supabase
    .from("homepage_sections")
    .select("section_type, display_order, payload")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HomepageSection[];
}

const EXPERT_TILES = [
  { image: expertHouse, label: "House Cleaning" },
  { image: expertDusting, label: "Dusting & Wiping" },
  { image: expertDishes, label: "Cleaning Dishes" },
];

export function HomeScreen({
  onBookService,
  onOpenProfile,
  onOpenRewards,
}: {
  onBookService?: (service: { duration_label: string; duration_minutes: number; price: number; subtitle: string | null; icon: string | null }) => void;
  onOpenProfile?: () => void;
  onOpenRewards?: () => void;
}) {
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ["homepage_sections"],
    queryFn: fetchSections,
  });

  const searchBar = sections.find((s) => s.section_type === "search_bar");
  const promo = sections.find((s) => s.section_type === "promo_banner");

  const searchPlaceholder =
    searchBar?.payload?.placeholder ?? "Search for cleaning services…";

  return (
    <main className="min-h-screen w-full bg-background pb-28">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <BadiyoLogo variant="green" className="h-7 w-auto" />
          <button className="flex items-center gap-1 text-sm font-semibold text-foreground max-w-[55%]">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Lahoti Compound</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          <button
            onClick={onOpenProfile}
            aria-label="Profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary/60 bg-card"
          >
            <User className="h-5 w-5 text-primary" />
          </button>
        </header>

        {/* Search bar */}
        <div className="mt-5 flex items-center gap-3 rounded-[16px] border border-border bg-card px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
            placeholder={searchPlaceholder}
          />
          <button aria-label="Voice search">
            <Mic className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Book Cleaning section */}
        <h2 className="mt-8 text-lg font-extrabold tracking-tight text-foreground">
          Book Cleaning
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          {services.map((s) => (
            <article
              key={s.id}
              className="flex items-center gap-4 rounded-[18px] border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon name={s.icon} className="h-5 w-5 text-primary" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="text-base font-bold text-foreground">
                  {s.duration_label}
                </div>
                {s.subtitle && (
                  <div className="text-xs text-muted-foreground">
                    {s.subtitle}
                  </div>
                )}
                <div className="text-sm font-bold text-primary">
                  Rs {Number(s.price)}
                </div>
              </div>
              <button
                onClick={() =>
                  onBookService?.({
                    duration_label: s.duration_label,
                    duration_minutes: Number(s.duration_minutes),
                    price: Number(s.price),
                    subtitle: s.subtitle,
                    icon: s.icon,
                  })
                }
                className="shrink-0 rounded-[12px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
              >
                Book Now
              </button>
            </article>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Need it later? Schedule a time inside booking
        </p>

        {/* Expert tiles */}
        <h2 className="mt-10 text-xl font-extrabold tracking-tight text-foreground">
          One Expert who can do it all
        </h2>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {EXPERT_TILES.map((tile) => (
            <div key={tile.label} className="flex flex-col">
              <div className="aspect-square overflow-hidden rounded-[16px] bg-muted">
                <img
                  src={tile.image}
                  alt={tile.label}
                  width={512}
                  height={512}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-2 text-center text-xs font-semibold text-foreground leading-tight">
                {tile.label}
              </p>
            </div>
          ))}
        </div>

        {/* Promo banner */}
        {promo && (
          <div className="mt-10 flex items-center gap-3 rounded-[18px] bg-primary/10 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <Icon name={promo.payload?.icon} className="h-5 w-5 text-primary" />
            </div>
            <p className="flex-1 text-sm font-semibold text-foreground leading-snug">
              {promo.payload?.text}
            </p>
            <button
              aria-label="Open rewards"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              →
            </button>
          </div>
        )}
      </div>

      <BottomNav activeKey="home" onHome={() => {}} onRewards={onOpenRewards ?? (() => {})} />
    </main>
  );
}
