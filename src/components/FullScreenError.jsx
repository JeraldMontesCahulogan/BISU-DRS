import React from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FullScreenError({
  title = "Something went wrong",
  message = "We hit an unexpected error. Please try again.",
  code = "500",
  onRetry,
  onGoHome,
}) {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background">
      <div className="relative max-w-lg w-full px-6 text-center">
        {/* Glowing backdrop */}
        <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-linear-to-tr from-destructive/40 via-muted to-primary/30" />

        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-10 w-10" />
        </div>

        {/* Error code */}
        <p className="mt-4 text-sm font-mono tracking-widest text-muted-foreground">
          ERROR {code}
        </p>

        {/* Title */}
        <h1 className="mt-3 text-3xl font-bold text-foreground">{title}</h1>

        {/* Message */}
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>

        {/* Divider */}
        <div className="mx-auto mt-6 h-px w-24 bg-border" />

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          )}

          {onGoHome && (
            <Button variant="outline" onClick={onGoHome} className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>

        {/* Footer hint */}
        <p className="mt-6 text-xs text-muted-foreground">
          If the problem persists, contact system support.
        </p>
      </div>
    </div>
  );
}
