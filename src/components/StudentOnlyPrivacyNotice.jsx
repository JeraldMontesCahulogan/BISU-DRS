// src/components/StudentOnlyPrivacyNotice.jsx
import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { DataPrivacyNoticeEveryLoginModal } from "./student-components/DataPrivacyNoticeModal";

export default function StudentOnlyPrivacyNotice() {
  const role = useAuthStore((s) => s.role);
  const loadingAuth = useAuthStore((s) => s.loadingAuth);
  const loadingProfile = useAuthStore((s) => s.loadingProfile);

  const show = useMemo(() => {
    if (loadingAuth) return false;
    if (loadingProfile) return false;
    return role === "student";
  }, [role, loadingAuth, loadingProfile]);

  if (!show) return null;

  return <DataPrivacyNoticeEveryLoginModal />;
}
