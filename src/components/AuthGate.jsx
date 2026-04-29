import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import FullScreenLoader from "./FullScreenLoader";

function Loading() {
  return <div style={{ padding: 24, fontFamily: "system-ui" }}>Loading</div>;
}

export default function AuthGate({ children }) {
  const session = useAuthStore((s) => s.session);
  const loadingAuth = useAuthStore((s) => s.loadingAuth);
  const location = useLocation();

  if (loadingAuth) return <FullScreenLoader />;

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace={true}
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
