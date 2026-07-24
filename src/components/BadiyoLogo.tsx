import logo from "@/assets/badiyo-logo.png.asset.json";

export function BadiyoLogo({ className = "" }: { className?: string }) {
  return <img src={logo.url} alt="badiyo" className={className} draggable={false} />;
}
