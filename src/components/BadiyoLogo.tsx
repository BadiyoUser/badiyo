import logoWhite from "@/assets/badiyo-logo.png.asset.json";
import logoGreen from "@/assets/badiyo-logo-green.png.asset.json";

export function BadiyoLogo({
  className = "",
  variant = "white",
}: {
  className?: string;
  variant?: "white" | "green";
}) {
  const src = variant === "green" ? logoGreen.url : logoWhite.url;
  return <img src={src} alt="badiyo" className={className} draggable={false} />;
}

