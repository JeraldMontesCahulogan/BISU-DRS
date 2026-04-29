import { Header } from "@/components/student-components/header";
import { useUserStore } from "@/stores/userStore";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function StudentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;
  const fetchUserProfile = useUserStore((s) => s.fetchUserProfile);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { error } = await fetchUserProfile();
      if (!alive) return;

      if (error) {
        console.error("Error fetching user profile:", error.message || error);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fetchUserProfile]);

  const currentPage = path.endsWith("/chat")
    ? "chat"
    : path.endsWith("/survey")
      ? "survey"
      : "home";

  const setCurrentPage = (page) => {
    if (page === "chat") {
      navigate("/student-portal/chat", { replace: true });
      return;
    }

    if (page === "survey") {
      navigate("/student-portal/survey", { replace: true });
      return;
    }

    navigate("/student-portal", { replace: true });
  };

  return (
    <div className="bg-background h-dvh flex flex-col overflow-hidden">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Outlet area is the scroll container */}
      <main className="h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full min-h-0 flex flex-col ">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
