import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreeDLogoProps {
  className?: string;
  iconClassName?: string;
  glowClassName?: string;
}

const ThreeDLogo = ({ className, iconClassName, glowClassName }: ThreeDLogoProps) => {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <span
        className={cn(
          "absolute inset-[-22%] rounded-[28%] bg-gradient-to-br from-primary/35 to-accent/35 blur-xl",
          glowClassName,
        )}
        aria-hidden
      />
      <div className="relative h-11 w-11 rounded-2xl border border-white/30 bg-gradient-to-br from-primary via-primary to-accent shadow-[0_18px_30px_-14px_hsl(var(--primary)/0.65)]">
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/30 to-white/10" />
        <span className="absolute inset-[2px] rounded-[14px] border border-white/25" />
        <div className="relative flex h-full w-full items-center justify-center">
          <Shield className={cn("h-5 w-5 text-primary-foreground drop-shadow", iconClassName)} />
        </div>
      </div>
    </div>
  );
};

export default ThreeDLogo;
