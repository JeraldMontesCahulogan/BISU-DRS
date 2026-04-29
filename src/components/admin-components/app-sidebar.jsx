/* eslint-disable no-empty */
import * as React from "react";
import {
  LayoutDashboard,
  UserCheck,
  CalendarDays,
  FileText,
  MessageSquare,
  Users,
  Filter,
  GalleryVerticalEnd,
} from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { useUserStore } from "@/stores/userStore";
import { useAdminStore } from "@/stores/adminStore";
import { usePredictionStore } from "@/stores/predictionStore";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";

import { useRef, useEffect, useMemo } from "react";
import FullScreenError from "../FullScreenError";

export function AppSidebar({ currentPage, setCurrentPage, ...props }) {
  const setAdminSurveyOpen = usePredictionStore((s) => s.setAdminSurveyOpen);

  const setPendingOpen = useAdminStore((s) => s.setPendingOpen);
  const setRoleOpen = useAdminStore((s) => s.setRoleOpen);

  const profile = useUserStore((s) => s.profile);
  const profileError = useUserStore((s) => s.profileError);
  const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);

  const pendingHasNew = useAdminStore((s) => s.pendingHasNew);
  const markPendingSeen = useAdminStore((s) => s.markPendingSeen);
  const subscribePendingApprovals = useAdminStore(
    (s) => s.subscribePendingApprovals,
  );

  const roleHasNew = useAdminStore((s) => s.roleHasNew);
  const markRoleSeen = useAdminStore((s) => s.markRoleSeen);
  const subscribeRoleCandidates = useAdminStore(
    (s) => s.subscribeRoleCandidates,
  );

  const adminSurveyHasNew = usePredictionStore((s) => s.adminSurveyHasNew);
  const markAdminSurveySeen = usePredictionStore((s) => s.markAdminSurveySeen);
  const subscribeAllResponsesRealtime = usePredictionStore(
    (s) => s.subscribeAllResponsesRealtime,
  );

  const chatHasNew = useChatStore((s) => s.chatHasNew);
  const markChatSeen = useChatStore((s) => s.markChatSeen);
  const subscribeInboxUnread = useChatStore((s) => s.subscribeInboxUnread);
  const refreshChatLatest = useChatStore((s) => s.refreshChatLatest);
  const setChatOpen = useChatStore((s) => s.setChatOpen);

  const role = useAuthStore((s) => s.role);

  const navItems = useMemo(() => {
    if (role === "admin") {
      return [
        { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
        {
          id: "approval-requests",
          title: "Approval Requests",
          icon: UserCheck,
        },
        { id: "role-management", title: "Role Management", icon: Users },
        {
          id: "survey-schedules",
          title: "Survey Schedules",
          icon: CalendarDays,
        },
        { id: "survey-responses", title: "Survey Responses", icon: FileText },
        {
          id: "filtered-responses",
          title: "Filtered Responses",
          icon: Filter,
        },
        { id: "live-chat", title: "Live Chat", icon: MessageSquare },
      ];
    }

    if (role === "staff") {
      return [
        { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
        {
          id: "approval-requests",
          title: "Approval Requests",
          icon: UserCheck,
        },
        {
          id: "survey-schedules",
          title: "Survey Schedules",
          icon: CalendarDays,
        },
        {
          id: "chatPersonnel",
          title: "Live Chat",
          icon: MessageSquare,
        },
      ];
    }

    if (role === "chairperson") {
      return [
        { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
        {
          id: "filtered-responses-chairperson",
          title: "Filtered Responses",
          icon: Filter,
        },
        {
          id: "chatPersonnel",
          title: "Live Chat",
          icon: MessageSquare,
        },
      ];
    }

    return [];
  }, [role]);

  const subscribedProfileRef = useRef(false);
  const subscribedRealtimeRef = useRef(false);

  useEffect(() => {
    if (subscribedProfileRef.current) return;
    subscribedProfileRef.current = true;

    const unsub = subscribeUserProfile?.();
    return () => unsub?.();
  }, [subscribeUserProfile]);

  useEffect(() => {
    if (subscribedRealtimeRef.current) return;
    subscribedRealtimeRef.current = true;

    const unsubs = [];

    const u1 = subscribePendingApprovals?.();
    if (typeof u1 === "function") unsubs.push(u1);

    const u2 = subscribeRoleCandidates?.();
    if (typeof u2 === "function") unsubs.push(u2);

    const u3 = subscribeAllResponsesRealtime?.();
    if (typeof u3 === "function") unsubs.push(u3);

    const u4 = subscribeInboxUnread?.();
    if (typeof u4 === "function") unsubs.push(u4);

    refreshChatLatest?.();

    return () => {
      unsubs.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    };
  }, [
    subscribePendingApprovals,
    subscribeRoleCandidates,
    subscribeAllResponsesRealtime,
    subscribeInboxUnread,
    refreshChatLatest,
  ]);

  useEffect(() => {
    const isPending = currentPage === "approval-requests";
    const isSurvey = currentPage === "survey-responses";
    const isRole = currentPage === "role-management";
    const isChat = currentPage === "live-chat";

    // ✅ open flags (prevents badge from reappearing while viewing the page)
    setPendingOpen?.(isPending);
    setAdminSurveyOpen?.(isSurvey);
    setRoleOpen?.(isRole);
    setChatOpen?.(isChat);

    // ✅ mark as seen when visiting
    if (isPending) markPendingSeen?.();
    if (isSurvey) markAdminSurveySeen?.();
    if (isRole) markRoleSeen?.();
    if (isChat) markChatSeen?.();
  }, [
    currentPage,
    setPendingOpen,
    setAdminSurveyOpen,
    setRoleOpen,
    setChatOpen,
    markPendingSeen,
    markAdminSurveySeen,
    markRoleSeen,
    markChatSeen,
  ]);

  const items = navItems.map((x) => {
    const hasIndicator =
      (x.id === "approval-requests" && pendingHasNew) ||
      (x.id === "survey-responses" && adminSurveyHasNew) ||
      (x.id === "role-management" && roleHasNew) ||
      (x.id === "live-chat" && chatHasNew);

    return {
      ...x,
      isActive: currentPage === x.id,
      hasIndicator,
    };
  });

  if (profileError) {
    return (
      <FullScreenError
        code={profileError.code || "500"}
        title="Failed to load user profile"
        message={profileError.message || "Please try again."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            { name: "BISU-DRS", logo: GalleryVerticalEnd, plan: "Enterprise" },
          ]}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={items} onSelect={setCurrentPage} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: "User",
            email: profile?.email || "",
            avatar: "/avatars/shadcn.jpg",
          }}
          profile={profile}
          onSelectPage={setCurrentPage}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
