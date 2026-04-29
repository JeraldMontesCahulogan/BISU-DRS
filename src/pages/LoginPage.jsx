import AvatarDemo from "@/components/avatarDemo";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

function roleRedirect(role) {
  if (role === "admin") return "/admin-portal";
  if (role === "student") return "/student-portal";
  return "/login";
}

function getFriendlyAuthError(err) {
  const code = err?.code || "";
  const msg = (err?.message || "").toLowerCase();

  if (code === "invalid_login_credentials")
    return "Incorrect email or password.";
  if (code === "email_not_confirmed")
    return "Please verify your email before signing in.";
  if (code === "user_not_found") return "No account found for this email.";
  if (code === "too_many_requests")
    return "Too many attempts. Please try again later.";

  if (msg.includes("invalid login credentials"))
    return "Incorrect email or password.";
  if (msg.includes("email not confirmed"))
    return "Please verify your email before signing in.";

  if (msg.includes("profile not found")) {
    return "Your account profile is missing. Please contact the admin.";
  }

  return "Login failed. Please try again.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuthStore((s) => s.login);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const loadingAuth = useAuthStore((s) => s.loadingAuth);
  const loadingProfile = useAuthStore((s) => s.loadingProfile);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const busy = useMemo(
    () => loadingAuth || loadingProfile,
    [loadingAuth, loadingProfile],
  );

  const from = location.state?.from || null;

  useEffect(() => {
    if (!session) return;
    if (loadingProfile) return;
    if (!role) return;

    navigate(roleRedirect(role), { replace: true, state: { from } });
  }, [session, role, loadingProfile, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Enter email and password.");
      return;
    }

    const { error, redirectTo } = await login(email.trim(), password);

    if (error) {
      setErrorMsg(getFriendlyAuthError(error));
      console.error("Login error:", error);
      return;
    }

    navigate(redirectTo, { replace: true, state: { from } });
  };

  return (
    // ✅ LOCK to viewport on mobile + no scroll
    <div className="h-dvh overflow-hidden bg-background">
      {/* ✅ centered container; NO vertical padding on mobile to avoid overflow */}
      <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center px-4 sm:px-6 sm:py-10">
        {/* Logo/Header */}
        <div className="mb-5 flex items-center justify-center gap-2 sm:mb-8">
          <div className="h-11 w-11 sm:h-12 sm:w-12 overflow-hidden rounded-lg bg-primary flex items-center justify-center">
            <AvatarDemo />
          </div>
          <span className="text-foreground font-bold text-lg sm:text-xl">
            BISU-DRS
          </span>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-lg sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1 rounded-md"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {errorMsg ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {errorMsg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold rounded-lg transition active:scale-[0.99] disabled:active:scale-100"
            >
              {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-5 sm:mt-6">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo Credentials:
            </p>

            <div className="bg-muted rounded-lg p-3 text-xs text-foreground space-y-1 wrap-break-word">
              <p>
                Email:{" "}
                <span className="text-primary font-semibold">
                  admin@bisudrs.com
                </span>
              </p>
              <p>
                Password:{" "}
                <span className="text-primary font-semibold">demo123</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <div className="text-center mt-5 sm:mt-8">
          <Link to="/">
            <button className="text-sm text-muted-foreground hover:text-foreground transition">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
