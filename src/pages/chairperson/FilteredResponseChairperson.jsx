/* eslint-disable no-unused-vars */
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
import { Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PredictionResult from "@/components/PredictionResult";
import { Input } from "@/components/ui/input";
import { usePredictionStore } from "@/stores/predictionStore";
import { useUserStore } from "@/stores/userStore";

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

export default function FilteredResponsePageChairperson() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const profile = useUserStore((s) => s.profile);
  const course = profile?.program?.program || null;

  const filteredResponses = usePredictionStore((s) => s.filteredResponses);
  const filteredLoading = usePredictionStore((s) => s.filteredLoading);
  const filteredError = usePredictionStore((s) => s.filteredError);
  const removeBusyKey = usePredictionStore((s) => s.filteredRemoveBusyKey);

  const fetchByCourse = usePredictionStore(
    (s) => s.fetchFilteredResponsesByCourse,
  );

  const subscribeRealtime = usePredictionStore(
    (s) => s.subscribeFilteredResponsesRealtime,
  );

  const subscribedRef = useRef(false);

  // ✅ Fetch only chairperson course
  useEffect(() => {
    if (!course) return;
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    fetchByCourse({ course });
    const unsub = subscribeRealtime?.();
    return () => unsub?.();
  }, [course]);

  // =========================
  // Normalize Data
  // =========================
  const rows = useMemo(() => {
    const list = Array.isArray(filteredResponses) ? filteredResponses : [];

    return list.map((r) => {
      const sr = r?.survey || null;
      const pr = r?.result || null;

      const risk = pr?.depression_risk_result ?? "unknown";

      const prob = toProb100(pr?.depression_risk_result_probability);

      return {
        key:
          r?.filteredResponse_id || `${r?.surveyresponse_id}-${r?.result_id}`,
        filteredResponseId: r?.filteredResponse_id,
        surveyresponseId: r?.surveyresponse_id,
        resultId: r?.result_id,
        createdAt: r?.created_at,
        course: r?.course || sr?.course,
        depressionRisk: risk,
        depressionRiskProbability: prob,
        survey: sr,
        result: pr,
      };
    });
  }, [filteredResponses]);

  // =========================
  // Search
  // =========================
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      String(r.surveyresponseId || "")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, searchTerm]);

  // =========================
  // Pagination
  // =========================
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const safePage = clamp(page, 1, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Filtered Responses ({course})</CardTitle>
            <CardDescription>
              Showing saved responses for your program
            </CardDescription>
          </div>

          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Survey ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {filteredError && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {filteredError}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0 mr-2">
        <div className="overflow-x-auto px-5">
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow className="sticky top-0 bg-muted/50">
                <TableHead>#</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Depression Risk</TableHead>
                <TableHead>Risk Probability</TableHead>
                <TableHead>Survey Response</TableHead>
                <TableHead>Result Explanation</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row, index) => {
                  const busy =
                    String(removeBusyKey || "") ===
                    String(row.surveyresponseId || "");

                  return (
                    <TableRow key={row.key} className="hover:bg-muted/50">
                      {/* Row Number */}
                      <TableCell className="text-muted-foreground py-3">
                        {(safePage - 1) * pageSize + index + 1}
                      </TableCell>

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
                                    value={
                                      row.survey?.pwd === "1" ? "Yes" : "No"
                                    }
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

                      <TableCell className="py-3 ">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" disabled={!row.result}>
                              Explanation
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-full p-4 space-y-3">
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
                    </TableRow>
                  );
                })
              )}
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
