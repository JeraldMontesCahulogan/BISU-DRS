// /components/skeletal/StudentDashboardSkeletal.jsx
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function StatLineSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-40" />
    </div>
  );
}

function DateItemSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-5 w-5 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

function SupportButtonSkeleton() {
  return (
    <div className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-gray-100 dark:bg-slate-700 text-left flex items-center gap-4">
      <Skeleton className="h-7 w-7 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-4 w-4 rounded" />
    </div>
  );
}

function OfficeItemSkeleton() {
  return (
    <div className="flex items-center gap-4 mb-5">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-44" />
      </div>
    </div>
  );
}

export default function StudentHomePageSkeletal() {
  return (
    <main className="min-h-screen bg-(--page-bg) text-(--text-primary) p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 md:p-12 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="flex-1">
              <div className="inline-block mb-4">
                <Skeleton className="h-9 w-52 rounded-full" />
              </div>

              <Skeleton className="h-12 w-130 max-w-full" />
              <Skeleton className="mt-3 h-5 w-130 max-w-full" />
              <Skeleton className="mt-2 h-5 w-105 max-w-full" />
            </div>

            <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8  border-(--card-border)">
            <StatLineSkeleton />
            <StatLineSkeleton />
            <div className="space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </div>

        {/* Survey + Support */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Survey Card */}
          <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg flex flex-col">
            <div className="flex justify-between mb-6">
              <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>

            <div className="space-y-4 mb-6">
              <DateItemSkeleton />
              <DateItemSkeleton />
            </div>

            <Skeleton className="mt-auto h-12 w-full rounded-xl" />
          </div>

          {/* Support Card */}
          <div className="rounded-3xl border border-accent-foreground/15 px-8 py-6 shadow-lg">
            <Skeleton className="h-8 w-40 mb-6" />
            <div className="space-y-3">
              <SupportButtonSkeleton />
              <SupportButtonSkeleton />
              <SupportButtonSkeleton />
            </div>
          </div>
        </div>

        {/* Office + Latest Submission */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg">
            <Skeleton className="h-10 w-44 mb-8" />
            <OfficeItemSkeleton />
            <OfficeItemSkeleton />
            <OfficeItemSkeleton />
          </div>

          <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg">
            <Skeleton className="h-8 w-72 mb-6" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-130 max-w-full" />
            <Skeleton className="h-4 w-105 max-w-full" />
          </div>

          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
