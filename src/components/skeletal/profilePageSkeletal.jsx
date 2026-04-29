// /components/skeletal/ProfilePageSkeletal.jsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/student-components/header";

function PillSkeleton() {
  return <Skeleton className="h-6 w-24 rounded-full" />;
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

function FieldSkeleton({ withHint = true }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        {withHint ? <Skeleton className="h-3 w-40" /> : null}
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

export default function ProfilePageSkeletal({
  currentPage = "home",
  setCurrentPage = () => {},
}) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Keep header visible while loading, to match layout */}
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Top title row */}
          <div className="px-6 pt-8 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>

              <Skeleton className="hidden sm:block h-10 w-40 rounded-xl" />
            </div>
          </div>

          <div className="px-6 pt-6 space-y-6">
            <Card className="rounded-3xl overflow-hidden">
              {/* Profile header card */}
              <div className="p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-center gap-5">
                    {/* Avatar */}
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0 ring-1 ring-border flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                      <div className="absolute bottom-2 right-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>

                    {/* Name + email + pills */}
                    <div className="min-w-0 space-y-2">
                      <Skeleton className="h-6 w-56 max-w-full" />
                      <Skeleton className="h-4 w-64 max-w-full" />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <PillSkeleton />
                        <PillSkeleton />
                        <PillSkeleton />
                        <PillSkeleton />
                      </div>
                    </div>
                  </div>

                  {/* Mobile save button placeholder */}
                  <div className="sm:ml-auto w-full sm:w-auto">
                    <Skeleton className="sm:hidden h-10 w-full rounded-xl" />
                  </div>
                </div>

                {/* Optional error placeholder space */}
                <div className="mt-5">
                  <Skeleton className="h-0 w-0" />
                </div>
              </div>

              <Separator />

              {/* Stats + form */}
              <div className="p-6 sm:p-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatSkeleton />
                  <StatSkeleton />
                  <StatSkeleton />
                  <StatSkeleton />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldSkeleton withHint />
                  <FieldSkeleton withHint />
                  <FieldSkeleton />
                  {/* Gender select */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                  </div>
                  <FieldSkeleton withHint />
                  {/* Email readonly */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-44" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </Card>

            <div className="h-2" />
          </div>
        </div>
      </main>
    </div>
  );
}
