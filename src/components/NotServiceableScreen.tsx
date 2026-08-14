import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BellRing, CheckCircle2, MapPinOff } from "lucide-react";
import {
  findExistingWaitlistRequest,
  joinWaitlist,
  type WaitlistLocation,
} from "@/lib/serviceability";
import { friendlyError } from "@/lib/errorMessage";
import { useT } from "@/i18n";

export type NotServiceableLocation = WaitlistLocation & {
  area?: string | null;
};

export function NotServiceableScreen({
  location,
  segmentName,
  onBack,
  onChangeAddress,
}: {
  location: NotServiceableLocation;
  segmentName?: string | null;
  onBack: () => void;
  onChangeAddress?: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();

  const waitlistKey = [
    "waitlist",
    location.segmentId,
    location.latitude.toFixed(4),
    location.longitude.toFixed(4),
  ];

  const { data: existing, isLoading } = useQuery({
    queryKey: waitlistKey,
    queryFn: () => findExistingWaitlistRequest(location),
  });

  const join = useMutation({
    mutationFn: () => joinWaitlist(location),
    onSuccess: (row) => {
      qc.setQueryData(waitlistKey, row);
    },
  });

  const joined = Boolean(existing) || join.isSuccess;
  const areaLabel = location.area || location.city || location.addressText;

  return (
    <main className="min-h-screen w-full bg-background pb-10">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label={t("common.back")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground">
            {t("notServiceable.title")}
          </h1>
        </div>

        <section className="mt-8 flex flex-col items-center rounded-[18px] border border-border bg-card px-6 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MapPinOff className="h-8 w-8 text-primary" />
          </div>

          <h2 className="mt-5 text-xl font-extrabold tracking-tight text-foreground">
            {t("notServiceable.heading")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {segmentName
              ? t("notServiceable.subSegment", { segment: segmentName })
              : t("notServiceable.sub")}
          </p>

          {(areaLabel || location.addressText) && (
            <div className="mt-5 w-full rounded-[14px] border border-border bg-background px-4 py-3 text-left">
              {areaLabel && (
                <div className="text-sm font-bold text-foreground">{areaLabel}</div>
              )}
              {location.addressText && location.addressText !== areaLabel && (
                <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {location.addressText}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="mt-6 h-12 w-full animate-pulse rounded-[14px] bg-muted" />
          ) : joined ? (
            <div className="mt-6 w-full rounded-[14px] border border-primary/30 bg-primary/5 px-4 py-4">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-primary">
                <CheckCircle2 className="h-5 w-5" />
                {t("notServiceable.onTheList")}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("notServiceable.confirmation")}
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={() => join.mutate()}
                disabled={join.isPending}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
              >
                <BellRing className="h-4 w-4" />
                {join.isPending ? t("notServiceable.joining") : t("notServiceable.join")}
              </button>
              {join.error && (
                <p className="mt-2 text-xs text-destructive">
                  {friendlyError(join.error)}
                </p>
              )}
            </>
          )}

          {onChangeAddress && (
            <button
              onClick={onChangeAddress}
              className="mt-3 w-full rounded-[14px] border border-border bg-card px-4 py-3 text-sm font-bold text-foreground transition active:scale-[0.99]"
            >
              {t("notServiceable.changeAddress")}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
