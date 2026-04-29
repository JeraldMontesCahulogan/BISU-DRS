/* eslint-disable react-hooks/set-state-in-effect */
// src/pages/ProfilePage.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/stores/userStore";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Camera, Loader2, Save, ShieldCheck, User } from "lucide-react";
import { Header } from "@/components/student-components/header";
import ProfilePageSkeletal from "@/components/skeletal/profilePageSkeletal";

function safeFullName(p) {
  const name = `${p?.firstname || ""} ${p?.lastname || ""}`.trim();
  return name || "User";
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-muted text-foreground border border-border dark:bg-muted/40",
    good:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 " +
      "dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
    warn:
      "bg-amber-50 text-amber-700 border border-amber-200 " +
      "dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
    bad:
      "bg-red-50 text-red-700 border border-red-200 " +
      "dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
    info:
      "bg-blue-50 text-blue-700 border border-blue-200 " +
      "dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  };

  return (
    <div
      className={[
        "text-xs px-3 py-1 rounded-full inline-flex items-center gap-2",
        tones[tone] || tones.neutral,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {hint ? (
            <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground truncate">
        {value || "Not set"}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const subscribedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  const profile = useUserStore((s) => s.profile);
  const profileLoading = useUserStore((s) => s.profileLoading);
  const profileError = useUserStore((s) => s.profileError);

  const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);
  const fetchUserProfile = useUserStore((s) => s.fetchUserProfile);

  const updateMyProfile = useUserStore((s) => s.updateMyProfile);
  const uploadMyProfileImage = useUserStore((s) => s.uploadMyProfileImage);

  const programs = useUserStore((s) => s.programs);
  const programsLoading = useUserStore((s) => s.programsLoading);
  const programsError = useUserStore((s) => s.programsError);

  const yearLevels = useUserStore((s) => s.yearLevels);
  const yearLevelsLoading = useUserStore((s) => s.yearLevelsLoading);
  const yearLevelsError = useUserStore((s) => s.yearLevelsError);

  const fetchPrograms = useUserStore((s) => s.fetchPrograms);
  const fetchYearLevels = useUserStore((s) => s.fetchYearLevels);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  const [started, setStarted] = useState(false);
  const [resolved, setResolved] = useState(false);

  const [form, setForm] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    gender: "",
    age: "",
    program_id: "",
    yearLevel_id: "",
  });

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsub = subscribeUserProfile();
    fetchUserProfile();

    fetchPrograms();
    fetchYearLevels();

    return () => unsub?.();
  }, [subscribeUserProfile, fetchUserProfile, fetchPrograms, fetchYearLevels]);

  useEffect(() => {
    if (profileLoading) setStarted(true);
    if (profile) setResolved(true);
    if (profileError) setResolved(true);
    if (started && !profileLoading) setResolved(true);
  }, [profileLoading, profile, profileError, started]);

  useEffect(() => {
    if (!profile) return;

    setForm({
      firstname: profile.firstname || "",
      middlename: profile.middlename || "",
      lastname: profile.lastname || "",
      gender: profile.gender || "",
      age: profile.age == null ? "" : String(profile.age),

      program_id: profile.program_id == null ? "" : String(profile.program_id),
      yearLevel_id:
        profile.yearLevel_id == null ? "" : String(profile.yearLevel_id),
    });
  }, [profile]);

  useEffect(() => {
    const path = profile?.profileImageURL;

    if (!path) {
      setAvatarUrl("");
      return;
    }

    const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
    setAvatarUrl(data?.publicUrl || "");
  }, [profile?.profileImageURL]);

  const readonly = useMemo(() => {
    const statusText =
      profile?.approval_status?.approval_status ||
      (profile?.approvalStatus_id === 2
        ? "Approved"
        : profile?.approvalStatus_id === 1
          ? "Pending"
          : "Rejected");

    const s = String(statusText || "").toLowerCase();

    const statusTone =
      s === "approved" ? "good" : s === "pending" ? "warn" : "bad";

    return {
      email: profile?.email || "",
      studentId: profile?.student_id || "",
      program: profile?.program?.program || "Not set",
      yearLevel: profile?.year?.year_level || "Not set",
      statusText,
      statusTone,
      role: profile?.user_type?.user_type || "User",
    };
  }, [profile]);

  const displayName = safeFullName(profile);

  const onChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = "";
    if (!file) return;

    setLocalError("");
    setSaving(true);

    const res = await uploadMyProfileImage(file);

    setSaving(false);
    if (res?.error) setLocalError(res.error.message || "Upload failed");
  };

  const onSave = async () => {
    setLocalError("");
    setSaving(true);

    const payload = {
      firstname: form.firstname.trim(),
      middlename: form.middlename.trim(),
      lastname: form.lastname.trim(),
      gender: form.gender.trim(),
      age: form.age === "" ? null : Number(form.age),

      program_id: form.program_id === "" ? null : Number(form.program_id),
      yearLevel_id: form.yearLevel_id === "" ? null : Number(form.yearLevel_id),
    };

    const res = await updateMyProfile(payload);

    setSaving(false);
    if (res?.error) setLocalError(res.error.message || "Save failed");
  };

  const displayError =
    localError || profileError || programsError || yearLevelsError || "";

  const path = location.pathname;
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

  if (!resolved) {
    return (
      <ProfilePageSkeletal
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    );
  }

  if (!profile) {
    return (
      <div className="bg-background min-h-screen">
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="p-4 sm:p-6">
          <Card className="p-6 rounded-3xl">
            <div className="text-sm text-muted-foreground">
              {profileError ? profileError : "No profile loaded."}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const optionsBusy =
    programsLoading || yearLevelsLoading || saving || profileLoading;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* ✅ Responsive page padding */}
          <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-2xl font-bold text-foreground truncate">
                  Profile
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Update your personal details, course/program, year level, and
                  photo.
                </div>
              </div>

              {/* ✅ Desktop/Tablet save button */}
              <Button
                onClick={onSave}
                disabled={saving || profileLoading}
                className="hidden sm:inline-flex gap-2 rounded-xl"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving" : "Save changes"}
              </Button>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 pb-0 sm:pb-10 space-y-6">
            <Card className="rounded-3xl overflow-hidden">
              <div className="px-5 sm:px-7 sm:py-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0 ring-1 ring-border">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={() => setAvatarUrl("")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      <label className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background border border-border shadow-sm flex items-center justify-center cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onPickFile}
                          disabled={saving}
                        />
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </label>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-col">
                        <div className="text-xl font-semibold text-foreground truncate ">
                          {displayName}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground truncate">
                          {readonly.email}
                        </div>
                      </div>

                      <div className="hidden mt-3 sm:flex flex-wrap gap-2">
                        <Pill tone="info">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {readonly.role}
                        </Pill>

                        <Pill tone={readonly.statusTone}>
                          {readonly.statusText}
                        </Pill>

                        <Pill tone="neutral">{readonly.program}</Pill>
                        <Pill tone="neutral">{readonly.yearLevel}</Pill>
                      </div>
                    </div>
                  </div>
                  <div className="sm:hidden mt-3 flex flex-wrap gap-2">
                    <Pill tone="info">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {readonly.role}
                    </Pill>

                    <Pill tone={readonly.statusTone}>
                      {readonly.statusText}
                    </Pill>

                    <Pill tone="neutral">{readonly.program}</Pill>
                    <Pill tone="neutral">{readonly.yearLevel}</Pill>
                  </div>
                </div>

                {displayError ? (
                  <div className="mt-5 text-sm text-red-700 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 rounded-2xl px-4 py-3">
                    {displayError}
                  </div>
                ) : null}

                {profileLoading ? (
                  <p className="mt-3 text-xs text-muted-foreground">Syncing…</p>
                ) : null}
              </div>

              <Separator />

              <div className="px-5 sm:p-7 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Stat label="Student ID" value={readonly.studentId} />
                  <Stat label="Program" value={readonly.program} />
                  <Stat label="Year level" value={readonly.yearLevel} />
                  <Stat label="Status" value={readonly.statusText} />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="First name" hint="Use your legal name.">
                    <Input
                      value={form.firstname}
                      onChange={(e) => onChange("firstname", e.target.value)}
                      className="h-11 rounded-xl"
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Middle name" hint="Leave blank if none.">
                    <Input
                      value={form.middlename}
                      onChange={(e) => onChange("middlename", e.target.value)}
                      className="h-11 rounded-xl"
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Last name">
                    <Input
                      value={form.lastname}
                      onChange={(e) => onChange("lastname", e.target.value)}
                      className="h-11 rounded-xl"
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Gender">
                    <Select
                      value={form.gender}
                      onValueChange={(v) => onChange("gender", v)}
                      disabled={saving}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="Age" hint="Whole number only.">
                    <Input
                      type="number"
                      value={form.age}
                      onChange={(e) => onChange("age", e.target.value)}
                      className="h-11 rounded-xl"
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Email" hint="Managed by your account sign in.">
                    <Input
                      value={readonly.email}
                      className="h-11 rounded-xl"
                      disabled
                    />
                  </Field>

                  <Field
                    label="Program"
                    hint="You can update this if you shifted."
                  >
                    <Select
                      value={form.program_id}
                      onValueChange={(v) => onChange("program_id", v)}
                      disabled={optionsBusy || !programs?.length}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue
                          placeholder={
                            programsLoading ? "Loading..." : "Select program"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(programs || []).map((p) => (
                          <SelectItem
                            key={p.program_id}
                            value={String(p.program_id)}
                          >
                            {p.program}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field
                    label="Year level"
                    hint="Update this every school year."
                  >
                    <Select
                      value={form.yearLevel_id}
                      onValueChange={(v) => onChange("yearLevel_id", v)}
                      disabled={optionsBusy || !yearLevels?.length}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue
                          placeholder={
                            yearLevelsLoading ? "Loading..." : "Select year"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(yearLevels || []).map((y) => (
                          <SelectItem
                            key={y.yearLevel_id}
                            value={String(y.yearLevel_id)}
                          >
                            {y.year_level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </Card>

            <div className="h-2" />
          </div>
        </div>
      </main>

      {/* ✅ Mobile: Sticky Save Bar (fixes position on all small screens) */}
      <div className="sm:hidden sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="px-4 py-3">
          <Button
            onClick={onSave}
            disabled={saving || profileLoading}
            className="w-full gap-2 rounded-2xl h-12"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
