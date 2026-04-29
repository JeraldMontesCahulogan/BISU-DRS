// /components/skeletal/RequestApprovalSkeletal.jsx
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TableRowSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-3 items-center rounded-md px-3 py-3 border bg-card">
      <Skeleton className="h-4 w-24" /> {/* Student ID */}
      <Skeleton className="h-4 w-44" /> {/* Email */}
      <Skeleton className="h-4 w-24" /> {/* Dept */}
      <Skeleton className="h-4 w-40" /> {/* Program */}
      <Skeleton className="h-4 w-20" /> {/* Year */}
      <div className="flex justify-center">
        <Skeleton className="h-8 w-8 rounded-md" /> {/* View icon button */}
      </div>
      <div className="flex gap-2 justify-end">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

export default function RequestApprovalSkeletal() {
  return (
    <div className="w-full bg-background px-6 py-2 h-full">
      <div className="w-full h-full flex flex-col mt-5">
        {/* Page header */}
        <CardHeader className="px-0 pb-6">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </CardHeader>

        <Card className="h-full flex flex-col min-h-0">
          {/* Card header (title + search) */}
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-16" />
              </div>

              <div className="relative w-full max-w-sm">
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>

            {/* error placeholder space */}
            <div className="mt-3">
              <Skeleton className="h-0 w-0" />
            </div>
          </CardHeader>

          {/* Table area */}
          <CardContent className="flex-1 min-h-0">
            <div className="h-full flex flex-col min-h-0">
              {/* "Table header" mimic */}
              <div className="hidden md:grid grid-cols-7 gap-3 px-3 pb-3 text-sm text-muted-foreground">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12 justify-self-center" />
                <Skeleton className="h-4 w-16 justify-self-end" />
              </div>

              <div className="flex-1 min-h-0 space-y-2 overflow-auto">
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </div>

              {/* Pagination mimic */}
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-14 rounded-md" />
                  <Skeleton className="h-8 w-10 rounded-md" />
                  <Skeleton className="h-8 w-10 rounded-md" />
                  <Skeleton className="h-8 w-10 rounded-md" />
                  <Skeleton className="h-8 w-14 rounded-md" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
