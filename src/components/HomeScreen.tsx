import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Clock,
  Gift,
  Home as HomeIcon,
  MapPin,
  Mic,
  Search,
  Sparkles,
  User,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { BadiyoLogo } from "./BadiyoLogo";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, LucideIcon> = {
  clock: Clock,
  "vacuum-cleaner": Wind,
  sparkles: Sparkles,
  gift: Gift,
  home: HomeIcon,
};

function Icon({ name, className }: { name?: string | null; className?: string }) {
  const Cmp = (name && ICON_MAP[name]) || Sparkles;
  return <Cmp className={className} />;
}

type Service = {
  id: string;
  icon: string | null;
  duration_label: string;
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
    .select("id, icon, duration_label, subtitle, price, display_order")
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

export function HomeScreen({
  onBookService,
}: {
  onBookService?: (service: { duration_label: string; price: number }) => void;
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
  const navItems = sections
    .filter((s) => s.section_type === "nav_item")
    .sort((a, b) => a.display_order - b.display_order);

  const searchPlaceholder =
    searchBar?.payload?.placeholder ?? "Search for cleaning services";

  return (
    <main className="min-h-screen w-full bg-background pb-28">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <BadiyoLogo variant="green" className="h-7 w-auto" />
          <button className="flex items-center gap-1 text-sm font-semibold text-foreground max-w-[55%]">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Lahoti Compound, Latur</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
          <button
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <User className="h-5 w-5 text-foreground" />
          </button>
        </header>

        {/* Search bar */}
        <div className="mt-5 flex items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
            placeholder={searchPlaceholder}
          />
          <button aria-label="Voice search">
            <Mic className="h-5 w-5 text-primary" />
          </button>
        </div>

        {/* Section heading */}
        <h2 className="mt-8 text-lg font-bold tracking-tight text-foreground">
          Book cleaning
        </h2>

        {/* Service cards */}
        <div className="mt-4 space-y-4">
          {services.map((s) => (
            <article
              key={s.id}
              className="rounded-[18px] border border-border bg-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-primary/10">
                  <Icon name={s.icon} className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-foreground">
                    {s.duration_label}
                  </div>
                  {s.subtitle && (
                    <div className="text-sm text-muted-foreground">
                      {s.subtitle}
                    </div>
                  )}
                </div>
                <div className="text-base font-bold text-foreground">
                  Rs {Number(s.price)}
                </div>
              </div>
              <button
                onClick={() =>
                  onBookService?.({
                    duration_label: s.duration_label,
                    price: Number(s.price),
                  })
                }
                className="mt-4 w-full rounded-[14px] bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition active:scale-[0.99]"
              >
                Book now
              </button>
            </article>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Need it later? Schedule a time inside booking
        </p>

        {/* Promo banner */}
        {promo && (
          <div className="mt-6 flex items-center gap-3 rounded-[18px] bg-primary/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <Icon name={promo.payload?.icon} className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {promo.payload?.text}
            </p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-4 py-2">
          {navItems.map((item, idx) => {
            const active = idx === 0;
            return (
              <button
                key={item.payload?.label ?? idx}
                className={`flex flex-1 flex-col items-center gap-1 rounded-[14px] px-3 py-2 text-xs font-semibold transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon name={item.payload?.icon} className="h-5 w-5" />
                <span>{item.payload?.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
