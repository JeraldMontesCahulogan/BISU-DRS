// FilteredResponsePage.jsx
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PredictionResult from "@/components/PredictionResult";
import { Input } from "@/components/ui/input";
import { usePredictionStore } from "@/stores/predictionStore";
import { SectionLoader } from "@/components/SectionLoader";

function toRiskVariant(risk) {
  if (String(risk || "").toLowerCase() === "yes") return "destructive";
  return "default";
}

function toProb100(p) {
  const n = Number(p);
  if (Number.isNaN(n)) return 0;
  if (n <= 1) return Math.round(n * 100);
  if (n <= 100) return Math.round(n);
  return 100;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function Pagination({ page, totalPages, onPage, pageSize, onPageSize }) {
  const pages = useMemo(() => {
    if (totalPages <= 1) return [1];

    const out = [];
    const start = clamp(page - 2, 1, Math.max(1, totalPages - 4));
    const end = clamp(start + 4, 1, totalPages);

    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Rows</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="border border-border bg-background rounded-md px-2 py-1 text-sm"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          Prev
        </Button>

        {pages[0] > 1 ? (
          <>
            <Button
              variant={page === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => onPage(1)}
            >
              1
            </Button>
            <span className="px-1 text-muted-foreground">...</span>
          </>
        ) : null}

        {pages.map((p) => (
          <Button
            key={p}
            variant={page === p ? "default" : "outline"}
            size="sm"
            onClick={() => onPage(p)}
          >
            {p}
          </Button>
        ))}

        {pages[pages.length - 1] < totalPages ? (
          <>
            <span className="px-1 text-muted-foreground">...</span>
            <Button
              variant={page === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => onPage(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function FilteredResponsePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredResponses = usePredictionStore((s) => s.filteredResponses);
  const filteredLoading = usePredictionStore((s) => s.filteredLoading);
  const filteredError = usePredictionStore((s) => s.filteredError);

  const fetchFilteredResponses = usePredictionStore(
    (s) => s.fetchFilteredResponses,
  );
  const subscribeFilteredResponses = usePredictionStore(
    (s) => s.subscribeFilteredResponsesRealtime,
  );

  const removeFilteredResponse = usePredictionStore(
    (s) => s.removeFilteredResponse,
  );
  const removeBusyKey = usePredictionStore((s) => s.filteredRemoveBusyKey);

  const subscribedRef = useRef(false);

  // ✅ Blink-free "resolved" gate
  const [started, setStarted] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    fetchFilteredResponses?.();
    const unsub = subscribeFilteredResponses?.();

    return () => unsub?.();
  }, []);

  // Track resolved: once we have array OR error OR loading finished after started
  useEffect(() => {
    const hasData = Array.isArray(filteredResponses);
    const hasError = Boolean(filteredError);

    if (filteredLoading) setStarted(true);

    if (hasData || hasError) setResolved(true);

    if (started && !filteredLoading) setResolved(true);
  }, [filteredLoading, filteredResponses, filteredError, started]);

  const rows = useMemo(() => {
    const list = Array.isArray(filteredResponses) ? filteredResponses : [];
    return list.map((r) => {
      const sr = r?.survey || r?.survey_response || r?.surveyResponse || null;
      const pr =
        r?.result || r?.prediction_result || r?.predictionResult || null;

      const risk =
        pr?.depression_risk_result ?? r?.depression_risk_result ?? "unknown";
      const prob = toProb100(
        pr?.depression_risk_result_probability ??
          r?.depression_risk_result_probability,
      );

      return {
        key:
          r?.filteredResponse_id ||
          r?.filteredResponseId ||
          `${r?.surveyresponse_id}-${r?.result_id}`,
        filteredResponseId:
          r?.filteredResponse_id || r?.filteredResponseId || "",
        surveyresponseId:
          r?.surveyresponse_id ||
          r?.surveyresponseId ||
          sr?.surveyresponse_id ||
          "",
        resultId: r?.result_id || r?.resultId || pr?.result_id || "",
        createdAt: r?.created_at || r?.createdAt || sr?.created_at || "",
        course: r?.course || sr?.course || "",
        depressionRisk: risk,
        depressionRiskProbability: prob,
        survey: sr,
        result: pr,
      };
    });
  }, [filteredResponses]);

  const uniqueCourses = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.course).filter(Boolean)));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return rows
      .filter((r) => {
        if (!q) return true;
        return (
          String(r.course || "")
            .toLowerCase()
            .includes(q) ||
          String(r.surveyresponseId || "")
            .toLowerCase()
            .includes(q) ||
          String(r.resultId || "")
            .toLowerCase()
            .includes(q)
        );
      })
      .filter((r) =>
        courseFilter ? String(r.course || "") === String(courseFilter) : true,
      );
  }, [rows, searchTerm, courseFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, courseFilter, pageSize]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = clamp(page, 1, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, safePage, pageSize]);

  const onRemove = async (row) => {
    await removeFilteredResponse?.({
      filteredResponseId: row.filteredResponseId,
      surveyresponseId: row.surveyresponseId,
      resultId: row.resultId,
    });
  };

  // ✅ Full page loader only before first resolve (no blinking)
  if (!resolved) {
    return (
      <Card className="w-full h-full">
        <div className="p-6">
          <SectionLoader
            title="Loading filtered responses"
            subtitle="Retrieving saved responses and results"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Filtered Responses</CardTitle>
            <CardDescription>View saved responses and results</CardDescription>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-72 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by course, ids..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full sm:w-auto border border-border bg-background rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Courses</option>
                {uniqueCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-foreground hover:text-foreground border"
                onClick={() => {
                  setCourseFilter("");
                  setSearchTerm("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {filteredError ? (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {filteredError}
          </div>
        ) : null}

        {/* ✅ After resolved: show subtle syncing indicator instead of swapping content */}
        {filteredLoading ? (
          <p className="mt-2 text-xs text-muted-foreground">Syncing…</p>
        ) : null}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0 mr-2">
        <div className="overflow-x-auto px-5">
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow className="sticky top-0 bg-muted/50">
                <TableHead>Course</TableHead>
                <TableHead>Depression Risk</TableHead>
                <TableHead>Risk Probability</TableHead>
                <TableHead>Survey Response</TableHead>
                <TableHead>Result Explanation</TableHead>
                <TableHead>Remove</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageRows.map((row) => {
                const busy =
                  String(removeBusyKey || "") ===
                  String(row.surveyresponseId || "");

                return (
                  <TableRow key={row.key} className="hover:bg-muted/50">
                    <TableCell className="text-muted-foreground py-3">
                      {row.course || "Not set"}
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge variant={toRiskVariant(row.depressionRisk)}>
                        {String(row.depressionRisk || "").toLowerCase() ===
                        "yes"
                          ? "At risk"
                          : String(row.depressionRisk || "").toLowerCase() ===
                              "no"
                            ? "Low risk"
                            : "No result"}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${row.depressionRiskProbability}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm">
                          {row.depressionRiskProbability}/100
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">Response</Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-130 p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-lg">
                                Survey Response
                              </h4>
                              <p className="text-muted-foreground text-sm">
                                Full survey details
                              </p>
                            </div>

                            <div className="border-t pt-3 max-h-87.5 overflow-y-auto space-y-3">
                              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                <Field
                                  label="Gender"
                                  value={
                                    row.survey?.gender === "1"
                                      ? "Male"
                                      : "Female"
                                  }
                                />
                                <Field label="Age" value={row.survey?.age} />
                                <Field
                                  label="Course"
                                  value={row.survey?.course || row.course}
                                />
                                <Field
                                  label="Year Level"
                                  value={row.survey?.year_level}
                                />
                                <Field
                                  label="Working Student"
                                  value={
                                    row.survey?.working_student === "1"
                                      ? "Yes"
                                      : "No"
                                  }
                                />
                                <Field
                                  label="PWD"
                                  value={row.survey?.pwd === "1" ? "Yes" : "No"}
                                />
                                <Field
                                  label="Living Arrangement"
                                  value={row.survey?.living_arrangement}
                                />
                                <Field
                                  label="Indigenous Group"
                                  value={
                                    row.survey?.indigenous_group === "1"
                                      ? "Yes"
                                      : "No"
                                  }
                                />
                                <Field label="BMI" value={row.survey?.bmi} />
                                <Field
                                  label="Sleep Duration"
                                  value={row.survey?.sleep_duration}
                                />
                                <Field
                                  label="Breakfast Habit"
                                  value={row.survey?.breakfast_habit}
                                />
                                <Field
                                  label="Exercise Frequency"
                                  value={row.survey?.exercise_frequency}
                                />
                                <Field
                                  label="Smoking Status"
                                  value={row.survey?.smoking_status}
                                />
                                <Field
                                  label="Alcohol Consumption"
                                  value={row.survey?.alcohol_consumption}
                                />
                                <Field
                                  label="Schoolwork Time"
                                  value={row.survey?.schoolwork_spent_daily}
                                />
                                <Field
                                  label="Social Support"
                                  value={row.survey?.social_support}
                                />
                                <Field
                                  label="Relationship Stress"
                                  value={
                                    row.survey
                                      ?.romantic_personal_relationship_stress
                                  }
                                />
                                <Field
                                  label="Bullied"
                                  value={row.survey?.bullied}
                                />
                                <Field
                                  label="Academic Pressure"
                                  value={row.survey?.academic_pressure}
                                />
                                <Field
                                  label="Academic Dissatisfaction"
                                  value={row.survey?.academic_dissatisfaction}
                                />
                                <Field
                                  label="Schoolwork Overload"
                                  value={row.survey?.academic_workload}
                                />
                                <Field
                                  label="Financial Stress"
                                  value={row.survey?.financial_stress}
                                />
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>

                    <TableCell className="py-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" disabled={!row.result}>
                            Explanation
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-130 p-4">
                          {row.result ? (
                            <PredictionResult result={row.result} />
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No prediction result yet.
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </TableCell>

                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy || filteredLoading}
                        onClick={() => onRemove(row)}
                        title="Remove"
                        aria-label="Remove"
                        className="text-destructive hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No results found
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPage={(p) => setPage(clamp(p, 1, totalPages))}
        pageSize={pageSize}
        onPageSize={(n) => setPageSize(n)}
      />
    </Card>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm">{value ?? "-"}</p>
    </div>
  );
}
