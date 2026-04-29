import React from "react";

export function SectionLoader({
  title = "Loading",
  subtitle = "Fetching data",
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
      <div className="flex flex-col items-center">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border-4 border-muted border-t-primary animate-spin" />

          <div className="absolute inset-4 rounded-full bg-primary/20 animate-pulse" />

          <div className="absolute inset-8 rounded-full bg-primary shadow-lg" />

          <div className="absolute inset-0 animate-[spin_1.5s_linear_infinite]">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-2 w-2 rounded-full bg-primary" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary/70" />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary/70" />
          </div>
        </div>

        <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>

        <div className="mt-3 h-1 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 bg-primary animate-[loaderBar_1.1s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes loaderBar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(240%); }
        }
      `}</style>
    </div>
  );
}
