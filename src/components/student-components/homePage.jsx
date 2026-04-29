import { useEffect, useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SectionLoader } from "../SectionLoader";
import { DataPrivacyNoticeEveryLoginModal } from "./DataPrivacyNoticeModal";

function formatDate(value) {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function HomePage() {
  const profile = useUserStore((s) => s.profile);
  const profileLoading = useUserStore((s) => s.profileLoading);
  const profileError = useUserStore((s) => s.profileError);

  const schedule = useUserStore((s) => s.schedule);
  const scheduleLoading = useUserStore((s) => s.scheduleLoading);
  const scheduleError = useUserStore((s) => s.scheduleError);

  const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);

  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsub = subscribeUserProfile();
    return () => unsub?.();
  }, [subscribeUserProfile]);

  if (profileLoading && !profile) {
    return (
      <SectionLoader
        title="Loading profile"
        subtitle="Getting your account details"
      />
    );
  }

  if (profileError) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm text-red-600">
        {profileError}
      </div>
    );
  }

  const statusId = profile?.approvalStatus_id ?? null;

  const isPending = statusId === 1;
  const isApproved = statusId === 2;
  const isRejected = statusId === 3;

  return (
    <div className="p-6 space-y-6">
      {/* <DataPrivacyNoticeEveryLoginModal /> */}
      {isPending ? (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          Your account is under review. Survey access is disabled until
          approval.
        </div>
      ) : null}

      {isRejected ? (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded">
          Your account was rejected. Please contact the Guidance Office.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Welcome to BISU-DRS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            Program: <strong>{profile?.program?.program ?? "Not set"}</strong>
          </p>
          <p>
            Year Level:{" "}
            <strong>{profile?.year?.year_level ?? "Not set"}</strong>
          </p>
          <p>
            Account Status:{" "}
            {isApproved ? (
              <Badge className="bg-green-600 text-white">Approved</Badge>
            ) : isPending ? (
              <Badge className="bg-yellow-500 text-white">Pending</Badge>
            ) : (
              <Badge className="bg-red-600 text-white">Rejected</Badge>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Survey Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scheduleError ? (
            <p className="text-red-600">{scheduleError}</p>
          ) : scheduleLoading ? (
            <p className="text-muted-foreground">Loading schedule...</p>
          ) : schedule ? (
            <>
              <p>
                Start: <strong>{formatDate(schedule.start_at)}</strong>
              </p>
              <p>
                End:{" "}
                <strong>
                  {schedule.end_at
                    ? formatDate(schedule.end_at)
                    : "No end date"}
                </strong>
              </p>
              <Badge className="bg-emerald-600 text-white">Active</Badge>

              <div className="pt-2">
                <Link to="/student-portal/survey">
                  <Button disabled={!isApproved}>Take Survey</Button>
                </Link>
                {!isApproved ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Approval required before taking the survey.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              No active survey for your program and year level.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guidance Office</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>For concerns about approval, surveys, or results, contact:</p>
          <p>
            Email: <strong>guidance@bisu.edu.ph</strong>
          </p>
          <p>
            Office Hours: <strong>Monday to Friday, 8:00 AM to 5:00 PM</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
