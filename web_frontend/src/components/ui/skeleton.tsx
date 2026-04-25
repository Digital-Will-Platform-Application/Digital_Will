import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-r from-muted via-muted-foreground/12 to-muted bg-[length:200%_100%] animate-shimmer ring-1 ring-border/25",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
