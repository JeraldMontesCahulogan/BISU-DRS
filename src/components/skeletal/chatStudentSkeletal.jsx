// /components/skeletal/ChatStudentSkeletal.jsx
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function BubbleSkeleton({ mine = false }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          // ✅ Responsive width
          "w-[85%] xs:w-[75%] sm:w-[60%] max-w-md",
          "space-y-2 px-3 py-2 rounded-lg",
          mine ? "rounded-br-none bg-primary/10" : "rounded-bl-none bg-muted",
        ].join(" ")}
      >
        <Skeleton className="h-4 w-[85%] bg-transparent" />
        <Skeleton className="h-4 w-[70%] bg-transparent" />
        <Skeleton className="h-3 w-16 bg-transparent" />
      </div>
    </div>
  );
}

export default function ChatStudentSkeletal({ showHeaderError = false }) {
  return (
    <Card
      className={[
        // ✅ Responsive margins
        "m-2 xs:m-3 sm:m-4 lg:m-6",
        // ✅ Proper flex layout
        "flex flex-col",
        // ✅ Required so scroll works inside flex layout
        "min-h-0",
        // ✅ Better padding on small screens
        "pt-4 sm:pt-6 pb-0",
      ].join(" ")}
    >
      {/* Header */}
      <CardHeader className="border-b border-border pb-3 shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-52" />
        </div>

        {showHeaderError ? (
          <div className="mt-3">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : null}
      </CardHeader>

      {/* Messages Area */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-4">
          <BubbleSkeleton mine={false} />
          <BubbleSkeleton mine={true} />
          <BubbleSkeleton mine={false} />
          <BubbleSkeleton mine={true} />
          <BubbleSkeleton mine={false} />
          <BubbleSkeleton mine={true} />
        </div>
      </div>

      {/* Input Area */}
      <CardContent className="border-t border-border p-3 sm:p-4 shrink-0">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
