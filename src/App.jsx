// App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";

import AuthGate from "./components/AuthGate";
import RoleGate from "./components/RoleGate";
import PublicOnly from "./components/PublicOnly";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LandingPage from "./pages/LandingPage";
import LandingPageV1 from "./pages/LandingPageV1";
import AdminPage from "./pages/admin/AdminPage";
import StudentPage from "./pages/student/StudentPage";
import HomePage from "./components/student-components/homePage";
import StudentDashboard from "./components/student-components/StudentDashboard";
import SurveyForm from "./components/student-components/survey-form";
import { ChatStudent } from "./components/student-components/chat-student";
import ProfilePage from "./pages/ProfilePage";
import ProfilePageAdmin from "./pages/admin/ProfilePageAdmin";

import StudentOnlyPrivacyNotice from "./components/StudentOnlyPrivacyNotice";

function HomeRedirect() {
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const loadingAuth = useAuthStore((s) => s.loadingAuth);
  const loadingProfile = useAuthStore((s) => s.loadingProfile);

  if (loadingAuth) return <div style={{ padding: 24 }}>Loading</div>;
  if (!session) return <Navigate to="/login" replace={true} />;
  if (loadingProfile) return <div style={{ padding: 24 }}>Loading</div>;

  if (role === "admin" || role === "chairperson" || role === "staff")
    return <Navigate to="/admin-portal" replace={true} />;
  if (role === "student")
    return <Navigate to="/student-portal" replace={true} />;

  console.log("user role: ", role);

  return <Navigate to="/login" replace={true} />;
}

export default function App() {
  const initAuthListener = useAuthStore((s) => s.initAuthListener);

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  return (
    <BrowserRouter>
      <StudentOnlyPrivacyNotice />

      <Routes>
        <Route
          path="/"
          element={
            <PublicOnly>
              {/* <LandingPage /> */}
              <LandingPageV1 />
            </PublicOnly>
          }
        />

        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicOnly>
              <SignupPage />
            </PublicOnly>
          }
        />

        <Route
          path="/admin-portal"
          element={
            <AuthGate>
              <RoleGate allowRoles={["admin", "chairperson", "staff"]}>
                <AdminPage />
              </RoleGate>
            </AuthGate>
          }
        />

        <Route
          path="/admin-portal/profile"
          element={
            <AuthGate>
              <RoleGate allowRoles={["admin", "chairperson", "staff"]}>
                <ProfilePageAdmin />
              </RoleGate>
            </AuthGate>
          }
        />

        <Route
          path="/student-portal"
          element={
            <AuthGate>
              <RoleGate allowRoles={["student"]}>
                <StudentPage />
              </RoleGate>
            </AuthGate>
          }
        >
          {/* <Route index element={<HomePage />} /> */}
          <Route index element={<StudentDashboard />} />
          <Route path="survey" element={<SurveyForm />} />
          <Route path="chat" element={<ChatStudent />} />
        </Route>

        <Route
          path="/profile"
          element={
            <AuthGate>
              <RoleGate
                allowRoles={["student", "admin", "chairperson", "staff"]}
              >
                <ProfilePage />
              </RoleGate>
            </AuthGate>
          }
        />

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
