/* eslint-disable react-hooks/static-components */
/* eslint-disable no-unused-vars */
// SurveyForm.jsx
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SurveySkeletal from "../skeletal/SurveySkeletal";
import {
  AlertCircle,
  Clock,
  Mail,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUserStore } from "@/stores/userStore";
import { usePredictionStore } from "@/stores/predictionStore";
import { SectionLoader } from "../SectionLoader";
import SurveyResultPopup from "./SurveyResultPopup";

/* ============================= */
/* ✅ SCHEDULE WINDOW HELPERS     */
/* ============================= */

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// inclusive window: start_at <= now <= end_at
function isScheduleOpen(schedule) {
  if (!schedule?.is_active) return false;

  const start = toDate(schedule?.start_at);
  const end = toDate(schedule?.end_at);
  if (!start || !end) return false;

  const now = new Date();
  return now >= start && now <= end;
}

function formatDT(v) {
  const d = toDate(v);
  if (!d) return "N/A";
  return d.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ============================= */
/* ✅ PROFILE -> FORM NORMALIZERS */
/* ============================= */

function normalizeGenderFromProfile(v) {
  // form expects: "1" male, "0" female
  if (v === null || v === undefined) return "";
  const s = String(v).toLowerCase().trim();

  if (s === "1" || s === "male" || s === "m") return "1";
  if (s === "0" || s === "female" || s === "f") return "0";
  return "";
}

function normalizeYearLevelFromProfile(v) {
  if (!v) return "";
  const s = String(v).trim();

  if (/^1/.test(s)) return "1st Year";
  if (/^2/.test(s)) return "2nd Year";
  if (/^3/.test(s)) return "3rd Year";
  if (/^4/.test(s)) return "4th Year";

  return s;
}

/* ============================= */
/* NOTICES                       */
/* ============================= */
function NoticeShell({ icon: Icon, badge, title, description, children }) {
  return (
    <div className="bg-background flex h-full items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-xl">
        <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/60">
          <CardHeader className="border-b border-border/60 bg-background/30 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60 sm:h-10 sm:w-10">
                  <Icon className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="grid min-w-0 gap-1">
                  <CardTitle className="text-sm leading-tight sm:text-lg">
                    {title}
                  </CardTitle>
                  {description ? (
                    <CardDescription className="text-xs leading-snug sm:text-sm">
                      {description}
                    </CardDescription>
                  ) : null}
                </div>
              </div>

              {badge ? (
                <Badge
                  variant="outline"
                  className="border-border/60 bg-background/40 text-muted-foreground shrink-0 px-2 py-1 text-[11px] sm:text-xs"
                >
                  {badge}
                </Badge>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="px-4 pt-2">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
      <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div className="grid min-w-0 gap-0.5">
        <div className="text-muted-foreground text-[11px] sm:text-xs">
          {label}
        </div>
        <div className="text-foreground wrap-break-word text-xs font-medium sm:text-sm">
          {value}
        </div>
      </div>
    </div>
  );
}

function PendingApprovalNotice({ profile }) {
  const email = "jerald.cahulogan@bisu.edu.ph";

  const studentName = `${profile?.firstname || ""} ${profile?.lastname || ""}`
    .trim()
    .replace(/\s+/g, " ");

  const studentId = profile?.student_id || "";

  const studentDepartment =
    profile?.program?.department?.department ||
    profile?.department?.department ||
    "";

  const studentCourse =
    profile?.program?.program || profile?.course || profile?.program_name || "";

  const studentYear =
    profile?.year?.year_level ||
    profile?.year_level ||
    profile?.yearLevel ||
    "";

  const subject = "Account Approval Request (Pending Approval)";
  const body = [
    "Good day Guidance Office,",
    "",
    "I would like to request approval for my account. It is currently showing as pending approval.",
    "",
    "Student details:",
    `- Name: ${studentName || "N/A"}`,
    `- Student ID: ${studentId || "N/A"}`,
    `- Department: ${studentDepartment || "N/A"}`,
    `- Course/Program: ${studentCourse || "N/A"}`,
    `- Year Level: ${studentYear || "N/A"}`,
    "",
    "Thank you.",
  ].join("\n");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleEmailClick = () => {
    const enc = encodeURIComponent;
    const mailtoUrl = `mailto:${email}?subject=${enc(subject)}&body=${enc(body)}`;

    if (isMobile) {
      window.location.href = mailtoUrl;
      return;
    }

    const gmailUrl =
      `https://mail.google.com/mail/u/0/?view=cm&fs=1&ui=2&tf=1` +
      `&to=${enc(email)}&su=${enc(subject)}&body=${enc(body)}`;

    try {
      const w = window.open(gmailUrl, "_blank", "noopener,noreferrer");
      if (!w) window.location.href = mailtoUrl;
    } catch {
      window.location.href = mailtoUrl;
    }
  };

  return (
    <NoticeShell
      icon={ShieldCheck}
      badge="Approval required"
      title="Account pending approval"
      description="Your account is currently under review by the Guidance Office."
    >
      <div className="grid gap-4">
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
          <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
            You’ll be able to access the survey as soon as your account is
            approved.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              Status: Pending
            </Badge>
            <span className="text-muted-foreground text-xs">
              If this takes too long, contact the office below.
            </span>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="text-foreground text-xs font-semibold sm:text-sm">
            Guidance Office contact
          </div>

          <InfoRow icon={Mail} label="Email" value={email} />
          <InfoRow
            icon={Clock}
            label="Office hours"
            value="Monday–Friday, 8:00 AM–5:00 PM"
          />

          <div className="mt-2 flex flex-col sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="border-border/60 bg-background/60 w-full sm:w-auto"
              onClick={handleEmailClick}
            >
              Email Guidance Office
            </Button>
          </div>
        </div>
      </div>
    </NoticeShell>
  );
}

function SurveyScheduleTakeNotice({ profile }) {
  const programLabel = profile?.program?.program || "Not set";
  const yearLabel = profile?.year?.year_level || "Not set";

  return (
    <NoticeShell
      icon={CalendarClock}
      badge="No active schedule"
      title="No active survey schedule"
      description="There is currently no open survey schedule for your program and year level."
    >
      <div className="grid gap-4">
        <div className="grid gap-3">
          <InfoRow icon={AlertCircle} label="Program" value={programLabel} />
          <InfoRow icon={AlertCircle} label="Year level" value={yearLabel} />
        </div>

        <Separator className="bg-border/60" />

        <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
          <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
            Please wait for the Guidance Office to open a schedule. Once a
            schedule is active, this page will automatically allow access.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
            >
              Tip
            </Badge>
            <span className="text-muted-foreground text-xs">
              Make sure your program and year level are correct in your profile.
            </span>
          </div>
        </div>
      </div>
    </NoticeShell>
  );
}

function SurveyScheduleWindowNotice({ schedule }) {
  const startLabel = formatDT(schedule?.start_at);
  const endLabel = formatDT(schedule?.end_at);

  const now = new Date();
  const start = toDate(schedule?.start_at);
  const end = toDate(schedule?.end_at);

  const status =
    start && now < start
      ? "not_started"
      : end && now > end
        ? "ended"
        : "unknown";

  const meta =
    status === "not_started"
      ? {
          badge: "Not started",
          title: "Survey not open yet",
          msg: "Please come back when the schedule starts.",
          badgeClass:
            "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
          icon: CalendarClock,
        }
      : status === "ended"
        ? {
            badge: "Closed",
            title: "Survey schedule ended",
            msg: "The survey is already closed for your schedule.",
            badgeClass:
              "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
            icon: AlertCircle,
          }
        : {
            badge: "Unavailable",
            title: "Survey not available",
            msg: "Please wait for the Guidance Office.",
            badgeClass:
              "border-border/60 bg-background/40 text-muted-foreground",
            icon: AlertCircle,
          };

  const Icon = meta.icon;

  return (
    <NoticeShell
      icon={Icon}
      badge={
        <span className={meta.badgeClass + " rounded-md px-2 py-0.5 text-xs"}>
          {meta.badge}
        </span>
      }
      title={meta.title}
      description={meta.msg}
    >
      <div className="grid gap-4">
        <div className="grid gap-3">
          <InfoRow icon={Clock} label="Starts" value={startLabel} />
          <InfoRow icon={Clock} label="Ends" value={endLabel} />
        </div>

        <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
          <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
            This window controls when the survey is accessible. If you believe
            this is incorrect, contact the Guidance Office.
          </p>
        </div>
      </div>
    </NoticeShell>
  );
}

/* ============================= */
/* UI HELPERS                    */
/* ============================= */

function FieldCard({ title, hint, children }) {
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 lg:p-6">
      <div className="mb-4">
        <p className="text-foreground text-sm font-semibold sm:text-base">
          {title}
        </p>
        {hint ? (
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function OptionGrid({ children, cols = "sm:grid-cols-2" }) {
  return <div className={`grid grid-cols-1 ${cols} gap-3`}>{children}</div>;
}

function RadioCard({ id, value, children }) {
  return (
    <label
      htmlFor={id}
      className="focus-within:ring-primary/40 flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 transition hover:bg-accent focus-within:ring-2"
    >
      <RadioGroupItem id={id} value={value} className="h-5 w-5" />
      <span className="text-foreground text-sm font-medium">{children}</span>
    </label>
  );
}

function safeId(v) {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ============================= */
/* SECTIONS                      */
/* ============================= */

function DemographicsSection({
  formData,
  handleInputChange,
  programs,
  programsLoading,
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-8">
      <FieldCard title="Gender" hint="Select one option.">
        <RadioGroup
          value={formData.gender}
          onValueChange={(value) => handleInputChange("gender", value)}
        >
          <OptionGrid>
            <RadioCard id="male" value="1">
              Male
            </RadioCard>
            <RadioCard id="female" value="0">
              Female
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard title="Age" hint="Use whole number.">
        <Input
          id="age"
          type="number"
          placeholder="Enter your age"
          value={formData.age}
          onChange={(e) => handleInputChange("age", e.target.value)}
          className="h-11 rounded-xl px-4"
        />
      </FieldCard>

      <FieldCard title="Course" hint="Choose your program.">
        <Select
          value={formData.course}
          onValueChange={(v) => handleInputChange("course", v)}
        >
          <SelectTrigger className="h-11 rounded-xl px-4">
            <SelectValue
              placeholder={
                programsLoading ? "Loading..." : "Select your course"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(programs) ? programs : []).map((p) => (
              <SelectItem key={p.program_id} value={p.program}>
                {p.program}
              </SelectItem>
            ))}

            {!programsLoading && (!programs || programs.length === 0) ? (
              <>
                <SelectItem value="BEED">BEED</SelectItem>
                <SelectItem value="BSED major in English">
                  BSED Major in English
                </SelectItem>
                <SelectItem value="BSED major in Filipino">
                  BSED Major in Filipino
                </SelectItem>
                <SelectItem value="BSED major in Mathematics">
                  BSED Major in Mathematics
                </SelectItem>
                <SelectItem value="BSED major in Science">
                  BSED Major in Science
                </SelectItem>
                <SelectItem value="BSCS">BSCS</SelectItem>
                <SelectItem value="BSES">BSES</SelectItem>
                <SelectItem value="BSF">BSF</SelectItem>
                <SelectItem value="BSMB">BSMB</SelectItem>
                <SelectItem value="BSOA">BSOA</SelectItem>
                <SelectItem value="BSHM">BSHM</SelectItem>
              </>
            ) : null}
          </SelectContent>
        </Select>
      </FieldCard>

      <FieldCard title="Year Level" hint="Choose your current year.">
        <Select
          value={formData.yearLevel}
          onValueChange={(v) => handleInputChange("yearLevel", v)}
        >
          <SelectTrigger className="h-11 rounded-xl px-4">
            <SelectValue placeholder="Select year level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1st Year">1st Year</SelectItem>
            <SelectItem value="2nd Year">2nd Year</SelectItem>
            <SelectItem value="3rd Year">3rd Year</SelectItem>
            <SelectItem value="4th Year">4th Year</SelectItem>
          </SelectContent>
        </Select>
      </FieldCard>

      <FieldCard
        title="Working Student"
        hint="This helps interpret time constraints."
      >
        <RadioGroup
          value={formData.workingStudent}
          onValueChange={(v) => handleInputChange("workingStudent", v)}
        >
          <OptionGrid>
            <RadioCard id="working-yes" value="1">
              Yes
            </RadioCard>
            <RadioCard id="working-no" value="0">
              No
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard title="PWD" hint="Optional. Used for support planning.">
        <RadioGroup
          value={formData.pwd}
          onValueChange={(v) => handleInputChange("pwd", v)}
        >
          <OptionGrid>
            <RadioCard id="pwd-yes" value="1">
              Yes
            </RadioCard>
            <RadioCard id="pwd-no" value="0">
              No
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard title="Living Arrangement" hint="Choose your current setup.">
        <Select
          value={formData.livingArrangement}
          onValueChange={(v) => handleInputChange("livingArrangement", v)}
        >
          <SelectTrigger className="h-11 rounded-xl px-4">
            <SelectValue placeholder="Select your living arrangement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Living with family">
              Living with Family
            </SelectItem>
            <SelectItem value="Living in a dormitory/boarding house">
              Living in a Dorm/Boarding House
            </SelectItem>
            <SelectItem value="Living with guardian">
              Living with Guardian
            </SelectItem>
            <SelectItem value="Living alone">Living Alone</SelectItem>
            <SelectItem value="Living with partner">
              Living with Partner/Spouse
            </SelectItem>
            <SelectItem value="Living with friends">
              Living with Friends
            </SelectItem>
            <SelectItem value="Living with relative">
              Living with Relatives
            </SelectItem>
          </SelectContent>
        </Select>
      </FieldCard>

      <FieldCard
        title="Indigenous Group"
        hint="Optional. Used for inclusion reporting."
      >
        <RadioGroup
          value={formData.indigenousGroup}
          onValueChange={(v) => handleInputChange("indigenousGroup", v)}
        >
          <OptionGrid>
            <RadioCard id="indigenous-yes" value="1">
              Yes
            </RadioCard>
            <RadioCard id="indigenous-no" value="0">
              No
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>
    </div>
  );
}

function PhysicalHealthSection({ formData, handleInputChange }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FieldCard title="Height" hint="Centimeters (cm).">
          <Input
            id="height"
            type="number"
            placeholder="Enter your height"
            value={formData.height}
            onChange={(e) => handleInputChange("height", e.target.value)}
            className="h-11 rounded-xl px-4"
          />
        </FieldCard>

        <FieldCard title="Weight" hint="Kilograms (kg).">
          <Input
            id="weight"
            type="number"
            placeholder="Enter your weight"
            value={formData.weight}
            onChange={(e) => handleInputChange("weight", e.target.value)}
            className="h-11 rounded-xl px-4"
          />
        </FieldCard>
      </div>

      <FieldCard title="Sleep Duration" hint="Pick the closest range.">
        <RadioGroup
          value={formData.sleepDuration}
          onValueChange={(v) => handleInputChange("sleepDuration", v)}
        >
          <OptionGrid cols="sm:grid-cols-3">
            <RadioCard id="sleep-less" value="Less than 7 hours">
              Less than 7 hours
            </RadioCard>
            <RadioCard id="sleep-normal" value="7 to 9 hours">
              7 to 9 hours
            </RadioCard>
            <RadioCard id="sleep-more" value="More than 9 hours">
              More than 9 hours
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard title="Breakfast Habit" hint="How often you eat breakfast.">
        <RadioGroup
          value={formData.breakfastHabit}
          onValueChange={(v) => handleInputChange("breakfastHabit", v)}
        >
          <OptionGrid cols="sm:grid-cols-3">
            <RadioCard id="breakfast-rarely" value="Rarely">
              Rarely
            </RadioCard>
            <RadioCard id="breakfast-sometimes" value="Sometimes">
              Sometimes
            </RadioCard>
            <RadioCard id="breakfast-regularly" value="Regularly">
              Regularly
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard
        title="Exercise Frequency"
        hint="How active you are each week."
      >
        <RadioGroup
          value={formData.exerciseFrequency}
          onValueChange={(v) => handleInputChange("exerciseFrequency", v)}
        >
          <OptionGrid cols="sm:grid-cols-3">
            <RadioCard id="exercise-inactive" value="Inactive">
              Inactive
            </RadioCard>
            <RadioCard id="exercise-moderate" value="Moderate">
              Moderate
            </RadioCard>
            <RadioCard id="exercise-active" value="Active">
              Active
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard title="Smoking Status" hint="Choose one.">
        <RadioGroup
          value={formData.smokingStatus}
          onValueChange={(v) => handleInputChange("smokingStatus", v)}
        >
          <OptionGrid cols="sm:grid-cols-3">
            <RadioCard id="smoking-non" value="Non-smoker">
              Non smoker
            </RadioCard>
            <RadioCard id="smoking-ex" value="Ex-smoker">
              Ex smoker
            </RadioCard>
            <RadioCard id="smoking-current" value="Current smoker">
              Current smoker
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard title="Alcohol Consumption" hint="Choose the closest.">
        <RadioGroup
          value={formData.alcoholConsumption}
          onValueChange={(v) => handleInputChange("alcoholConsumption", v)}
        >
          <OptionGrid cols="sm:grid-cols-4">
            <RadioCard id="alcohol-never" value="Never">
              Never
            </RadioCard>
            <RadioCard id="alcohol-rarely" value="Rarely">
              Rarely
            </RadioCard>
            <RadioCard id="alcohol-occasionally" value="Occasionally">
              Occasionally
            </RadioCard>
            <RadioCard id="alcohol-daily" value="Daily">
              Daily
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>
    </div>
  );
}

function AcademicLifestyleSection({ formData, handleInputChange }) {
  const frequencyOptions = ["Never", "Rarely", "Sometimes", "Often", "Always"];
  const toLabel = (v) => v.charAt(0).toUpperCase() + v.slice(1);
  return (
    <div className="space-y-6">
      <FieldCard
        title="Time spent on schoolwork daily"
        hint="Pick the closest range."
      >
        <RadioGroup
          value={formData.schoolworkTime}
          onValueChange={(value) => handleInputChange("schoolworkTime", value)}
        >
          <OptionGrid cols="sm:grid-cols-3">
            <RadioCard id="schoolwork-less-2" value="Less than 2h">
              Less than 2 hours
            </RadioCard>
            <RadioCard id="schoolwork-2-3" value="2 to 3h">
              2 to 3 hours
            </RadioCard>
            <RadioCard id="schoolwork-more-3" value="More than 3h">
              More than 3 hours
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard
        title="Social support"
        hint="I have friends or relatives who take time to listen if I need someone to talk to."
      >
        <RadioGroup
          value={formData.socialSupport}
          onValueChange={(value) => handleInputChange("socialSupport", value)}
        >
          <OptionGrid cols="sm:grid-cols-5">
            {frequencyOptions.map((opt) => (
              <RadioCard key={opt} id={`support-${opt}`} value={opt}>
                {toLabel(opt)}
              </RadioCard>
            ))}
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard
        title="Relationship stress"
        hint="How often have you felt stressed because of your romantic or personal relationship?"
      >
        <RadioGroup
          value={formData.relationshipStress}
          onValueChange={(value) =>
            handleInputChange("relationshipStress", value)
          }
        >
          <OptionGrid cols="sm:grid-cols-5">
            {frequencyOptions.map((opt) => (
              <RadioCard key={opt} id={`relationship-${opt}`} value={opt}>
                {toLabel(opt)}
              </RadioCard>
            ))}
          </OptionGrid>
        </RadioGroup>
      </FieldCard>

      <FieldCard
        title="Bullying"
        hint="During the past 12 months, were you bullied on school property?"
      >
        <RadioGroup
          value={formData.bullied}
          onValueChange={(value) => handleInputChange("bullied", value)}
        >
          <OptionGrid cols="sm:grid-cols-2">
            <RadioCard id="bullied-yes" value="1">
              Yes
            </RadioCard>
            <RadioCard id="bullied-no" value="0">
              No
            </RadioCard>
          </OptionGrid>
        </RadioGroup>
      </FieldCard>
    </div>
  );
}

function MentalHealthSection({ formData, handleInputChange }) {
  const agreeOptions = [
    { value: "Strongly Disagree", label: "Strongly disagree" },
    { value: "Disagree", label: "Disagree" },
    { value: "Neutral", label: "Neutral" },
    { value: "Agree", label: "Agree" },
    { value: "Strongly Agree", label: "Strongly agree" },
  ];

  const Question = ({ field, title, hint }) => {
    const preserve =
      field === "schoolworkOverload" || field === "financialStress";

    return (
      <FieldCard title={title} hint={hint}>
        <RadioGroup
          value={formData[field]}
          onValueChange={(value) =>
            handleInputChange(field, value, { preserveScroll: preserve })
          }
        >
          <OptionGrid cols="sm:grid-cols-5">
            {agreeOptions.map((opt) => (
              <RadioCard
                key={opt.value}
                id={`${field}-${safeId(opt.value)}`}
                value={opt.value}
              >
                {opt.label}
              </RadioCard>
            ))}
          </OptionGrid>
        </RadioGroup>
      </FieldCard>
    );
  };

  return (
    <div className="space-y-6">
      <Question
        field="academicPressure"
        title="Academic pressure"
        hint="I feel a lot of pressure in my daily studying."
      />
      <Question
        field="academicDissatisfaction"
        title="Grade dissatisfaction"
        hint="I am dissatisfied with my academic grades."
      />
      <Question
        field="schoolworkOverload"
        title="Schoolwork overload"
        hint="I feel there is too much schoolwork."
      />
      <Question
        field="financialStress"
        title="Financial stress"
        hint="I feel depressed because of my financial situation."
      />
    </div>
  );
}

/* ============================= */
/* MAIN SURVEY FORM              */
/* ============================= */

export default function SurveyForm() {
  const subscribedRef = useRef(false);
  const pageScrollRef = useRef(null);

  const profile = useUserStore((s) => s.profile);
  const profileLoading = useUserStore((s) => s.profileLoading);
  const profileError = useUserStore((s) => s.profileError);
  const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);

  const schedule = useUserStore((s) => s.schedule);
  const scheduleLoading = useUserStore((s) => s.scheduleLoading);
  const scheduleError = useUserStore((s) => s.scheduleError);

  const programs = useUserStore((s) => s.programs);
  const programsLoading = useUserStore((s) => s.programsLoading);
  const fetchPrograms = useUserStore((s) => s.fetchPrograms);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsub = subscribeUserProfile();
    return () => unsub?.();
  }, [subscribeUserProfile]);

  useEffect(() => {
    fetchPrograms?.();
  }, [fetchPrograms]);

  const approvalStatus = profile?.approvalStatus_id ?? null;
  const needsSchedule = approvalStatus === 2;

  const pageLoading =
    (profileLoading && !profile && !profileError) ||
    (needsSchedule && scheduleLoading && !schedule && !scheduleError);

  const sections = useMemo(
    () => [
      { title: "Demographics", description: "Basic information about you" },
      {
        title: "Physical Health",
        description: "Your health and lifestyle habits",
      },
      {
        title: "Academic & Lifestyle",
        description: "Your academic and social experiences",
      },
      {
        title: "Mental Health & Wellbeing",
        description: "Your mental health and emotional wellbeing",
      },
    ],
    [],
  );

  const [agreed, setAgreed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    course: "",
    yearLevel: "",
    workingStudent: "",
    pwd: "",
    livingArrangement: "",
    indigenousGroup: "",
    height: "",
    weight: "",
    sleepDuration: "",
    breakfastHabit: "",
    exerciseFrequency: "",
    smokingStatus: "",
    alcoholConsumption: "",
    schoolworkTime: "",
    socialSupport: "",
    relationshipStress: "",
    bullied: "",
    academicPressure: "",
    academicDissatisfaction: "",
    schoolworkOverload: "",
    financialStress: "",
  });

  const handleInputChange = (field, value, opts = {}) => {
    const { preserveScroll = false } = opts;

    const el = pageScrollRef.current;
    const top = preserveScroll && el ? el.scrollTop : null;

    setFormData((p) => ({ ...p, [field]: value }));

    if (preserveScroll && el && top !== null) {
      requestAnimationFrame(() => {
        if (Math.abs(el.scrollTop - top) > 2) el.scrollTop = top;
      });
    }
  };

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!profile) return;
    if (hydratedRef.current) return;

    const pGender = normalizeGenderFromProfile(profile?.gender);
    const pAge =
      profile?.age !== null && profile?.age !== undefined
        ? String(profile.age)
        : "";

    const pCourse = String(profile?.program?.program || "").trim();
    const pYear = normalizeYearLevelFromProfile(profile?.year?.year_level);

    setFormData((prev) => ({
      ...prev,
      gender: prev.gender || pGender,
      age: prev.age || pAge,
      course: prev.course || pCourse,
      yearLevel: prev.yearLevel || pYear,
    }));

    hydratedRef.current = true;
  }, [profile]);

  function isFilled(v) {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim().length > 0;
    return true;
  }

  const requiredByStep = useMemo(
    () => [
      [
        "gender",
        "age",
        "course",
        "yearLevel",
        "workingStudent",
        "pwd",
        "livingArrangement",
        "indigenousGroup",
      ],
      [
        "height",
        "weight",
        "sleepDuration",
        "breakfastHabit",
        "exerciseFrequency",
        "smokingStatus",
        "alcoholConsumption",
      ],
      ["schoolworkTime", "socialSupport", "relationshipStress", "bullied"],
      [
        "academicPressure",
        "academicDissatisfaction",
        "schoolworkOverload",
        "financialStress",
      ],
    ],
    [],
  );

  const isStepComplete = useMemo(() => {
    const keys = requiredByStep[currentStep] || [];
    return keys.every((k) => isFilled(formData[k]));
  }, [requiredByStep, currentStep, formData]);

  const isAllComplete = useMemo(() => {
    const keys = requiredByStep.flat();
    return keys.every((k) => isFilled(formData[k]));
  }, [requiredByStep, formData]);

  const scrollToTop = (behavior = "smooth") => {
    const el = pageScrollRef.current;
    if (!el) return;

    el.scrollTo({ top: 0, behavior });
  };

  const handleNext = () => {
    if (!agreed) return;
    if (!isStepComplete) return;

    if (currentStep < sections.length - 1) {
      setCurrentStep((s) => s + 1);
      requestAnimationFrame(() => scrollToTop("smooth"));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      requestAnimationFrame(() => scrollToTop("smooth"));
    }
  };

  const createPrediction = usePredictionStore((s) => s.createPrediction);
  const predictionLoading = usePredictionStore((s) => s.loading);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreed) return;
    if (!isAllComplete) return;
    if (!isScheduleOpen(schedule)) return;

    const payload = {
      gender: Number(formData.gender),
      age: Number(formData.age),
      course: formData.course,
      year_level: formData.yearLevel,
      working_student: Number(formData.workingStudent),
      pwd: Number(formData.pwd),
      living_arrangement: formData.livingArrangement,
      indigenous_group: Number(formData.indigenousGroup),
      bmi: "Normal",
      sleep_duration: formData.sleepDuration,
      breakfast_habit: formData.breakfastHabit,
      exercise_frequency: formData.exerciseFrequency,
      smoking_status: formData.smokingStatus,
      alcohol_consumption: formData.alcoholConsumption,
      academic_pressure: formData.academicPressure,
      academic_dissatisfaction: formData.academicDissatisfaction,
      schoolwork_spent_daily: formData.schoolworkTime,
      academic_workload: formData.schoolworkOverload,
      social_support: formData.socialSupport,
      bullied: Number(formData.bullied),
      romantic_personal_relationship_stress: formData.relationshipStress,
      financial_stress: formData.financialStress,
    };

    await createPrediction(payload);

    setCurrentStep(0);
    setAgreed(false);
    hydratedRef.current = false;

    setFormData({
      gender: "",
      age: "",
      course: "",
      yearLevel: "",
      workingStudent: "",
      pwd: "",
      livingArrangement: "",
      indigenousGroup: "",
      height: "",
      weight: "",
      sleepDuration: "",
      breakfastHabit: "",
      exerciseFrequency: "",
      smokingStatus: "",
      alcoholConsumption: "",
      schoolworkTime: "",
      socialSupport: "",
      relationshipStress: "",
      bullied: "",
      academicPressure: "",
      academicDissatisfaction: "",
      schoolworkOverload: "",
      financialStress: "",
    });

    scrollToTop();
  };

  if (profileError)
    return <div className="p-6 text-red-600">{profileError}</div>;

  if (pageLoading) return <SurveySkeletal steps={sections.length} />;

  if (!profile)
    return <SectionLoader title="Loading profile" subtitle="Please wait..." />;

  if (approvalStatus === 1) return <PendingApprovalNotice profile={profile} />;

  if (approvalStatus === 2) {
    if (scheduleError)
      return <div className="p-6 text-red-600">{scheduleError}</div>;

    if (!schedule) return <SurveyScheduleTakeNotice profile={profile} />;

    if (!isScheduleOpen(schedule))
      return <SurveyScheduleWindowNotice schedule={schedule} />;
  } else {
    return <PendingApprovalNotice profile={profile} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SurveyResultPopup />

      <div
        ref={pageScrollRef}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto"
      >
        <div className="bg-muted/40 border-b px-3 sm:px-6">
          <div className="mx-auto max-w-6xl py-6 sm:py-8">
            <h1 className="text-2xl font-bold sm:text-4xl">Student Survey</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Answer honestly. Your responses help improve student services.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">
          <div className="mb-6">
            <div className="hidden md:block">
              <div className="flex items-start justify-between gap-3">
                {sections.map((section, index) => {
                  const done = index < currentStep;
                  const active = index === currentStep;

                  return (
                    <div key={section.title} className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition",
                            active || done
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground border border-border",
                          ].join(" ")}
                        >
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={[
                              "text-sm font-semibold truncate",
                              active || done
                                ? "text-foreground"
                                : "text-muted-foreground",
                            ].join(" ")}
                            title={section.title}
                          >
                            {section.title}
                          </p>

                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={[
                                "h-full rounded-full transition-all duration-300",
                                index <= currentStep
                                  ? "bg-primary"
                                  : "bg-muted",
                              ].join(" ")}
                              style={{
                                width:
                                  index < currentStep
                                    ? "100%"
                                    : active
                                      ? "100%"
                                      : "0%",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:hidden">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  Step {currentStep + 1} of {sections.length}
                </p>
                <p className="text-muted-foreground max-w-[55%] truncate text-right text-sm">
                  {sections[currentStep]?.title}
                </p>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / sections.length) * 100}%`,
                  }}
                />
              </div>

              <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {sections.map((s, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;

                  return (
                    <div
                      key={s.title}
                      className={[
                        "shrink-0 h-9 w-10 rounded-full flex flex-1 items-center justify-center text-xs font-bold transition",
                        active || done
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border border-border",
                      ].join(" ")}
                      title={s.title}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-border/60 mb-4 flex items-start gap-3 rounded-xl border bg-card p-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-foreground text-sm leading-relaxed">
              I agree to participate in this study and accept the data privacy
              terms.
            </span>
          </div>

          <Card className="gap-1 rounded-3xl p-4 sm:p-6">
            <h2 className="text-xl font-semibold sm:text-2xl">
              {sections[currentStep].title}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {sections[currentStep].description}
            </p>

            <div className="mt-6 space-y-8 sm:space-y-10">
              {currentStep === 0 && (
                <DemographicsSection
                  formData={formData}
                  handleInputChange={handleInputChange}
                  programs={programs}
                  programsLoading={programsLoading}
                />
              )}
              {currentStep === 1 && (
                <PhysicalHealthSection
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              )}
              {currentStep === 2 && (
                <AcademicLifestyleSection
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              )}
              {currentStep === 3 && (
                <MentalHealthSection
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                Back
              </Button>

              {currentStep < sections.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={predictionLoading || !agreed || !isStepComplete}
                >
                  {predictionLoading
                    ? "Loading..."
                    : !agreed
                      ? "Agree to continue"
                      : !isStepComplete
                        ? "Complete all fields"
                        : "Next"}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!agreed || !isAllComplete || predictionLoading}
                >
                  {predictionLoading ? "Submitting..." : "Submit Survey"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// /* eslint-disable react-hooks/static-components */
// /* eslint-disable no-unused-vars */
// // SurveyForm.jsx
// /* eslint-disable react-hooks/set-state-in-effect */
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import SurveySkeletal from "../skeletal/SurveySkeletal";
// import {
//   AlertCircle,
//   Clock,
//   Mail,
//   CalendarClock,
//   ShieldCheck,
// } from "lucide-react";
// import { Separator } from "@/components/ui/separator";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// import { useUserStore } from "@/stores/userStore";
// import { usePredictionStore } from "@/stores/predictionStore";
// import { SectionLoader } from "../SectionLoader";
// import SurveyResultPopup from "./SurveyResultPopup";

// /* ============================= */
// /* ✅ SCHEDULE WINDOW HELPERS     */
// /* ============================= */

// function toDate(v) {
//   if (!v) return null;
//   const d = new Date(v);
//   return Number.isNaN(d.getTime()) ? null : d;
// }

// // inclusive window: start_at <= now <= end_at
// function isScheduleOpen(schedule) {
//   if (!schedule?.is_active) return false;

//   const start = toDate(schedule?.start_at);
//   const end = toDate(schedule?.end_at);
//   if (!start || !end) return false;

//   const now = new Date();
//   return now >= start && now <= end;
// }

// function formatDT(v) {
//   const d = toDate(v);
//   if (!d) return "N/A";
//   return d.toLocaleString("en-PH", {
//     timeZone: "Asia/Manila",
//     year: "numeric",
//     month: "short",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// /* ============================= */
// /* ✅ PROFILE -> FORM NORMALIZERS */
// /* ============================= */

// function normalizeGenderFromProfile(v) {
//   // form expects: "1" male, "0" female
//   if (v === null || v === undefined) return "";
//   const s = String(v).toLowerCase().trim();

//   if (s === "1" || s === "male" || s === "m") return "1";
//   if (s === "0" || s === "female" || s === "f") return "0";
//   return "";
// }

// function normalizeYearLevelFromProfile(v) {
//   if (!v) return "";
//   const s = String(v).trim();

//   if (/^1/.test(s)) return "1st Year";
//   if (/^2/.test(s)) return "2nd Year";
//   if (/^3/.test(s)) return "3rd Year";
//   if (/^4/.test(s)) return "4th Year";

//   return s;
// }

// /* ============================= */
// /* NOTICES                       */
// /* ============================= */
// function NoticeShell({ icon: Icon, badge, title, description, children }) {
//   return (
//     <div className="bg-background flex h-full items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
//       <div className="w-full max-w-xl">
//         <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60 shadow-sm">
//           <CardHeader className="border-b border-border/60 bg-background/30 px-4 py-4 sm:px-6 sm:py-5">
//             <div className="flex items-start justify-between gap-3">
//               <div className="flex items-start gap-3 min-w-0">
//                 <div className="mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-border/60 bg-background/60 shrink-0">
//                   <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
//                 </div>
//                 <div className="grid gap-1 min-w-0">
//                   <CardTitle className="text-sm sm:text-lg leading-tight">
//                     {title}
//                   </CardTitle>
//                   {description ? (
//                     <CardDescription className="text-xs sm:text-sm leading-snug">
//                       {description}
//                     </CardDescription>
//                   ) : null}
//                 </div>
//               </div>

//               {badge ? (
//                 <Badge
//                   variant="outline"
//                   className="shrink-0 border-border/60 text-muted-foreground bg-background/40 text-[11px] sm:text-xs px-2 py-1"
//                 >
//                   {badge}
//                 </Badge>
//               ) : null}
//             </div>
//           </CardHeader>

//           <CardContent className="px-4 pt-2">{children}</CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// function InfoRow({ icon: Icon, label, value }) {
//   return (
//     <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
//       <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
//       <div className="grid gap-0.5 min-w-0">
//         <div className="text-[11px] sm:text-xs text-muted-foreground">
//           {label}
//         </div>
//         <div className="text-xs sm:text-sm font-medium text-foreground wrap-break-word">
//           {value}
//         </div>
//       </div>
//     </div>
//   );
// }

// function PendingApprovalNotice({ profile }) {
//   const email = "jerald.cahulogan@bisu.edu.ph";

//   const studentName = `${profile?.firstname || ""} ${profile?.lastname || ""}`
//     .trim()
//     .replace(/\s+/g, " ");

//   const studentId = profile?.student_id || "";

//   const studentDepartment =
//     profile?.program?.department?.department ||
//     profile?.department?.department ||
//     "";

//   const studentCourse =
//     profile?.program?.program || profile?.course || profile?.program_name || "";

//   const studentYear =
//     profile?.year?.year_level ||
//     profile?.year_level ||
//     profile?.yearLevel ||
//     "";

//   const subject = "Account Approval Request (Pending Approval)";
//   const body = [
//     "Good day Guidance Office,",
//     "",
//     "I would like to request approval for my account. It is currently showing as pending approval.",
//     "",
//     "Student details:",
//     `- Name: ${studentName || "N/A"}`,
//     `- Student ID: ${studentId || "N/A"}`,
//     `- Department: ${studentDepartment || "N/A"}`,
//     `- Course/Program: ${studentCourse || "N/A"}`,
//     `- Year Level: ${studentYear || "N/A"}`,
//     "",
//     "Thank you.",
//   ].join("\n");

//   const isMobile =
//     typeof navigator !== "undefined" &&
//     /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

//   const handleEmailClick = () => {
//     const enc = encodeURIComponent;
//     const mailtoUrl = `mailto:${email}?subject=${enc(subject)}&body=${enc(
//       body,
//     )}`;

//     if (isMobile) {
//       window.location.href = mailtoUrl;
//       return;
//     }

//     const gmailUrl =
//       `https://mail.google.com/mail/u/0/?view=cm&fs=1&ui=2&tf=1` +
//       `&to=${enc(email)}&su=${enc(subject)}&body=${enc(body)}`;

//     try {
//       const w = window.open(gmailUrl, "_blank", "noopener,noreferrer");
//       if (!w) window.location.href = mailtoUrl;
//     } catch {
//       window.location.href = mailtoUrl;
//     }
//   };

//   return (
//     <NoticeShell
//       icon={ShieldCheck}
//       badge="Approval required"
//       title="Account pending approval"
//       description="Your account is currently under review by the Guidance Office."
//     >
//       <div className="grid gap-4">
//         <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
//           <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
//             You’ll be able to access the survey as soon as your account is
//             approved.
//           </p>
//           <div className="mt-3 flex flex-wrap items-center gap-2">
//             <Badge
//               variant="outline"
//               className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
//             >
//               Status: Pending
//             </Badge>
//             <span className="text-xs text-muted-foreground">
//               If this takes too long, contact the office below.
//             </span>
//           </div>
//         </div>

//         <div className="grid gap-3">
//           <div className="text-xs sm:text-sm font-semibold text-foreground">
//             Guidance Office contact
//           </div>

//           <InfoRow icon={Mail} label="Email" value={email} />
//           <InfoRow
//             icon={Clock}
//             label="Office hours"
//             value="Monday–Friday, 8:00 AM–5:00 PM"
//           />

//           <div className="flex flex-col sm:flex-row sm:justify-end mt-2">
//             <Button
//               variant="outline"
//               className="border-border/60 bg-background/60 w-full sm:w-auto"
//               onClick={handleEmailClick}
//             >
//               Email Guidance Office
//             </Button>
//           </div>
//         </div>
//       </div>
//     </NoticeShell>
//   );
// }

// function SurveyScheduleTakeNotice({ profile }) {
//   const programLabel = profile?.program?.program || "Not set";
//   const yearLabel = profile?.year?.year_level || "Not set";

//   return (
//     <NoticeShell
//       icon={CalendarClock}
//       badge="No active schedule"
//       title="No active survey schedule"
//       description="There is currently no open survey schedule for your program and year level."
//     >
//       <div className="grid gap-4">
//         <div className="grid gap-3">
//           <InfoRow icon={AlertCircle} label="Program" value={programLabel} />
//           <InfoRow icon={AlertCircle} label="Year level" value={yearLabel} />
//         </div>

//         <Separator className="bg-border/60" />

//         <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
//           <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
//             Please wait for the Guidance Office to open a schedule. Once a
//             schedule is active, this page will automatically allow access.
//           </p>
//           <div className="mt-3 flex flex-wrap items-center gap-2">
//             <Badge
//               variant="outline"
//               className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
//             >
//               Tip
//             </Badge>
//             <span className="text-xs text-muted-foreground">
//               Make sure your program and year level are correct in your profile.
//             </span>
//           </div>
//         </div>
//       </div>
//     </NoticeShell>
//   );
// }

// function SurveyScheduleWindowNotice({ schedule }) {
//   const startLabel = formatDT(schedule?.start_at);
//   const endLabel = formatDT(schedule?.end_at);

//   const now = new Date();
//   const start = toDate(schedule?.start_at);
//   const end = toDate(schedule?.end_at);

//   const status =
//     start && now < start
//       ? "not_started"
//       : end && now > end
//         ? "ended"
//         : "unknown";

//   const meta =
//     status === "not_started"
//       ? {
//           badge: "Not started",
//           title: "Survey not open yet",
//           msg: "Please come back when the schedule starts.",
//           badgeClass:
//             "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
//           icon: CalendarClock,
//         }
//       : status === "ended"
//         ? {
//             badge: "Closed",
//             title: "Survey schedule ended",
//             msg: "The survey is already closed for your schedule.",
//             badgeClass:
//               "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
//             icon: AlertCircle,
//           }
//         : {
//             badge: "Unavailable",
//             title: "Survey not available",
//             msg: "Please wait for the Guidance Office.",
//             badgeClass:
//               "border-border/60 bg-background/40 text-muted-foreground",
//             icon: AlertCircle,
//           };

//   const Icon = meta.icon;

//   return (
//     <NoticeShell
//       icon={Icon}
//       badge={
//         <span className={meta.badgeClass + " rounded-md px-2 py-0.5 text-xs"}>
//           {meta.badge}
//         </span>
//       }
//       title={meta.title}
//       description={meta.msg}
//     >
//       <div className="grid gap-4">
//         <div className="grid gap-3">
//           <InfoRow icon={Clock} label="Starts" value={startLabel} />
//           <InfoRow icon={Clock} label="Ends" value={endLabel} />
//         </div>

//         <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
//           <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
//             This window controls when the survey is accessible. If you believe
//             this is incorrect, contact the Guidance Office.
//           </p>
//         </div>
//       </div>
//     </NoticeShell>
//   );
// }

// /* ============================= */
// /* UI HELPERS                    */
// /* ============================= */

// function FieldCard({ title, hint, children }) {
//   return (
//     <div className="rounded-2xl border bg-card p-4 sm:p-5 lg:p-6">
//       <div className="mb-4">
//         <p className="text-sm sm:text-base font-semibold text-foreground">
//           {title}
//         </p>
//         {hint ? (
//           <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
//             {hint}
//           </p>
//         ) : null}
//       </div>
//       {children}
//     </div>
//   );
// }

// function OptionGrid({ children, cols = "sm:grid-cols-2" }) {
//   return <div className={`grid grid-cols-1 ${cols} gap-3`}>{children}</div>;
// }

// function RadioCard({ id, value, children }) {
//   return (
//     <label
//       htmlFor={id}
//       className="flex items-center gap-3 cursor-pointer rounded-xl border bg-card px-4 py-3 transition hover:bg-accent focus-within:ring-2 focus-within:ring-primary/40"
//     >
//       <RadioGroupItem id={id} value={value} className="h-5 w-5" />
//       <span className="text-sm font-medium text-foreground">{children}</span>
//     </label>
//   );
// }

// function safeId(v) {
//   return String(v || "")
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, "-") // replace spaces/symbols with "-"
//     .replace(/^-+|-+$/g, ""); // trim leading/trailing "-"
// }

// /* ============================= */
// /* SECTIONS                      */
// /* ============================= */

// function DemographicsSection({
//   formData,
//   handleInputChange,
//   programs,
//   programsLoading,
// }) {
//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
//       <FieldCard title="Gender" hint="Select one option.">
//         <RadioGroup
//           value={formData.gender}
//           onValueChange={(value) => handleInputChange("gender", value)}
//         >
//           <OptionGrid>
//             <RadioCard id="male" value="1">
//               Male
//             </RadioCard>
//             <RadioCard id="female" value="0">
//               Female
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard title="Age" hint="Use whole number.">
//         <Input
//           id="age"
//           type="number"
//           placeholder="Enter your age"
//           value={formData.age}
//           onChange={(e) => handleInputChange("age", e.target.value)}
//           className="h-11 rounded-xl px-4"
//         />
//       </FieldCard>

//       <FieldCard title="Course" hint="Choose your program.">
//         <Select
//           value={formData.course}
//           onValueChange={(v) => handleInputChange("course", v)}
//         >
//           <SelectTrigger className="h-11 rounded-xl px-4">
//             <SelectValue
//               placeholder={
//                 programsLoading ? "Loading..." : "Select your course"
//               }
//             />
//           </SelectTrigger>
//           <SelectContent>
//             {(Array.isArray(programs) ? programs : []).map((p) => (
//               <SelectItem key={p.program_id} value={p.program}>
//                 {p.program}
//               </SelectItem>
//             ))}

//             {!programsLoading && (!programs || programs.length === 0) ? (
//               <>
//                 <SelectItem value="BEED">BEED</SelectItem>
//                 <SelectItem value="BSED major in English">
//                   BSED Major in English
//                 </SelectItem>
//                 <SelectItem value="BSED major in Filipino">
//                   BSED Major in Filipino
//                 </SelectItem>
//                 <SelectItem value="BSED major in Mathematics">
//                   BSED Major in Mathematics
//                 </SelectItem>
//                 <SelectItem value="BSED major in Science">
//                   BSED Major in Science
//                 </SelectItem>
//                 <SelectItem value="BSCS">BSCS</SelectItem>
//                 <SelectItem value="BSES">BSES</SelectItem>
//                 <SelectItem value="BSF">BSF</SelectItem>
//                 <SelectItem value="BSMB">BSMB</SelectItem>
//                 <SelectItem value="BSOA">BSOA</SelectItem>
//                 <SelectItem value="BSHM">BSHM</SelectItem>
//               </>
//             ) : null}
//           </SelectContent>
//         </Select>
//       </FieldCard>

//       <FieldCard title="Year Level" hint="Choose your current year.">
//         <Select
//           value={formData.yearLevel}
//           onValueChange={(v) => handleInputChange("yearLevel", v)}
//         >
//           <SelectTrigger className="h-11 rounded-xl px-4">
//             <SelectValue placeholder="Select year level" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="1st Year">1st Year</SelectItem>
//             <SelectItem value="2nd Year">2nd Year</SelectItem>
//             <SelectItem value="3rd Year">3rd Year</SelectItem>
//             <SelectItem value="4th Year">4th Year</SelectItem>
//           </SelectContent>
//         </Select>
//       </FieldCard>

//       <FieldCard
//         title="Working Student"
//         hint="This helps interpret time constraints."
//       >
//         <RadioGroup
//           value={formData.workingStudent}
//           onValueChange={(v) => handleInputChange("workingStudent", v)}
//         >
//           <OptionGrid>
//             <RadioCard id="working-yes" value="1">
//               Yes
//             </RadioCard>
//             <RadioCard id="working-no" value="0">
//               No
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard title="PWD" hint="Optional. Used for support planning.">
//         <RadioGroup
//           value={formData.pwd}
//           onValueChange={(v) => handleInputChange("pwd", v)}
//         >
//           <OptionGrid>
//             <RadioCard id="pwd-yes" value="1">
//               Yes
//             </RadioCard>
//             <RadioCard id="pwd-no" value="0">
//               No
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard title="Living Arrangement" hint="Choose your current setup.">
//         <Select
//           value={formData.livingArrangement}
//           onValueChange={(v) => handleInputChange("livingArrangement", v)}
//         >
//           <SelectTrigger className="h-11 rounded-xl px-4">
//             <SelectValue placeholder="Select your living arrangement" />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="Living with family">
//               Living with Family
//             </SelectItem>
//             <SelectItem value="Living in a dormitory/boarding house">
//               Living in a Dorm/Boarding House
//             </SelectItem>
//             <SelectItem value="Living with guardian">
//               Living with Guardian
//             </SelectItem>
//             <SelectItem value="Living alone">Living Alone</SelectItem>
//             <SelectItem value="Living with partner">
//               Living with Partner/Spouse
//             </SelectItem>
//             <SelectItem value="Living with friends">
//               Living with Friends
//             </SelectItem>
//             <SelectItem value="Living with relative">
//               Living with Relatives
//             </SelectItem>
//           </SelectContent>
//         </Select>
//       </FieldCard>

//       <FieldCard
//         title="Indigenous Group"
//         hint="Optional. Used for inclusion reporting."
//       >
//         <RadioGroup
//           value={formData.indigenousGroup}
//           onValueChange={(v) => handleInputChange("indigenousGroup", v)}
//         >
//           <OptionGrid>
//             <RadioCard id="indigenous-yes" value="1">
//               Yes
//             </RadioCard>
//             <RadioCard id="indigenous-no" value="0">
//               No
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>
//     </div>
//   );
// }

// function PhysicalHealthSection({ formData, handleInputChange }) {
//   return (
//     <div className="space-y-6">
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//         <FieldCard title="Height" hint="Centimeters (cm).">
//           <Input
//             id="height"
//             type="number"
//             placeholder="Enter your height"
//             value={formData.height}
//             onChange={(e) => handleInputChange("height", e.target.value)}
//             className="h-11 rounded-xl px-4"
//           />
//         </FieldCard>

//         <FieldCard title="Weight" hint="Kilograms (kg).">
//           <Input
//             id="weight"
//             type="number"
//             placeholder="Enter your weight"
//             value={formData.weight}
//             onChange={(e) => handleInputChange("weight", e.target.value)}
//             className="h-11 rounded-xl px-4"
//           />
//         </FieldCard>
//       </div>

//       <FieldCard title="Sleep Duration" hint="Pick the closest range.">
//         <RadioGroup
//           value={formData.sleepDuration}
//           onValueChange={(v) => handleInputChange("sleepDuration", v)}
//         >
//           <OptionGrid cols="sm:grid-cols-3">
//             <RadioCard id="sleep-less" value="Less than 7 hours">
//               Less than 7 hours
//             </RadioCard>
//             <RadioCard id="sleep-normal" value="7 to 9 hours">
//               7 to 9 hours
//             </RadioCard>
//             <RadioCard id="sleep-more" value="More than 9 hours">
//               More than 9 hours
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard title="Breakfast Habit" hint="How often you eat breakfast.">
//         <RadioGroup
//           value={formData.breakfastHabit}
//           onValueChange={(v) => handleInputChange("breakfastHabit", v)}
//         >
//           <OptionGrid cols="sm:grid-cols-3">
//             <RadioCard id="breakfast-rarely" value="Rarely">
//               Rarely
//             </RadioCard>
//             <RadioCard id="breakfast-sometimes" value="Sometimes">
//               Sometimes
//             </RadioCard>
//             <RadioCard id="breakfast-regularly" value="Regularly">
//               Regularly
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard
//         title="Exercise Frequency"
//         hint="How active you are each week."
//       >
//         <RadioGroup
//           value={formData.exerciseFrequency}
//           onValueChange={(v) => handleInputChange("exerciseFrequency", v)}
//         >
//           <OptionGrid cols="sm:grid-cols-3">
//             <RadioCard id="exercise-inactive" value="Inactive">
//               Inactive
//             </RadioCard>
//             <RadioCard id="exercise-moderate" value="Moderate">
//               Moderate
//             </RadioCard>
//             <RadioCard id="exercise-active" value="Active">
//               Active
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard title="Smoking Status" hint="Choose one.">
//         <RadioGroup
//           value={formData.smokingStatus}
//           onValueChange={(v) => handleInputChange("smokingStatus", v)}
//         >
//           <OptionGrid cols="sm:grid-cols-3">
//             <RadioCard id="smoking-non" value="Non-smoker">
//               Non smoker
//             </RadioCard>
//             <RadioCard id="smoking-ex" value="Ex-smoker">
//               Ex smoker
//             </RadioCard>
//             <RadioCard id="smoking-current" value="Current smoker">
//               Current smoker
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard title="Alcohol Consumption" hint="Choose the closest.">
//         <RadioGroup
//           value={formData.alcoholConsumption}
//           onValueChange={(v) => handleInputChange("alcoholConsumption", v)}
//         >
//           <OptionGrid cols="sm:grid-cols-4">
//             <RadioCard id="alcohol-never" value="Never">
//               Never
//             </RadioCard>
//             <RadioCard id="alcohol-rarely" value="Rarely">
//               Rarely
//             </RadioCard>
//             <RadioCard id="alcohol-occasionally" value="Occasionally">
//               Occasionally
//             </RadioCard>
//             <RadioCard id="alcohol-daily" value="Daily">
//               Daily
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>
//     </div>
//   );
// }

// function AcademicLifestyleSection({ formData, handleInputChange }) {
//   const frequencyOptions = ["Never", "Rarely", "Sometimes", "Often", "Always"];
//   const toLabel = (v) => v.charAt(0).toUpperCase() + v.slice(1);
//   return (
//     <div className="space-y-6">
//       <FieldCard
//         title="Time spent on schoolwork daily"
//         hint="Pick the closest range."
//       >
//         <RadioGroup
//           value={formData.schoolworkTime}
//           onValueChange={(value) => handleInputChange("schoolworkTime", value)}
//         >
//           <OptionGrid cols="sm:grid-cols-3">
//             <RadioCard id="schoolwork-less-2" value="Less than 2h">
//               Less than 2 hours
//             </RadioCard>
//             <RadioCard id="schoolwork-2-3" value="2 to 3h">
//               2 to 3 hours
//             </RadioCard>
//             <RadioCard id="schoolwork-more-3" value="More than 3h">
//               More than 3 hours
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard
//         title="Social support"
//         hint="I have friends or relatives who take time to listen if I need someone to talk to."
//       >
//         <RadioGroup
//           value={formData.socialSupport}
//           onValueChange={(value) => handleInputChange("socialSupport", value)}
//         >
//           <OptionGrid cols="sm:grid-cols-5">
//             {frequencyOptions.map((opt) => (
//               <RadioCard key={opt} id={`support-${opt}`} value={opt}>
//                 {toLabel(opt)}
//               </RadioCard>
//             ))}
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard
//         title="Relationship stress"
//         hint="How often have you felt stressed because of your romantic or personal relationship?"
//       >
//         <RadioGroup
//           value={formData.relationshipStress}
//           onValueChange={(value) =>
//             handleInputChange("relationshipStress", value)
//           }
//         >
//           <OptionGrid cols="sm:grid-cols-5">
//             {frequencyOptions.map((opt) => (
//               <RadioCard key={opt} id={`relationship-${opt}`} value={opt}>
//                 {toLabel(opt)}
//               </RadioCard>
//             ))}
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>

//       <FieldCard
//         title="Bullying"
//         hint="During the past 12 months, were you bullied on school property?"
//       >
//         <RadioGroup
//           value={formData.bullied}
//           onValueChange={(value) => handleInputChange("bullied", value)}
//         >
//           <OptionGrid cols="sm:grid-cols-2">
//             <RadioCard id="bullied-yes" value="1">
//               Yes
//             </RadioCard>
//             <RadioCard id="bullied-no" value="0">
//               No
//             </RadioCard>
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>
//     </div>
//   );
// }

// function MentalHealthSection({ formData, handleInputChange }) {
//   const agreeOptions = [
//     { value: "Strongly Disagree", label: "Strongly disagree" },
//     { value: "Disagree", label: "Disagree" },
//     { value: "Neutral", label: "Neutral" },
//     { value: "Agree", label: "Agree" },
//     { value: "Strongly Agree", label: "Strongly agree" },
//   ];

//   const Question = ({ field, title, hint }) => {
//     const preserve =
//       field === "schoolworkOverload" || field === "financialStress";

//     return (
//       <FieldCard title={title} hint={hint}>
//         <RadioGroup
//           value={formData[field]}
//           onValueChange={(value) =>
//             handleInputChange(field, value, { preserveScroll: preserve })
//           }
//         >
//           <OptionGrid cols="sm:grid-cols-5">
//             {agreeOptions.map((opt) => (
//               <RadioCard
//                 key={opt.value}
//                 id={`${field}-${safeId(opt.value)}`}
//                 value={opt.value}
//               >
//                 {opt.label}
//               </RadioCard>
//             ))}
//           </OptionGrid>
//         </RadioGroup>
//       </FieldCard>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <Question
//         field="academicPressure"
//         title="Academic pressure"
//         hint="I feel a lot of pressure in my daily studying."
//       />
//       <Question
//         field="academicDissatisfaction"
//         title="Grade dissatisfaction"
//         hint="I am dissatisfied with my academic grades."
//       />
//       <Question
//         field="schoolworkOverload"
//         title="Schoolwork overload"
//         hint="I feel there is too much schoolwork."
//       />
//       <Question
//         field="financialStress"
//         title="Financial stress"
//         hint="I feel depressed because of my financial situation."
//       />
//     </div>
//   );
// }

// /* ============================= */
// /* MAIN SURVEY FORM              */
// /* ============================= */

// export default function SurveyForm() {
//   const subscribedRef = useRef(false);

//   // ✅ scroll container ref (IMPORTANT)
//   const pageScrollRef = useRef(null);

//   const profile = useUserStore((s) => s.profile);
//   const profileLoading = useUserStore((s) => s.profileLoading);
//   const profileError = useUserStore((s) => s.profileError);
//   const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);

//   const schedule = useUserStore((s) => s.schedule);
//   const scheduleLoading = useUserStore((s) => s.scheduleLoading);
//   const scheduleError = useUserStore((s) => s.scheduleError);

//   const programs = useUserStore((s) => s.programs);
//   const programsLoading = useUserStore((s) => s.programsLoading);
//   const fetchPrograms = useUserStore((s) => s.fetchPrograms);

//   useEffect(() => {
//     if (subscribedRef.current) return;
//     subscribedRef.current = true;

//     const unsub = subscribeUserProfile();
//     return () => unsub?.();
//   }, [subscribeUserProfile]);

//   useEffect(() => {
//     fetchPrograms?.();
//   }, [fetchPrograms]);

//   const approvalStatus = profile?.approvalStatus_id ?? null;

//   const [profileResolved, setProfileResolved] = useState(false);
//   const [scheduleStarted, setScheduleStarted] = useState(false);
//   const [scheduleResolved, setScheduleResolved] = useState(false);

//   useEffect(() => {
//     if (profileError) {
//       setProfileResolved(true);
//       return;
//     }
//     if (!profileLoading && profile) {
//       setProfileResolved(true);
//     }
//   }, [profileLoading, profile, profileError]);

//   const needsSchedule = approvalStatus === 2;

//   useEffect(() => {
//     if (!needsSchedule) return;

//     if (scheduleError || schedule) {
//       setScheduleResolved(true);
//       return;
//     }

//     if (scheduleLoading) setScheduleStarted(true);

//     if (scheduleStarted && !scheduleLoading) setScheduleResolved(true);
//   }, [
//     needsSchedule,
//     scheduleLoading,
//     scheduleStarted,
//     schedule,
//     scheduleError,
//   ]);

//   useEffect(() => {
//     if (!needsSchedule) {
//       setScheduleStarted(false);
//       setScheduleResolved(false);
//     }
//   }, [needsSchedule]);

//   const pageLoading = !profileResolved || (needsSchedule && !scheduleResolved);

//   const sections = useMemo(
//     () => [
//       { title: "Demographics", description: "Basic information about you" },
//       {
//         title: "Physical Health",
//         description: "Your health and lifestyle habits",
//       },
//       {
//         title: "Academic & Lifestyle",
//         description: "Your academic and social experiences",
//       },
//       {
//         title: "Mental Health & Wellbeing",
//         description: "Your mental health and emotional wellbeing",
//       },
//     ],
//     [],
//   );

//   const [agreed, setAgreed] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);

//   const [formData, setFormData] = useState({
//     gender: "",
//     age: "",
//     course: "",
//     yearLevel: "",
//     workingStudent: "",
//     pwd: "",
//     livingArrangement: "",
//     indigenousGroup: "",
//     height: "",
//     weight: "",
//     sleepDuration: "",
//     breakfastHabit: "",
//     exerciseFrequency: "",
//     smokingStatus: "",
//     alcoholConsumption: "",
//     schoolworkTime: "",
//     socialSupport: "",
//     relationshipStress: "",
//     bullied: "",
//     academicPressure: "",
//     academicDissatisfaction: "",
//     schoolworkOverload: "",
//     financialStress: "",
//   });

//   // const handleInputChange = (field, value) => {
//   //   setFormData((p) => ({ ...p, [field]: value }));
//   // };
//   const handleInputChange = (field, value, opts = {}) => {
//     const { preserveScroll = false } = opts;

//     const el = pageScrollRef.current;
//     const top = preserveScroll && el ? el.scrollTop : null;

//     setFormData((p) => ({ ...p, [field]: value }));

//     // restore after React commits
//     if (preserveScroll && el && top !== null) {
//       requestAnimationFrame(() => {
//         // only restore if user didn't manually scroll in between
//         if (Math.abs(el.scrollTop - top) > 2) el.scrollTop = top;
//       });
//     }
//   };

//   // ✅ Prefill once
//   const hydratedRef = useRef(false);
//   useEffect(() => {
//     if (!profile) return;
//     if (hydratedRef.current) return;

//     const pGender = normalizeGenderFromProfile(profile?.gender);
//     const pAge =
//       profile?.age !== null && profile?.age !== undefined
//         ? String(profile.age)
//         : "";

//     const pCourse = String(profile?.program?.program || "").trim();
//     const pYear = normalizeYearLevelFromProfile(profile?.year?.year_level);

//     setFormData((prev) => ({
//       ...prev,
//       gender: prev.gender || pGender,
//       age: prev.age || pAge,
//       course: prev.course || pCourse,
//       yearLevel: prev.yearLevel || pYear,
//     }));

//     hydratedRef.current = true;
//   }, [profile]);

//   function isFilled(v) {
//     if (v === null || v === undefined) return false;
//     if (typeof v === "string") return v.trim().length > 0;
//     return true;
//   }

//   const requiredByStep = useMemo(
//     () => [
//       [
//         "gender",
//         "age",
//         "course",
//         "yearLevel",
//         "workingStudent",
//         "pwd",
//         "livingArrangement",
//         "indigenousGroup",
//       ],
//       [
//         "height",
//         "weight",
//         "sleepDuration",
//         "breakfastHabit",
//         "exerciseFrequency",
//         "smokingStatus",
//         "alcoholConsumption",
//       ],
//       ["schoolworkTime", "socialSupport", "relationshipStress", "bullied"],
//       [
//         "academicPressure",
//         "academicDissatisfaction",
//         "schoolworkOverload",
//         "financialStress",
//       ],
//     ],
//     [],
//   );

//   const isStepComplete = useMemo(() => {
//     const keys = requiredByStep[currentStep] || [];
//     return keys.every((k) => isFilled(formData[k]));
//   }, [requiredByStep, currentStep, formData]);

//   const isAllComplete = useMemo(() => {
//     const keys = requiredByStep.flat();
//     return keys.every((k) => isFilled(formData[k]));
//   }, [requiredByStep, formData]);

//   const scrollToTop = (behavior = "smooth") => {
//     const el = pageScrollRef.current;
//     if (!el) return;

//     el.scrollTo({ top: 0, behavior });
//   };

//   const handleNext = () => {
//     if (!agreed) return;
//     if (!isStepComplete) return;

//     if (currentStep < sections.length - 1) {
//       setCurrentStep((s) => s + 1);

//       // ✅ scroll after React renders the next section
//       requestAnimationFrame(() => scrollToTop("smooth"));
//     }
//   };

//   const handleBack = () => {
//     if (currentStep > 0) {
//       setCurrentStep((s) => s - 1);

//       // ✅ scroll after React renders the previous section
//       requestAnimationFrame(() => scrollToTop("smooth"));
//     }
//   };

//   const createPrediction = usePredictionStore((s) => s.createPrediction);
//   const predictionLoading = usePredictionStore((s) => s.loading);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!agreed) return;
//     if (!isAllComplete) return;
//     if (!isScheduleOpen(schedule)) return;

//     const payload = {
//       gender: Number(formData.gender),
//       age: Number(formData.age),
//       course: formData.course,
//       year_level: formData.yearLevel,
//       working_student: Number(formData.workingStudent),
//       pwd: Number(formData.pwd),
//       living_arrangement: formData.livingArrangement,
//       indigenous_group: Number(formData.indigenousGroup),
//       bmi: "Normal",
//       sleep_duration: formData.sleepDuration,
//       breakfast_habit: formData.breakfastHabit,
//       exercise_frequency: formData.exerciseFrequency,
//       smoking_status: formData.smokingStatus,
//       alcohol_consumption: formData.alcoholConsumption,
//       academic_pressure: formData.academicPressure,
//       academic_dissatisfaction: formData.academicDissatisfaction,
//       schoolwork_spent_daily: formData.schoolworkTime,
//       academic_workload: formData.schoolworkOverload,
//       social_support: formData.socialSupport,
//       bullied: Number(formData.bullied),
//       romantic_personal_relationship_stress: formData.relationshipStress,
//       financial_stress: formData.financialStress,
//     };

//     await createPrediction(payload);

//     setCurrentStep(0);
//     setAgreed(false);
//     hydratedRef.current = false;

//     setFormData({
//       gender: "",
//       age: "",
//       course: "",
//       yearLevel: "",
//       workingStudent: "",
//       pwd: "",
//       livingArrangement: "",
//       indigenousGroup: "",
//       height: "",
//       weight: "",
//       sleepDuration: "",
//       breakfastHabit: "",
//       exerciseFrequency: "",
//       smokingStatus: "",
//       alcoholConsumption: "",
//       schoolworkTime: "",
//       socialSupport: "",
//       relationshipStress: "",
//       bullied: "",
//       academicPressure: "",
//       academicDissatisfaction: "",
//       schoolworkOverload: "",
//       financialStress: "",
//     });

//     scrollToTop();
//   };

//   /* ============================= */
//   /* ✅ BLINK-FREE RENDER GATES     */
//   /* ============================= */

//   if (profileError)
//     return <div className="p-6 text-red-600">{profileError}</div>;

//   if (pageLoading) return <SurveySkeletal steps={sections.length} />;

//   if (!profile)
//     return <SectionLoader title="Loading profile" subtitle="Please wait..." />;

//   if (approvalStatus === 1) return <PendingApprovalNotice profile={profile} />;

//   if (approvalStatus === 2) {
//     if (scheduleError)
//       return <div className="p-6 text-red-600">{scheduleError}</div>;
//     if (!schedule) return <SurveyScheduleTakeNotice profile={profile} />;
//     if (!isScheduleOpen(schedule))
//       return <SurveyScheduleWindowNotice schedule={schedule} />;
//   } else {
//     return <PendingApprovalNotice profile={profile} />;
//   }

//   /* ============================= */
//   /* FORM UI (SCROLL FIXED)        */
//   /* ============================= */

//   return (
//     <div className="h-full min-h-0 flex flex-col">
//       <SurveyResultPopup />

//       {/* ✅ This is now the scroll container (not window/body) */}
//       <div
//         ref={pageScrollRef}
//         className="flex-1 min-h-0 overflow-y-auto no-scrollbar"
//       >
//         {/* Page header */}
//         <div className="border-b bg-muted/40 px-3 sm:px-6">
//           <div className="max-w-6xl mx-auto py-6 sm:py-8">
//             <h1 className="text-2xl sm:text-4xl font-bold">Student Survey</h1>
//             <p className="mt-2 text-sm sm:text-base text-muted-foreground">
//               Answer honestly. Your responses help improve student services.
//             </p>
//           </div>
//         </div>

//         <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
//           {/* Progress Indicator */}
//           <div className="mb-6">
//             {/* Desktop / tablet */}
//             <div className="hidden md:block">
//               <div className="flex items-start justify-between gap-3">
//                 {sections.map((section, index) => {
//                   const done = index < currentStep;
//                   const active = index === currentStep;

//                   return (
//                     <div key={section.title} className="flex-1">
//                       <div className="flex items-center gap-3">
//                         <div
//                           className={[
//                             "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition",
//                             active || done
//                               ? "bg-primary text-primary-foreground"
//                               : "bg-muted text-muted-foreground border border-border",
//                           ].join(" ")}
//                         >
//                           {index + 1}
//                         </div>

//                         <div className="min-w-0">
//                           <p
//                             className={[
//                               "text-sm font-semibold truncate",
//                               active || done
//                                 ? "text-foreground"
//                                 : "text-muted-foreground",
//                             ].join(" ")}
//                             title={section.title}
//                           >
//                             {section.title}
//                           </p>

//                           <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
//                             <div
//                               className={[
//                                 "h-full rounded-full transition-all duration-300",
//                                 index <= currentStep
//                                   ? "bg-primary"
//                                   : "bg-muted",
//                               ].join(" ")}
//                               style={{
//                                 width:
//                                   index < currentStep
//                                     ? "100%"
//                                     : active
//                                       ? "100%"
//                                       : "0%",
//                               }}
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Mobile */}
//             <div className="md:hidden">
//               <div className="flex items-center justify-between gap-3">
//                 <p className="text-sm font-semibold">
//                   Step {currentStep + 1} of {sections.length}
//                 </p>
//                 <p className="text-sm text-muted-foreground truncate max-w-[55%] text-right">
//                   {sections[currentStep]?.title}
//                 </p>
//               </div>

//               <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
//                 <div
//                   className="h-full rounded-full bg-primary transition-all duration-300"
//                   style={{
//                     width: `${((currentStep + 1) / sections.length) * 100}%`,
//                   }}
//                 />
//               </div>

//               {/* ✅ nicer horizontal pills scroll */}
//               <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
//                 {sections.map((s, i) => {
//                   const done = i < currentStep;
//                   const active = i === currentStep;

//                   return (
//                     <div
//                       key={s.title}
//                       className={[
//                         "shrink-0 h-9 w-10 rounded-full flex flex-1 items-center justify-center text-xs font-bold transition",
//                         active || done
//                           ? "bg-primary text-primary-foreground"
//                           : "bg-muted text-muted-foreground border border-border",
//                       ].join(" ")}
//                       title={s.title}
//                     >
//                       {i + 1}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* Consent */}
//           <div className="mb-4 flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4">
//             <input
//               type="checkbox"
//               checked={agreed}
//               onChange={(e) => setAgreed(e.target.checked)}
//               className="mt-1 h-4 w-4"
//             />
//             <span className="text-sm text-foreground leading-relaxed">
//               I agree to participate in this study and accept the data privacy
//               terms.
//             </span>
//           </div>

//           {/* Main form card */}
//           <Card className="rounded-3xl p-4 sm:p-6 gap-1">
//             <h2 className="text-xl sm:text-2xl font-semibold">
//               {sections[currentStep].title}
//             </h2>
//             <p className="text-sm sm:text-base text-muted-foreground">
//               {sections[currentStep].description}
//             </p>

//             <div className="mt-6 space-y-8 sm:space-y-10">
//               {currentStep === 0 && (
//                 <DemographicsSection
//                   formData={formData}
//                   handleInputChange={handleInputChange}
//                   programs={programs}
//                   programsLoading={programsLoading}
//                 />
//               )}
//               {currentStep === 1 && (
//                 <PhysicalHealthSection
//                   formData={formData}
//                   handleInputChange={handleInputChange}
//                 />
//               )}
//               {currentStep === 2 && (
//                 <AcademicLifestyleSection
//                   formData={formData}
//                   handleInputChange={handleInputChange}
//                 />
//               )}
//               {currentStep === 3 && (
//                 <MentalHealthSection
//                   formData={formData}
//                   handleInputChange={handleInputChange}
//                 />
//               )}
//             </div>

//             <div className="mt-6 flex items-center justify-between gap-3">
//               <Button
//                 variant="outline"
//                 onClick={handleBack}
//                 disabled={currentStep === 0}
//               >
//                 Back
//               </Button>

//               {currentStep < sections.length - 1 ? (
//                 <Button
//                   onClick={handleNext}
//                   disabled={predictionLoading || !agreed || !isStepComplete}
//                 >
//                   {predictionLoading
//                     ? "Loading..."
//                     : !agreed
//                       ? "Agree to continue"
//                       : !isStepComplete
//                         ? "Complete all fields"
//                         : "Next"}
//                 </Button>
//               ) : (
//                 <Button
//                   onClick={handleSubmit}
//                   disabled={!agreed || !isAllComplete || predictionLoading}
//                 >
//                   {predictionLoading ? "Submitting..." : "Submit Survey"}
//                 </Button>
//               )}
//             </div>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
