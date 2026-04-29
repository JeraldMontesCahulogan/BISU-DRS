// src/components/skeletal/DashboardSkeletal.jsx
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function OverviewCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-24" />
        <Skeleton className="mt-3 h-4 w-40" />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton({ tall = false, withLegend = true }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div
          className={[
            "w-full rounded-xl border bg-muted/20 p-4",
            tall ? "h-72" : "h-64",
          ].join(" ")}
        >
          {/* chart grid mimic */}
          <Skeleton className="h-full w-full rounded-lg" />
        </div>

        {withLegend ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-sm" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-sm" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TabsSkeleton() {
  return (
    <div className="space-y-6">
      {/* TabsList mimic */}
      <div className="grid w-full grid-cols-6 gap-2 rounded-lg border bg-card p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>

      {/* Tab content: 2-column grid of chart cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}

/**
 * DashboardSkeletal
 * - Matches your Dashboard layout (header, 3 overview cards, tabs list, charts grid)
 * - No recharts used (skeleton only)
 */
export default function DashboardSkeletal() {
  return (
    <div className="w-full">
      {/* Header */}
      <div>
        <div className="mx-auto px-6 py-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-4 w-105 max-w-full" />
          <Skeleton className="mt-4 h-4 w-40" />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <OverviewCardSkeleton />
          <OverviewCardSkeleton />
          <OverviewCardSkeleton />
        </div>

        <TabsSkeleton />
      </div>
    </div>
  );
}
