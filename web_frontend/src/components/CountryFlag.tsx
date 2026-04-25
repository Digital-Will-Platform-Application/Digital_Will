import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  className?: string;
};

/** PNG flags from flagcdn (works on Windows where emoji flags often show as letter pairs). */
export function CountryFlag({ code, className }: Props) {
  const lower = code.toLowerCase();
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span
        className={cn(
          "inline-flex h-[18px] min-w-[24px] items-center justify-center rounded-sm bg-muted text-[10px] font-medium text-muted-foreground",
          className,
        )}
        aria-hidden
      >
        {code.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/24x18/${lower}.png`}
      srcSet={`https://flagcdn.com/48x36/${lower}.png 2x`}
      alt=""
      width={24}
      height={18}
      className={cn(
        "inline-block shrink-0 rounded-sm border border-border/50 object-cover shadow-sm",
        className,
      )}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}
