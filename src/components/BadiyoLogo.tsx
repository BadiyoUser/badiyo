import logoWhite from "@/assets/badiyos-logo-white.png.asset.json";
import logoGreen from "@/assets/badiyos-logo-green.png.asset.json";

export function BadiyoLogo({
  className = "",
  variant = "white",
}: {
  className?: string;
  variant?: "white" | "green";
}) {
  const src = variant === "green" ? logoGreen.url : logoWhite.url;
  return <img src={src} alt="badiyos" className={className} draggable={false} />;
}
