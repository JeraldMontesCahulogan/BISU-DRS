import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      // className={cn("bg-accent animate-pulse rounded-md", className)}
      className={cn(
        "animate-pulse rounded-md bg-[hsl(var(--skeleton))]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
