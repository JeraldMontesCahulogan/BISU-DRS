import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminStore } from "@/stores/adminStore";
import RequestApprovalSkeletal from "@/components/skeletal/requestApprovalSkeletal";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

function toISO(dtLocal) {
  if (!dtLocal) return null;
  const d = new Date(dtLocal);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function nowLocalDT() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatDT(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return value;
  }
}

export default function SurveySchedulePage() {
  const departments = useAdminStore((s) => s.departments);
  const programs = useAdminStore((s) => s.programs);
  const yearLevels = useAdminStore((s) => s.yearLevels);

  const schedules = useAdminStore((s) => s.schedules);
  const schedulesLoading = useAdminStore((s) => s.schedulesLoading);
  const schedulesError = useAdminStore((s) => s.schedulesError);

  const fetchDepartments = useAdminStore((s) => s.fetchDepartments);
  const fetchProgramsByDepartment = useAdminStore(
    (s) => s.fetchProgramsByDepartment,
  );
  const fetchYearLevels = useAdminStore((s) => s.fetchYearLevels);

  const subscribeSchedules = useAdminStore((s) => s.subscribeSchedules);
  const createSchedules = useAdminStore((s) => s.createSchedules);
  const toggleScheduleActive = useAdminStore((s) => s.toggleScheduleActive);
  const deleteSchedule = useAdminStore((s) => s.deleteSchedule);

  const [departmentId, setDepartmentId] = useState(null);
  const [programId, setProgramId] = useState(null);
  const [yearLevelIds, setYearLevelIds] = useState([]);
  const [startDT, setStartDT] = useState(nowLocalDT());
  const [endDT, setEndDT] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Blink-free "resolved" gates
  const didInitRef = useRef(false);
  const [initResolved, setInitResolved] = useState(false);

  const [schedStarted, setSchedStarted] = useState(false);
  const [schedResolved, setSchedResolved] = useState(false);

  // ✅ Init: await required fetches (don't rely on Array.isArray([]))
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    (async () => {
      try {
        await Promise.all([fetchDepartments(), fetchYearLevels()]);
      } finally {
        setInitResolved(true);
      }
    })();

    const unsub = subscribeSchedules();
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [fetchDepartments, fetchYearLevels, subscribeSchedules]);

  // When department changes, fetch programs
  useEffect(() => {
    if (!departmentId) return;
    fetchProgramsByDepartment(departmentId);
  }, [departmentId, fetchProgramsByDepartment]);

  // ✅ Schedules gate: resolve only after a real load cycle ends OR error happens
  useEffect(() => {
    if (schedulesLoading) setSchedStarted(true);

    if ((schedStarted && !schedulesLoading) || schedulesError) {
      setSchedResolved(true);
    }
  }, [schedulesLoading, schedStarted, schedulesError]);

  const deptOptions = useMemo(() => departments ?? [], [departments]);
  const progOptions = useMemo(() => programs ?? [], [programs]);
  const yearOptions = useMemo(
    () =>
      (yearLevels ?? []).filter(
        (y) => String(y.year_level).trim().toLowerCase() !== "not applicable",
      ),
    [yearLevels],
  );
  // const yearOptions = useMemo(() => yearLevels ?? [], [yearLevels]);

  function toggleYear(id) {
    setYearLevelIds((prev) => {
      const n = Number(id);
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      return [...prev, n];
    });
  }

  function validate() {
    setError("");
    setSuccess("");

    if (!departmentId) return "Select a department.";
    if (!programId) return "Select a program.";
    if (!yearLevelIds.length) return "Select at least one year level.";
    if (!startDT) return "Select a start date and time.";

    const startISO = toISO(startDT);
    const endISO = endDT ? toISO(endDT) : null;

    if (!startISO) return "Start date is invalid.";
    if (endDT && !endISO) return "End date is invalid.";
    if (endISO && new Date(endISO) <= new Date(startISO)) {
      return "End date must be after start date.";
    }

    return "";
  }

  async function onCreateSchedule(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const startISO = toISO(startDT);
    const endISO = endDT ? toISO(endDT) : null;

    const { error: err } = await createSchedules({
      programId,
      yearLevelIds,
      startAtISO: startISO,
      endAtISO: endISO,
      isActive,
    });

    if (err) {
      setError(err.message || "Failed to save schedule.");
      setSuccess("");
      return;
    }

    setSuccess("Schedule saved.");
    setError("");
  }

  async function onToggleActive(scheduleId) {
    setError("");
    setSuccess("");

    const { error: err } = await toggleScheduleActive(scheduleId);
    if (err) {
      setError(err.message || "Failed to update schedule.");
      return;
    }

    setSuccess("Schedule updated.");
  }

  async function onDelete(scheduleId) {
    setError("");
    setSuccess("");

    const { error: err } = await deleteSchedule(scheduleId);
    if (err) {
      setError(err.message || "Failed to delete schedule.");
      return;
    }

    setSuccess("Schedule deleted.");
  }

  // ✅ Page-level loader only for initial setup fetch
  if (!initResolved) {
    return (
      <div className="w-full bg-background h-full">
        <RequestApprovalSkeletal />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* ✅ Create schedule card (same style as other pages) */}
      <Card className="w-full flex flex-col">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-2">
            <div>
              <CardTitle>Survey Schedule</CardTitle>
              <CardDescription>
                Set availability by department, program, and year level.
              </CardDescription>
            </div>
          </div>

          {error ? (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {success}
            </div>
          ) : null}

          {schedulesError ? (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {schedulesError}
            </div>
          ) : null}

          {/* ✅ Subtle syncing text (consistent with other pages) */}
          {schedulesLoading ? (
            <p className="mt-2 text-xs text-muted-foreground">Syncing…</p>
          ) : null}
        </CardHeader>

        <CardContent className="p-5">
          <h2 className="text-base font-semibold text-foreground">
            Create schedule
          </h2>

          <form
            onSubmit={onCreateSchedule}
            className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label className="text-sm font-medium text-foreground">
                Department
              </label>
              <Select
                value={departmentId ? String(departmentId) : ""}
                onValueChange={(v) => {
                  const id = Number(v);
                  setDepartmentId(id);
                  setProgramId(null);
                  setYearLevelIds([]);
                  fetchProgramsByDepartment(id);
                }}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {deptOptions.map((d) => (
                    <SelectItem
                      key={d.department_id}
                      value={String(d.department_id)}
                    >
                      {d.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Program
              </label>
              <Select
                value={programId ? String(programId) : ""}
                onValueChange={(v) => setProgramId(Number(v))}
                disabled={!departmentId}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue
                    placeholder={
                      departmentId
                        ? "Select program"
                        : "Select department first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {progOptions.map((p) => (
                    <SelectItem key={p.program_id} value={String(p.program_id)}>
                      {p.program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Year level
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                {yearOptions.map((y) => {
                  const id = Number(y.yearLevel_id);
                  const checked = yearLevelIds.includes(id);
                  return (
                    <label
                      key={y.yearLevel_id}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleYear(y.yearLevel_id)}
                      />
                      <span>{y.year_level}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                Start
              </label>
              <Input
                type="datetime-local"
                value={startDT}
                onChange={(e) => setStartDT(e.target.value)}
                className={[
                  "mt-2",
                  "scheme-light dark:scheme-dark",
                  "[&::-webkit-calendar-picker-indicator]:opacity-70",
                  "dark:[&::-webkit-calendar-picker-indicator]:invert",
                  "dark:[&::-webkit-calendar-picker-indicator]:opacity-90",
                ].join(" ")}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">End</label>
              <Input
                type="datetime-local"
                value={endDT}
                onChange={(e) => setEndDT(e.target.value)}
                className={[
                  "mt-2",
                  "scheme-light dark:scheme-dark",
                  "[&::-webkit-calendar-picker-indicator]:opacity-70",
                  "dark:[&::-webkit-calendar-picker-indicator]:invert",
                  "dark:[&::-webkit-calendar-picker-indicator]:opacity-90",
                ].join(" ")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave blank for no end time.
              </p>
            </div>

            <div className="md:col-span-2 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(Boolean(v))}
                />
                Active
              </label>

              <Button type="submit">Create schedule</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ✅ Schedules list card (table style same as your other pages) */}
      <Card className="w-full h-full flex flex-col mt-4 min-h-0">
        <CardHeader className="border-b border-border pb-4">
          <div>
            <CardTitle>Schedules</CardTitle>
            <CardDescription>
              One active rule per program and year level.
            </CardDescription>
          </div>

          {/* ✅ show syncing text here too if you want it closer */}
          {schedulesLoading ? (
            <p className="mt-2 text-xs text-muted-foreground">Syncing…</p>
          ) : null}
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-0 mr-2 min-h-0">
          <div className="overflow-x-auto px-5">
            <Table className="border-separate border-spacing-y-2">
              <TableHeader>
                <TableRow className="sticky top-0 bg-muted/50">
                  <TableHead>Department</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!schedResolved ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Loading schedules...
                    </TableCell>
                  </TableRow>
                ) : (schedules ?? []).length ? (
                  (schedules ?? []).map((row) => {
                    const deptLabel = row.program?.department?.code || "-";
                    const progLabel = row.program?.program || "-";
                    const yearLabel = row.year?.year_level || row.yearLevel_id;

                    return (
                      <TableRow
                        key={row.schedule_id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="py-3">{deptLabel}</TableCell>
                        <TableCell className="py-3">{progLabel}</TableCell>
                        <TableCell className="py-3">{yearLabel}</TableCell>
                        <TableCell className="py-3">
                          {formatDT(row.start_at)}
                        </TableCell>
                        <TableCell className="py-3">
                          {row.end_at ? formatDT(row.end_at) : "No end"}
                        </TableCell>
                        <TableCell className="py-3">
                          <span
                            className={[
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                              row.is_active
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "bg-muted text-muted-foreground",
                            ].join(" ")}
                          >
                            {row.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>

                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onToggleActive(row.schedule_id)}
                            >
                              {row.is_active ? "Disable" : "Activate"}
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(row.schedule_id)}
                              className="text-destructive hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No schedules yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 text-xs text-muted-foreground">
        Rule: One active schedule per program and year level. New active
        schedules auto-disable old ones.
      </div>
    </div>
  );
}
