import React from "react";

export default function FullScreenLoader({
  title = "Loading",
  subtitle = "Preparing your workspace",
}) {
  return (
    <div className="fixed inset-0 z-9999 grid place-items-center bg-background">
      <div className="w-full max-w-md px-6">
        <div className="relative mx-auto h-40 w-40">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-muted/50 border-t-primary animate-spin" />

          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-[spin_1.7s_linear_infinite]">
            <div className="absolute left-1/2 top-0 -translate-x-1/2">
              <div className="h-3 w-3 rounded-full bg-primary shadow-sm" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary/80" />
            </div>
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary/80" />
            </div>
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
              <div className="h-2 w-2 rounded-full bg-primary/70" />
            </div>
          </div>

          {/* Pulsing core */}
          <div className="absolute inset-7 rounded-full bg-primary/10 blur-sm animate-pulse" />
          <div className="absolute inset-10 rounded-full bg-primary/15 animate-[pulse_1.2s_ease-in-out_infinite]" />
          <div className="absolute inset-[3.3rem] rounded-full bg-primary shadow-[0_0_40px_rgba(0,0,0,0.15)]" />

          {/* Scan lines */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute left-0 right-0 top-0 h-10 bg-linear-to-b from-primary/25 to-transparent animate-[loaderScan_1.6s_ease-in-out_infinite]" />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xl font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          {/* Progress shimmer bar */}
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 bg-primary/80 animate-[loaderBar_1.2s_ease-in-out_infinite]" />
          </div>

          {/* Micro status ticks */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-[pulse_1s_ease-in-out_infinite]" />
            <span className="h-2 w-2 rounded-full bg-primary/70 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
            <span className="h-2 w-2 rounded-full bg-primary/50 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
          </div>
        </div>
      </div>

      {/* Local keyframes */}
      <style>{`
        @keyframes loaderScan {
          0% { transform: translateY(-60%); opacity: 0.15; }
          50% { opacity: 0.35; }
          100% { transform: translateY(220%); opacity: 0.15; }
        }
        @keyframes loaderBar {
          0% { transform: translateX(-120%); opacity: 0.65; }
          50% { opacity: 1; }
          100% { transform: translateX(240%); opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
