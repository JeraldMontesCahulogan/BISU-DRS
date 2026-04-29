// AdminPage.jsx (your admin shell)
// add ProfilePageAdmin into the same page switch so the sidebar stays
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin-components/app-sidebar";
import { Dashboard } from "./Dashboard";
import RequestApproval from "./RequestApproval";
import SurveySchedulePage from "./SurveySchedulePage";
import { ChatList } from "@/components/admin-components/chat-list";
import { ChatStudent } from "@/components/student-components/chat-student";
import SurveyResponses from "./SurveyResponsePage";
import RoleManagement from "./RoleManagement";
import { useInactivityGuard } from "@/hooks/useInactivityGuard";
import LockScreenModal from "@/components/LockScreenModal";
import { useAuthStore } from "@/stores/authStore";
import { useAdminStore } from "@/stores/adminStore";
import FilteredResponsePage from "./FilteredResponsePage";
import FilteredResponsePageChairperson from "../chairperson/FilteredResponseChairperson";
import ProfilePageAdmin from "./ProfilePageAdmin";

const VALID_PAGES = new Set([
  "dashboard",
  "approval-requests",
  "survey-schedules",
  "survey-responses",
  "live-chat",
  "role-management",
  "filtered-responses",
  "filtered-responses-chairperson",
  "profile",
  "chatPersonnel",
]);

function getTitle(page) {
  if (page === "dashboard") return "Dashboard";
  if (page === "approval-requests") return "Approval Requests";
  if (page === "survey-schedules") return "Survey Schedules";
  if (page === "survey-responses") return "Survey Responses";
  if (page === "live-chat") return "Live Chat";
  if (page === "role-management") return "Role Management";
  if (page === "filtered-responses") return "Filtered Responses";
  if (page === "filtered-responses-chairperson") return "Filtered Responses";
  if (page === "profile") return "Profile";
  if (page === "chatPersonnel") return "Chat";
  return "Dashboard";
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const verifyUserPin = useAdminStore((s) => s.verifyUserPin);
  const pinVerifyLoading = useAdminStore((s) => s.pinVerifyLoading);

  const [locked, setLocked] = useState(false);

  // const inactive = useInactivityGuard(1 * 60 * 1000, !locked);
  const inactive = useInactivityGuard(30 * 60 * 1000, !locked);
  // const inactive = useInactivityGuard(10 * 1000, !locked);

  useEffect(() => {
    if (inactive) setLocked(true);
  }, [inactive]);

  useEffect(() => {
    if (!user?.id) return;
    setLocked(false);
  }, [user?.id]);

  const currentPage = useMemo(() => {
    const p = searchParams.get("page") || "dashboard";
    return VALID_PAGES.has(p) ? p : "dashboard";
  }, [searchParams]);

  const setCurrentPage = (page) => {
    const next = VALID_PAGES.has(page) ? page : "dashboard";
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", next);
    setSearchParams(nextParams, { replace: true });
  };

  const pageTitle = getTitle(currentPage);

  const handleLogout = async () => {
    await logout?.();
    navigate("/login", { replace: true });
  };

  const verifyPin = async (pin) => {
    const userId = user?.id;
    if (!userId) return false;

    const res = await verifyUserPin(userId, pin);
    return Boolean(res?.ok);
  };

  return (
    <SidebarProvider>
      {locked && (
        <LockScreenModal
          onUnlock={() => setLocked(false)}
          onLogout={handleLogout}
          verifyPin={verifyPin}
          loading={pinVerifyLoading}
        />
      )}

      <div
        className={[
          "flex min-h-screen w-full",
          locked ? "pointer-events-none select-none blur-sm" : "",
        ].join(" ")}
      >
        <AppSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

        <SidebarInset aria-hidden={locked} className="flex-1 min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <button
                        type="button"
                        onClick={() => setCurrentPage("dashboard")}
                        className="hover:underline"
                      >
                        Platform
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  <BreadcrumbSeparator className="hidden md:block" />

                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 pt-0 w-full">
            <div className="bg-muted/50 min-h-[calc(100vh-5rem)] flex-1 rounded-xl p-4 w-full">
              {currentPage === "dashboard" && <Dashboard />}
              {currentPage === "approval-requests" && <RequestApproval />}
              {currentPage === "survey-schedules" && <SurveySchedulePage />}
              {currentPage === "survey-responses" && <SurveyResponses />}
              {currentPage === "live-chat" && <ChatList />}
              {currentPage === "role-management" && <RoleManagement />}
              {currentPage === "filtered-responses" && <FilteredResponsePage />}
              {/* {currentPage === "chatPersonnel" && <div>Chat</div>} */}
              {currentPage === "chatPersonnel" && <ChatStudent />}
              {currentPage === "filtered-responses-chairperson" && (
                <FilteredResponsePageChairperson />
              )}
              {currentPage === "profile" && <ProfilePageAdmin />}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
