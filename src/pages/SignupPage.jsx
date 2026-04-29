import AvatarDemo from "@/components/avatarDemo";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminStore } from "@/stores/adminStore";

function roleRedirect(role) {
  if (role === "admin") return "/admin-portal";
  if (role === "student") return "/student-portal";
  return "/login";
}

const GENDERS = ["Male", "Female"];

function getFriendlyAuthError(err) {
  const code = err?.code || "";
  const msg = (err?.message || "").toLowerCase();

  if (code === "user_already_exists")
    return "An account with this email already exists.";
  if (code === "email_address_invalid")
    return "Please enter a valid email address.";
  if (code === "weak_password")
    return "Password is too weak. Please use a stronger password.";

  if (msg.includes("already registered"))
    return "An account with this email already exists.";
  if (msg.includes("password")) return "Password is invalid or too weak.";
  if (msg.includes("email")) return "Email is invalid.";

  return err?.message || "Signup failed. Please try again.";
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const yearLevels = useAdminStore((s) => s.yearLevels);
  const fetchYearLevels = useAdminStore((s) => s.fetchYearLevels);

  const departments = useAdminStore((s) => s.departments);
  const programs = useAdminStore((s) => s.programs);

  const fetchDepartments = useAdminStore((s) => s.fetchDepartments);
  const fetchProgramsByDepartment = useAdminStore(
    (s) => s.fetchProgramsByDepartment,
  );

  useEffect(() => {
    fetchYearLevels();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signup = useAuthStore((s) => s.signup);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const loadingAuth = useAuthStore((s) => s.loadingAuth);
  const loadingProfile = useAuthStore((s) => s.loadingProfile);

  const busy = useMemo(
    () => loadingAuth || loadingProfile,
    [loadingAuth, loadingProfile],
  );

  const [step, setStep] = useState(1); // 1 Personal, 2 Academic, 3 Account
  const [errorMsg, setErrorMsg] = useState("");

  // Personal
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const [profileImage, setProfileImage] = useState(null);

  // Academic
  const [departmentId, setDepartmentId] = useState(null);
  const [programId, setProgramId] = useState(null);
  const [yearLevelId, setYearLevelId] = useState(null);
  const [studentId, setStudentId] = useState("");

  // Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    if (!session) return;
    if (loadingProfile) return;
    if (!role) return;
    navigate(roleRedirect(role), { replace: true });
  }, [session, role, loadingProfile, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setProfileImage(file ?? null);
    if (errorMsg) setErrorMsg("");
  };

  const validatePersonal = () => {
    const f = firstname.trim();
    const l = lastname.trim();
    const ageNum = age === "" ? NaN : Number(age);

    if (!f || !l) return "Enter your first name and last name.";
    if (!gender) return "Select your gender.";
    if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120)
      return "Enter a valid age.";
    return "";
  };

  const validateAcademic = () => {
    if (!departmentId) return "Select your department.";
    if (!programId) return "Select your program.";
    if (!yearLevelId) return "Select your year level.";
    return "";
  };

  const validateAccount = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return "Enter email and password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!acceptTerms) return "Accept the terms to continue.";
    return "";
  };

  const onNext = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (step === 1) {
      const msg = validatePersonal();
      if (msg) return setErrorMsg(msg);
      setStep(2);
      return;
    }

    if (step === 2) {
      const msg = validateAcademic();
      if (msg) return setErrorMsg(msg);
      setStep(3);
      return;
    }
  };

  const onBack = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const msg1 = validatePersonal();
    if (msg1) {
      setErrorMsg(msg1);
      setStep(1);
      return;
    }

    const msg2 = validateAcademic();
    if (msg2) {
      setErrorMsg(msg2);
      setStep(2);
      return;
    }

    const msg3 = validateAccount();
    if (msg3) {
      setErrorMsg(msg3);
      return;
    }

    const cleanEmail = email.trim();
    const cleanStudentId = studentId.trim();
    const cleanFirstname = firstname.trim();
    const cleanMiddlename = middlename.trim();
    const cleanLastname = lastname.trim();
    const ageNum = Number(age);

    const { error, redirectTo } = await signup(
      cleanEmail,
      password,
      cleanStudentId,
      cleanFirstname,
      cleanMiddlename,
      cleanLastname,
      gender,
      ageNum,
      departmentId,
      programId,
      yearLevelId,
      profileImage,
    );

    if (error) {
      setErrorMsg(getFriendlyAuthError(error));
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  const ErrorAlert = ({ message }) =>
    message ? (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {message}
      </div>
    ) : null;

  const stepLabel =
    step === 1 ? "Personal" : step === 2 ? "Academic" : "Account";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ✅ Center the whole form */}
      <div className="min-h-dvh flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-5 flex items-center justify-center gap-2 sm:mb-8">
            <div className="h-11 w-11 sm:h-12 sm:w-12 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
              <AvatarDemo />
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight">
              BISU-DRS
            </span>
          </div>

          {/* Card */}
          <div className="w-full rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-lg sm:p-8">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                  Create Account
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Step {step} of 3
                </p>
              </div>

              <div className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                {stepLabel}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6 grid grid-cols-3 gap-2">
              <div
                className={[
                  "h-2 rounded-full",
                  step >= 1 ? "bg-primary" : "bg-muted",
                ].join(" ")}
              />
              <div
                className={[
                  "h-2 rounded-full",
                  step >= 2 ? "bg-primary" : "bg-muted",
                ].join(" ")}
              />
              <div
                className={[
                  "h-2 rounded-full",
                  step >= 3 ? "bg-primary" : "bg-muted",
                ].join(" ")}
              />
            </div>

            {step === 1 ? (
              <form onSubmit={onNext} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Personal Information</p>
                  <p className="text-xs text-muted-foreground">
                    Tell us who you are.
                  </p>
                </div>

                <Input
                  placeholder="Firstname"
                  value={firstname}
                  type="text"
                  onChange={(e) => {
                    setFirstname(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  required
                  autoComplete="given-name"
                  className="h-11 rounded-xl"
                />

                <Input
                  placeholder="Middlename (optional)"
                  type="text"
                  value={middlename}
                  onChange={(e) => {
                    setMiddlename(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  autoComplete="additional-name"
                  className="h-11 rounded-xl"
                />

                <Input
                  placeholder="Lastname"
                  type="text"
                  value={lastname}
                  onChange={(e) => {
                    setLastname(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  required
                  autoComplete="family-name"
                  className="h-11 rounded-xl"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    value={gender}
                    required
                    onValueChange={(v) => {
                      setGender(v);
                      if (errorMsg) setErrorMsg("");
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    min={1}
                    max={120}
                    required
                    inputMode="numeric"
                    className="h-11 w-full rounded-xl"
                  />
                </div>

                <div className="w-full">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="h-11 w-full rounded-xl"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Optional: Upload a profile photo
                  </p>
                </div>

                <ErrorAlert message={errorMsg} />

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl"
                  disabled={busy}
                >
                  Next
                </Button>
              </form>
            ) : step === 2 ? (
              <form onSubmit={onNext} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Academic Information</p>
                  <p className="text-xs text-muted-foreground">
                    Choose your department, program, and year level.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    required
                    value={departmentId ? String(departmentId) : ""}
                    onValueChange={(v) => {
                      const id = Number(v);
                      setDepartmentId(id);
                      setProgramId(null);
                      fetchProgramsByDepartment(id);
                      if (errorMsg) setErrorMsg("");
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(departments ?? []).map((d) => (
                        <SelectItem
                          key={d.department_id}
                          value={String(d.department_id)}
                        >
                          {d.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={programId ? String(programId) : ""}
                    required
                    onValueChange={(v) => {
                      setProgramId(Number(v));
                      if (errorMsg) setErrorMsg("");
                    }}
                    disabled={!departmentId}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue
                        placeholder={
                          departmentId
                            ? "Program / Course"
                            : "Select department first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(programs ?? []).map((p) => (
                        <SelectItem
                          key={p.program_id}
                          value={String(p.program_id)}
                        >
                          {p.program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select
                  value={yearLevelId ? String(yearLevelId) : ""}
                  required
                  onValueChange={(v) => {
                    setYearLevelId(Number(v));
                    if (errorMsg) setErrorMsg("");
                  }}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue placeholder="Year Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {(yearLevels ?? []).map((y) => (
                      <SelectItem
                        key={y.yearLevel_id}
                        value={String(y.yearLevel_id)}
                      >
                        {y.year_level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Institutional ID"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  className="h-11 rounded-xl"
                />

                <ErrorAlert message={errorMsg} />

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={onBack}
                    disabled={busy}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl"
                    disabled={busy}
                  >
                    Next
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Account</p>
                  <p className="text-xs text-muted-foreground">
                    Set your email and password.
                  </p>
                </div>

                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl"
                />

                {/* Password */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    required
                    autoComplete="new-password"
                    className="h-11 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    required
                    autoComplete="new-password"
                    className="h-11 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(v) => {
                      setAcceptTerms(Boolean(v));
                      if (errorMsg) setErrorMsg("");
                    }}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-5"
                  >
                    I agree to the Terms and Conditions
                  </label>
                </div>

                <ErrorAlert message={errorMsg} />

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-xl"
                    onClick={onBack}
                    disabled={busy}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl"
                    disabled={busy}
                  >
                    {busy ? "Signing up..." : "Sign Up"}
                  </Button>
                </div>
              </form>
            )}

            {/* Footer inside card */}
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom link */}
          <div className="mt-5 sm:mt-8 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
