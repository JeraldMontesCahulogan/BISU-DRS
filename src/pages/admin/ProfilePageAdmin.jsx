/* eslint-disable react-hooks/set-state-in-effect */
// src/pages/ProfilePage.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/stores/userStore";
import { useAdminStore } from "@/stores/adminStore";

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

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

import {
  Camera,
  KeyRound,
  Loader2,
  Save,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { SectionLoader } from "@/components/SectionLoader";
// import { Header } from "@/components/student-components/header";

function safeFullName(p) {
  const name = `${p?.firstname || ""} ${p?.lastname || ""}`.trim();
  return name || "User";
}

// function Pill({ children, tone = "neutral" }) {
//   const tones = {
//     neutral: "bg-muted text-foreground",
//     good: "bg-emerald-50 text-emerald-700 border border-emerald-200",
//     warn: "bg-amber-50 text-amber-700 border border-amber-200",
//     bad: "bg-red-50 text-red-700 border border-red-200",
//     info: "bg-blue-50 text-blue-700 border border-blue-200",
//   };

//   return (
//     <div
//       className={[
//         "text-xs px-3 py-1 rounded-full inline-flex items-center gap-2",
//         tones[tone] || tones.neutral,
//       ].join(" ")}
//     >
//       {children}
//     </div>
//   );
// }

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

function cleanPin(v) {
  return String(v || "").replace(/\s+/g, "");
}

function validPin(v) {
  return /^[0-9]{4}$/.test(cleanPin(v));
}

function PinOtpField({
  label,
  hint,
  value,
  onChange,
  disabled,
  helperText,
  helperTone = "neutral",
}) {
  const tones = {
    neutral: "text-muted-foreground",
    good: "text-emerald-700",
    bad: "text-red-600",
    warn: "text-amber-700",
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-card/70 px-4 py-4">
        <div className="flex items-center justify-center">
          <InputOTP
            value={value}
            onChange={(v) => onChange(String(v || "").slice(0, 4))}
            maxLength={4}
            pattern={REGEXP_ONLY_DIGITS}
            disabled={disabled}
          >
            <InputOTPGroup className="gap-3 sm:gap-4">
              <InputOTPSlot
                index={0}
                className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-semibold rounded-2xl"
              />
              <InputOTPSlot
                index={1}
                className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-semibold rounded-2xl"
              />
              <InputOTPSlot
                index={2}
                className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-semibold rounded-2xl"
              />
              <InputOTPSlot
                index={3}
                className="h-12 w-12 sm:h-14 sm:w-14 text-lg font-semibold rounded-2xl"
              />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div
          className={[
            "mt-3 text-xs text-center",
            tones[helperTone] || tones.neutral,
          ].join(" ")}
        >
          {helperText}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePageAdmin() {
  const subscribedRef = useRef(false);

  const profile = useUserStore((s) => s.profile);
  const profileLoading = useUserStore((s) => s.profileLoading);
  const profileError = useUserStore((s) => s.profileError);

  const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);
  const fetchUserProfile = useUserStore((s) => s.fetchUserProfile);

  const updateMyProfile = useUserStore((s) => s.updateMyProfile);
  const uploadMyProfileImage = useUserStore((s) => s.uploadMyProfileImage);

  const pinLoading = useAdminStore((s) => s.pinLoading);
  const pinErrorStore = useAdminStore((s) => s.pinError);
  const updateMyPin = useAdminStore((s) => s.updateMyPin);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");

  const [form, setForm] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    gender: "",
    age: "",
  });

  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState("");
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsub = subscribeUserProfile();
    fetchUserProfile();

    return () => unsub?.();
  }, [subscribeUserProfile, fetchUserProfile]);

  useEffect(() => {
    if (!profile) return;

    setForm({
      firstname: profile.firstname || "",
      middlename: profile.middlename || "",
      lastname: profile.lastname || "",
      gender: profile.gender || "",
      age: profile.age == null ? "" : String(profile.age),
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

    const statusTone =
      statusText === "Approved"
        ? "good"
        : statusText === "Pending"
          ? "warn"
          : "bad";

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

  const approvalId = Number(profile?.approvalStatus_id ?? 0);
  const isApproved = approvalId === 2;

  const roleName = useMemo(() => {
    const id = Number(profile?.usertype_id ?? 0);
    if (id === 1) return "admin";
    if (id === 2) return "student";
    if (id === 3) return "staff";
    if (id === 4) return "chairperson";
    return String(profile?.user_type?.user_type || "").toLowerCase();
  }, [profile?.usertype_id, profile?.user_type?.user_type]);

  const pinFeatureAllowed = useMemo(() => {
    if (!isApproved) return false;
    const allowed = ["admin", "student", "staff", "chairperson"];
    return allowed.includes(String(roleName || ""));
  }, [isApproved, roleName]);

  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

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
    };

    const res = await updateMyProfile(payload);

    setSaving(false);
    if (res?.error) setLocalError(res.error.message || "Save failed");
  };

  const onPinChange = (key, value) => {
    const next = cleanPin(value).slice(0, 4);
    setPinForm((p) => ({ ...p, [key]: next }));
    if (pinError) setPinError("");
    if (pinSuccess) setPinSuccess("");
  };

  const onUpdatePin = async () => {
    setPinError("");
    setPinSuccess("");

    if (!pinFeatureAllowed) {
      setPinError("PIN update is locked for your account status.");
      return;
    }

    const currentPin = cleanPin(pinForm.currentPin);
    const newPin = cleanPin(pinForm.newPin);
    const confirmPin = cleanPin(pinForm.confirmPin);

    if (!validPin(currentPin)) {
      setPinError("Current PIN must be 4 digits.");
      return;
    }

    if (!validPin(newPin)) {
      setPinError("New PIN must be 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("New PIN and confirm PIN do not match.");
      return;
    }

    if (newPin === currentPin) {
      setPinError("New PIN must be different.");
      return;
    }

    const res = await updateMyPin({ currentPin, newPin });

    if (!res?.ok) setPinError(pinErrorStore || "Failed to update PIN.");
    else {
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
      setPinSuccess("PIN updated successfully.");
    }
  };

  const displayError = localError || profileError || "";

  const pinHelper = useMemo(() => {
    if (!pinFeatureAllowed) return { tone: "neutral", text: "" };
    if (pinError) return { tone: "bad", text: pinError };
    if (!pinError && pinErrorStore)
      return { tone: "bad", text: String(pinErrorStore) };
    if (pinSuccess) return { tone: "good", text: pinSuccess };

    const c = cleanPin(pinForm.currentPin).length;
    const n = cleanPin(pinForm.newPin).length;
    const f = cleanPin(pinForm.confirmPin).length;

    if (c && c < 4)
      return { tone: "warn", text: "Current PIN needs 4 digits." };
    if (n && n < 4) return { tone: "warn", text: "New PIN needs 4 digits." };
    if (f && f < 4)
      return { tone: "warn", text: "Confirm PIN needs 4 digits." };

    if (n === 4 && f === 4 && pinForm.newPin !== pinForm.confirmPin)
      return { tone: "warn", text: "New PIN and confirm PIN must match." };

    return { tone: "neutral", text: "Enter 4 digits per field." };
  }, [
    pinFeatureAllowed,
    pinError,
    pinErrorStore,
    pinSuccess,
    pinForm.currentPin,
    pinForm.newPin,
    pinForm.confirmPin,
  ]);

  if (profileLoading && !profile) {
    return (
      <SectionLoader title="Loading profile" subtitle="Getting your details" />
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card className="p-6 rounded-3xl">
          <div className="text-sm text-muted-foreground">
            No profile loaded.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* <Header /> */}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="px-6 pt-8 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-2xl font-bold text-foreground truncate">
                  Profile
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Update your personal details and photo.
                </div>
              </div>

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

          <div className="p-6 space-y-6">
            <Card className="rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-center gap-5">
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
                      <div className="text-xl font-semibold text-foreground truncate">
                        {displayName}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground truncate">
                        {readonly.email}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Pill tone="info">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {readonly.role}
                        </Pill>

                        <Pill
                          tone={
                            readonly.statusText === "approved" ? "good" : "bad"
                          }
                        >
                          {readonly.statusText}
                        </Pill>

                        <Pill tone="neutral">{readonly.program}</Pill>
                        <Pill tone="neutral">{readonly.yearLevel}</Pill>
                      </div>
                    </div>
                  </div>

                  <div className="sm:ml-auto w-full sm:w-auto">
                    <Button
                      onClick={onSave}
                      disabled={saving || profileLoading}
                      className="w-full sm:hidden gap-2 rounded-xl"
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

                {displayError ? (
                  <div className="mt-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                    {displayError}
                  </div>
                ) : null}
              </div>

              <Separator />

              <div className="p-6 sm:p-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Stat label="Student ID" value={readonly.studentId} />
                  <Stat label="Program" value={readonly.program} />
                  {/* <Stat label="Year level" value={readonly.yearLevel} /> */}
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
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl overflow-hidden">
              <div className="px-6 py-2">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-foreground">
                      Security PIN
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Update your PIN.
                    </div>
                  </div>
                </div>

                {!pinFeatureAllowed ? (
                  <div className="mt-5 rounded-2xl border bg-muted/40 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          PIN update is locked
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Approval is required.
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Role: {roleName || "unknown"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <PinOtpField
                        label="Current PIN"
                        hint="4 digits."
                        value={pinForm.currentPin}
                        onChange={(v) => onPinChange("currentPin", v)}
                        disabled={pinLoading}
                        helperText=" "
                      />

                      <PinOtpField
                        label="New PIN"
                        hint="4 digits."
                        value={pinForm.newPin}
                        onChange={(v) => onPinChange("newPin", v)}
                        disabled={pinLoading}
                        helperText=" "
                      />

                      <PinOtpField
                        label="Confirm PIN"
                        hint="Must match new PIN."
                        value={pinForm.confirmPin}
                        onChange={(v) => onPinChange("confirmPin", v)}
                        disabled={pinLoading}
                        helperText=" "
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border bg-card/60 px-4 py-3">
                      <div
                        className={[
                          "text-sm text-center",
                          pinHelper.tone === "bad"
                            ? "text-red-600"
                            : pinHelper.tone === "good"
                              ? "text-emerald-700"
                              : pinHelper.tone === "warn"
                                ? "text-amber-700"
                                : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {pinHelper.text}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPinError("");
                          setPinSuccess("");
                          setPinForm({
                            currentPin: "",
                            newPin: "",
                            confirmPin: "",
                          });
                        }}
                        disabled={pinLoading}
                        className="rounded-xl"
                      >
                        Clear
                      </Button>

                      <Button
                        onClick={onUpdatePin}
                        disabled={pinLoading}
                        className="gap-2 rounded-xl"
                      >
                        {pinLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {pinLoading ? "Updating" : "Update PIN"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <div className="h-2" />
          </div>
        </div>
      </main>
    </div>
  );
}
