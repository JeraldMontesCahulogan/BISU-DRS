// src/components/PublicOnly.jsx
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import FullScreenLoader from "./FullScreenLoader";

function roleRedirect(role) {
  if (role === "admin" || role === "chairperson" || role === "staff")
    return "/admin-portal";
  if (role === "student") return "/student-portal";
  return "/login";
}

export default function PublicOnly({ children }) {
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const loadingAuth = useAuthStore((s) => s.loadingAuth);
  const loadingProfile = useAuthStore((s) => s.loadingProfile);
  const logout = useAuthStore((s) => s.logout);
  const authError = useAuthStore((s) => s.authError);

  // If session exists but role is missing AFTER profile finished loading,
  // it's an invalid state (e.g., auth user deleted). Force logout.
  // useEffect(() => {
  //   if (!loadingAuth && session && !loadingProfile && !role) {
  //     logout();
  //   }
  // }, [loadingAuth, session, loadingProfile, role, logout]);

  useEffect(() => {
    if (authError) {
      logout();
    }
  }, [authError, logout]);

  // ✅ Not logged in -> ALWAYS allow public pages (Login/Signup)
  // ✅ BUT show loading as overlay so Login/Register component is NOT unmounted
  if (!session) {
    return (
      <div className="relative">
        {children}

        {loadingAuth ? (
          <div className="absolute inset-0 z-50">
            <FullScreenLoader />
          </div>
        ) : null}
      </div>
    );
  }

  // Logged in but still resolving profile/role
  if (loadingProfile) return <FullScreenLoader />;

  // Logged in and has role -> redirect to correct portal
  if (role) return <Navigate to={roleRedirect(role)} replace={true} />;

  // Logged in but role missing -> we triggered logout above, show loader briefly
  return <FullScreenLoader />;
}
