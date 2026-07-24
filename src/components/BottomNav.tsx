import { useQuery } from "@tanstack/react-query";
import { Home, Gift, Sparkles, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  gift: Gift,
  sparkles: Sparkles,
};

type NavItem = {
  display_order: number;
  payload: Record<string, any>;
};

async function fetchNavItems(): Promise<NavItem[]> {
  const { data, error } = await supabase
    .from("homepage_sections")
    .select("display_order, payload")
    .eq("section_type", "nav_item")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as NavItem[];
}

export function BottomNav({
  activeKey,
  onHome,
  onRewards,
}: {
  activeKey: "home" | "rewards";
  onHome: () => void;
  onRewards: () => void;
}) {
  const { data: items = [] } = useQuery({
    queryKey: ["homepage_nav_items"],
    queryFn: fetchNavItems,
  });

  const handlers: Record<string, () => void> = {
    home: onHome,
    rewards: onRewards,
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card"
      style={{ paddingBottom: "max(2px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-4 pt-2 pb-1">
        {items.map((item, idx) => {
          const key = (item.payload?.target_screen as string) ?? item.payload?.label?.toLowerCase() ?? idx;
          const isActive =
            (activeKey === "home" && key === "home") ||
            (activeKey === "rewards" && key === "rewards");
          const Icon = ICON_MAP[(item.payload?.icon as string) ?? ""] ?? Sparkles;
          return (
            <button
              key={key}
              onClick={handlers[key] ?? (() => {})}
              className={`flex flex-1 flex-col items-center gap-1 rounded-[14px] px-3 py-2 text-xs font-semibold transition ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.payload?.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
