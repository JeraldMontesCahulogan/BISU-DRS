import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import FullScreenLoader from "./FullScreenLoader";

function Loading() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div>Loading...</div>
    </div>
  );
}

function roleRedirect(role) {
  if (role === "admin" || role === "chairperson" || role === "staff")
    return "/admin-portal";
  if (role === "student") return "/student-portal";
  return "/login";
}

export default function RoleGate({ allowRoles, children }) {
  const loadingProfile = useAuthStore((s) => s.loadingProfile);
  const role = useAuthStore((s) => s.role);

  if (loadingProfile) return <FullScreenLoader />;

  if (!role) return <Navigate to="/login" replace />;

  if (!allowRoles?.includes(role)) {
    return <Navigate to={roleRedirect(role)} replace />;
  }

  return children;
}
