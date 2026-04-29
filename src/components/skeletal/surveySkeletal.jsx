// /components/skeletal/SurveySkeletal.jsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function FieldCardSkeleton({ hasHint = true, rows = 3, gridCols = 2 }) {
  return (
    <div className="rounded-2xl border bg-card p-5 lg:p-6">
      <div className="mb-4 space-y-2">
        <Skeleton className="h-5 w-40" />
        {hasHint ? <Skeleton className="h-4 w-72 max-w-full" /> : null}
      </div>

      {/* Options / Input area */}
      <div
        className={[
          "grid gap-3",
          gridCols === 1 ? "grid-cols-1" : "",
          gridCols === 2 ? "grid-cols-1 sm:grid-cols-2" : "",
          gridCols === 3 ? "grid-cols-1 sm:grid-cols-3" : "",
          gridCols === 4 ? "grid-cols-2 sm:grid-cols-4" : "",
          gridCols === 5 ? "grid-cols-2 sm:grid-cols-5" : "",
        ].join(" ")}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
          >
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressSkeletonDesktop({ steps = 4 }) {
  return (
    <div className="hidden md:block">
      <div className="flex items-start justify-between gap-3">
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className="flex-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="min-w-0 w-full">
                <Skeleton className="h-4 w-28" />
                <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <Skeleton className="h-2 w-3/4 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressSkeletonMobile({ steps = 4 }) {
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
        <Skeleton className="h-2 w-2/3 rounded-full" />
      </div>

      <div className="mt-3 flex items-center gap-3 overflow-x-auto pb-1">
        {Array.from({ length: steps }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-14 rounded-full shrink-0" />
        ))}
      </div>
    </div>
  );
}

export default function SurveySkeletal({ steps = 4 }) {
  return (
    <div className="bg-background">
      {/* Header area (same as your page) */}
      <div className="border-b bg-muted/40 px-4">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-3 h-4 w-130 max-w-full" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Progress Indicator skeleton */}
        <div className="mb-6">
          <ProgressSkeletonDesktop steps={steps} />
          <ProgressSkeletonMobile steps={steps} />
        </div>

        {/* Consent box skeleton */}
        <div className="mb-4 flex items-start gap-3 rounded-xl border p-4">
          <Skeleton className="mt-1 h-4 w-4 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-170 max-w-full" />
            <Skeleton className="h-4 w-130 max-w-full" />
          </div>
        </div>

        {/* Main Card skeleton */}
        <Card className="p-6 rounded-3xl">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-105 max-w-full" />

          <div className="mt-6 space-y-10">
            {/* Step 0 layout: 2-column cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <FieldCardSkeleton rows={2} gridCols={2} /> {/* Gender */}
              <div className="rounded-2xl border bg-card p-5 lg:p-6">
                <div className="mb-4 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl" />{" "}
                {/* Age input */}
              </div>
              <div className="rounded-2xl border bg-card p-5 lg:p-6">
                <div className="mb-4 space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl" /> {/* Select */}
              </div>
              <div className="rounded-2xl border bg-card p-5 lg:p-6">
                <div className="mb-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl" /> {/* Select */}
              </div>
              <FieldCardSkeleton rows={2} gridCols={2} /> {/* Working */}
              <FieldCardSkeleton rows={2} gridCols={2} /> {/* PWD */}
              <div className="rounded-2xl border bg-card p-5 lg:p-6">
                <div className="mb-4 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl" /> {/* Select */}
              </div>
              <FieldCardSkeleton rows={2} gridCols={2} /> {/* Indigenous */}
            </div>
          </div>

          {/* Buttons skeleton */}
          <div className="mt-8 flex justify-between">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Skeleton } from "@/components/ui/skeleton";

// export default function SurveySkeletal() {
//   return (
//     <Card className="w-full max-w-xs">
//       <CardHeader>
//         <Skeleton className="aspect-video w-full" />
//       </CardHeader>
//       <CardContent>
//         <Skeleton className="h-4 w-2/3" />
//         <Skeleton className="h-4 w-1/2" />
//       </CardContent>
//     </Card>
//   );
// }
