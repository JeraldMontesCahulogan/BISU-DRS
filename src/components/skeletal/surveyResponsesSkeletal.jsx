// src/components/skeletal/surveyResponsesSkeletal.jsx
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function HeaderControlsSkeleton() {
  return (
    <CardHeader className="border-b border-border pb-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: title */}
        <div className="min-w-0">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-2 h-4 w-105 max-w-full" />
        </div>

        {/* Right: controls */}
        <div className="w-full lg:w-auto">
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="w-full lg:w-80">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-end">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-9 w-full sm:w-20 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  );
}

function TableHeaderSkeleton() {
  return (
    <div className="px-5">
      <div className="grid grid-cols-9 gap-3 py-3 border-b border-border sticky top-0 bg-muted/50">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="px-5">
      <div className="grid grid-cols-9 gap-3 py-3 rounded-lg border border-border bg-card">
        {/* Student ID */}
        <Skeleton className="h-4 w-24" />
        {/* Course */}
        <Skeleton className="h-4 w-28" />
        {/* Year */}
        <Skeleton className="h-4 w-20" />
        {/* Risk */}
        <Skeleton className="h-6 w-20 rounded-full" />
        {/* Probability */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-32 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>
        {/* Response button */}
        <Skeleton className="h-9 w-24 rounded-md" />
        {/* Explanation button */}
        <Skeleton className="h-9 w-28 rounded-md" />
        {/* Chat icon button */}
        <Skeleton className="h-9 w-10 rounded-md justify-self-start" />
        {/* Add-to-filter */}
        <Skeleton className="h-9 w-10 rounded-md justify-self-center" />
      </div>
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-t border-border">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-10" />
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
  );
}

function ChatPanelSkeleton() {
  return (
    <div className="w-105 min-w-105 h-full">
      <Card className="h-full flex flex-col mr-3">
        <CardHeader className="border-b border-border">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>

        <CardContent className="flex-1 min-h-0 space-y-3">
          {/* message bubbles */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
            <Skeleton className="h-10 w-1/2 rounded-2xl ml-auto" />
            <Skeleton className="h-10 w-3/5 rounded-2xl" />
            <Skeleton className="h-10 w-2/5 rounded-2xl ml-auto" />
          </div>

          {/* input */}
          <div className="mt-auto pt-4 border-t border-border">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * SurveyResponsesSkeletal
 * - Matches your SurveyResponses page layout
 * - withChatPanel=true shows a fake right chat panel skeleton
 */
export default function SurveyResponsesSkeletal({ withChatPanel = false }) {
  return (
    <div className="w-full h-full flex gap-4 ">
      <Card className="w-full h-full flex flex-col">
        <HeaderControlsSkeleton />

        <CardContent className="flex-1 overflow-auto p-0 mr-2">
          <div className="min-w-225">
            <TableHeaderSkeleton />
            <div className="space-y-2 py-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          </div>
        </CardContent>

        <PaginationSkeleton />
      </Card>

      {withChatPanel ? <ChatPanelSkeleton /> : null}
    </div>
  );
}
