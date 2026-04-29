/* eslint-disable react-hooks/set-state-in-effect */
// SurveyResultPopup.jsx
import { useEffect, useMemo, useState } from "react";
import { usePredictionStore } from "@/stores/predictionStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function SurveyResultPopup() {
  const popup = usePredictionStore((s) => s.resultPopup);
  const close = usePredictionStore((s) => s.closeResultPopup);

  const total = 5;
  const [secs, setSecs] = useState(total);

  useEffect(() => {
    if (!popup.open) return;

    setSecs(total);
    const t = setInterval(() => {
      setSecs((s) => {
        const next = s - 1;
        if (next <= 0) {
          clearInterval(t);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [popup.open]);

  const icon = popup.type === "error" ? "✕" : "✓";

  const ui = useMemo(() => {
    const isErr = popup.type === "error";

    return {
      // ring around dialog content
      ring: isErr ? "ring-destructive/20" : "ring-primary/20",

      // top progress bar color
      bar: isErr ? "bg-destructive" : "bg-primary",

      // icon pill
      iconWrap: isErr
        ? "bg-destructive/10 text-destructive ring-destructive/20"
        : "bg-primary/10 text-primary ring-primary/20",

      // status chip
      chip: isErr
        ? "bg-destructive text-destructive-foreground"
        : "bg-primary text-primary-foreground",

      // helper panel (inside)
      panel: isErr
        ? "border-destructive/30 bg-destructive/5"
        : "border-primary/30 bg-primary/5",

      helper: isErr ? "Please try again." : `Closing in ${secs}s.`,
      helperText: isErr ? "text-destructive" : "text-primary",
    };
  }, [popup.type, secs]);

  const progressPct = clamp((secs / total) * 100, 0, 100);

  return (
    <Dialog open={popup.open} onOpenChange={(v) => (!v ? close() : null)}>
      <DialogContent
        className={[
          // ✅ responsive width on mobile, still max-w on larger screens
          "w-[calc(100vw-1.5rem)] sm:w-full max-w-md",
          "p-0 overflow-hidden",
          "rounded-2xl border border-border bg-background text-foreground shadow-xl",
          "ring-1",
          ui.ring,
        ].join(" ")}
      >
        {/* progress bar */}
        <div className="h-1.5 w-full bg-muted">
          <div
            className={["h-full transition-all duration-700", ui.bar].join(" ")}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-start gap-3">
              <div
                className={[
                  "h-10 w-10 rounded-2xl grid place-items-center",
                  "ring-1",
                  ui.iconWrap,
                ].join(" ")}
                aria-hidden="true"
              >
                <span className="text-lg font-bold leading-none">{icon}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg">
                    {popup.title}
                  </DialogTitle>

                  <span
                    className={[
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      ui.chip,
                    ].join(" ")}
                  >
                    {popup.type === "error" ? "Error" : "Success"}
                  </span>
                </div>

                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {popup.message ||
                    (popup.type === "error"
                      ? "We could not save your response."
                      : "Your response was saved.")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div
            className={[
              "mt-4 rounded-2xl border border-border p-4 text-sm",
              ui.panel,
            ].join(" ")}
          >
            <p className={["font-medium", ui.helperText].join(" ")}>
              {ui.helper}
            </p>

            {/* ✅ mobile-friendly button layout */}
            <div className="mt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={close}
                className="w-full sm:w-auto"
              >
                Close
              </Button>

              {popup.type === "error" ? (
                <Button onClick={close} className="w-full sm:w-auto">
                  Ok
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
