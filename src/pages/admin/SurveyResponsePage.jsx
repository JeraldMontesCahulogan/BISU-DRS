// SurveyResponsePage.jsx
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Search, Check, Send, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import PredictionResult from "@/components/PredictionResult";
import { usePredictionStore } from "@/stores/predictionStore";
import SurveyResponsesSkeletal from "@/components/skeletal/surveyResponsesSkeletal";
import { SectionLoader } from "@/components/SectionLoader";
import { useInactivityGuard } from "@/hooks/useInactivityGuard";

// ✅ Drawer (shadcn)
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// ✅ Chat store
import { useChatStore } from "@/stores/chatStore";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

export default function SurveyResponses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const adminRows = usePredictionStore((s) => s.adminRows);
  const adminLoading = usePredictionStore((s) => s.adminLoading);
  const adminError = usePredictionStore((s) => s.adminError);
  const fetchAll = usePredictionStore((s) => s.fetchAllResponsesWithResults);
  const subAll = usePredictionStore((s) => s.subscribeAllResponsesRealtime);

  const markAdminSurveySeen = usePredictionStore((s) => s.markAdminSurveySeen);

  const filteredResponsesDb = usePredictionStore((s) => s.filteredResponses);
  const filteredLoading = usePredictionStore((s) => s.filteredLoading);
  const fetchFilteredResponses = usePredictionStore(
    (s) => s.fetchFilteredResponses,
  );
  const subscribeFilteredResponses = usePredictionStore(
    (s) => s.subscribeFilteredResponsesRealtime,
  );
  const addFilteredResponse = usePredictionStore((s) => s.addFilteredResponse);
  const addBusyKey = usePredictionStore((s) => s.filteredAddBusyKey);

  const subscribedRef = useRef(false);
  const subscribedFilterRef = useRef(false);

  // ✅ Blink-free gates
  const [adminStarted, setAdminStarted] = useState(false);
  const [adminResolved, setAdminResolved] = useState(false);

  const [filterStarted, setFilterStarted] = useState(false);
  const [filterResolved, setFilterResolved] = useState(false);

  // ✅ Drawer state (selected row)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRow, setChatRow] = useState(null);
  // const chatInactive = useInactivityGuard(60_000, chatOpen);
  const chatInactive = useInactivityGuard(5_000, chatOpen);

  // ✅ Chat UI state (same behavior as ChatInterface, but inline)
  const [chatInput, setChatInput] = useState("");
  const bottomRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  // ✅ Chat store bindings
  const messages = useChatStore((s) => s.messages);
  const messagesLoading = useChatStore((s) => s.messagesLoading);
  const messagesError = useChatStore((s) => s.messagesError);
  const sending = useChatStore((s) => s.sending);

  const ensureChat = useChatStore((s) => s.ensureChat);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markThreadRead = useChatStore((s) => s.markThreadRead);

  const peerId = chatRow?.userId || null; // ✅ use the student's auth user_id as peerId

  useEffect(() => {
    markAdminSurveySeen?.();
  }, [markAdminSurveySeen]);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    fetchAll();
    const unsub = subAll();

    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (subscribedFilterRef.current) return;
    subscribedFilterRef.current = true;

    fetchFilteredResponses();
    const unsub = subscribeFilteredResponses();

    return () => unsub?.();
  }, [fetchFilteredResponses, subscribeFilteredResponses]);

  useEffect(() => {
    if (adminLoading) setAdminStarted(true);
    if (adminError) setAdminResolved(true);
    if (adminStarted && !adminLoading) setAdminResolved(true);
    if (Array.isArray(adminRows) && adminRows.length > 0)
      setAdminResolved(true);
  }, [adminLoading, adminRows, adminError, adminStarted]);

  useEffect(() => {
    const hasData = Array.isArray(filteredResponsesDb);
    if (filteredLoading) setFilterStarted(true);
    if (hasData) setFilterResolved(true);
    if (filterStarted && !filteredLoading) setFilterResolved(true);
  }, [filteredLoading, filteredResponsesDb, filterStarted]);

  useEffect(() => {
    if (!chatInactive) return;

    setChatOpen(false);
    setChatRow(null);
    setChatInput("");
    shouldAutoScrollRef.current = true;
  }, [chatInactive]);

  const filteredSet = useMemo(() => {
    const map = new Map();
    for (const r of Array.isArray(filteredResponsesDb)
      ? filteredResponsesDb
      : []) {
      const sid = String(r?.surveyresponse_id || "");
      if (sid) map.set(sid, true);
    }
    return map;
  }, [filteredResponsesDb]);

  const responses = useMemo(() => {
    const rows = Array.isArray(adminRows) ? adminRows : [];

    return rows
      .filter((row) => !!row?.result)
      .map((row) => {
        const sr = row.survey || {};
        const pr = row.result || null;
        const u = row.user || null;

        const risk = pr?.depression_risk_result ?? "unknown";
        const prob = toProb100(pr?.depression_risk_result_probability);

        return {
          key: sr.surveyresponse_id,
          surveyresponseId: sr.surveyresponse_id,
          userId: sr.user_id, // ✅ important for chat peerId

          studentId: u?.student_id || "",
          studentName:
            `${u?.firstname || ""} ${u?.lastname || ""}`.trim() || "Unknown",
          // studentName:
          //   u?.student_id ||
          //   `${u?.firstname || ""} ${u?.lastname || ""}`.trim() ||
          //   "Unknown",
          email: u?.email || "",

          depressionRisk: risk,
          depressionRiskProbability: prob,

          gender: sr.gender,
          age: sr.age,
          course: sr.course,
          yearLevel: sr.year_level,
          workingStudent: sr.working_student,

          pwd: sr.pwd,
          livingArrangement: sr.living_arrangement,
          indigenousGroup: sr.indigenous_group,

          bmi: sr.bmi,
          sleepDuration: sr.sleep_duration,
          breakfastHabit: sr.breakfast_habit,
          exerciseFrequency: sr.exercise_frequency,
          smokingStatus: sr.smoking_status,
          alcoholConsumption: sr.alcohol_consumption,

          schoolworkTime: sr.schoolwork_spent_daily,
          socialSupport: sr.social_support,
          relationshipStress: sr.romantic_personal_relationship_stress,

          bullied: sr.bullied,
          academicPressure: sr.academic_pressure,
          academicDissatisfaction: sr.academic_dissatisfaction,
          schoolworkOverload: sr.academic_workload,
          financialStress: sr.financial_stress,

          result: pr,
        };
      });
  }, [adminRows]);

  const filteredResponses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return responses
      .filter((r) => {
        if (!q) return true;

        return (
          String(r.studentName || "")
            .toLowerCase()
            .includes(q) ||
          String(r.studentId || "")
            .toLowerCase()
            .includes(q) ||
          String(r.course || "")
            .toLowerCase()
            .includes(q) ||
          String(r.email || "")
            .toLowerCase()
            .includes(q)
        );
      })
      .filter((r) => (courseFilter ? r.course === courseFilter : true))
      .filter((r) => (yearFilter ? r.yearLevel === yearFilter : true));
  }, [responses, searchTerm, courseFilter, yearFilter]);

  const uniqueCourses = useMemo(() => {
    return Array.from(new Set(responses.map((r) => r.course).filter(Boolean)));
  }, [responses]);

  const uniqueYears = useMemo(() => {
    return Array.from(
      new Set(responses.map((r) => r.yearLevel).filter(Boolean)),
    );
  }, [responses]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, courseFilter, yearFilter, pageSize]);

  const totalItems = filteredResponses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = clamp(page, 1, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filteredResponses.slice(start, end);
  }, [filteredResponses, safePage, pageSize]);

  const onAddToFilter = async (row) => {
    await addFilteredResponse({
      surveyresponseId: row?.surveyresponseId,
      resultId: row?.result?.result_id || row?.result?.resultId || null,
      course: row?.course || "",
    });
  };

  const openChatDrawer = (row) => {
    setChatRow(row);
    setChatInput("");
    setChatOpen(true);
  };

  // ✅ When drawer opens / peer changes: fetch messages and mark read
  useEffect(() => {
    if (!chatOpen) return;
    if (!peerId) return;

    ensureChat(peerId);
    markThreadRead?.(peerId);
  }, [chatOpen, peerId, ensureChat, markThreadRead]);

  // ✅ Auto scroll like your ChatInterface
  useEffect(() => {
    if (!chatOpen) return;
    if (!bottomRef.current) return;
    if (!shouldAutoScrollRef.current) return;

    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const chatList = useMemo(
    () => (Array.isArray(messages) ? messages : []),
    [messages],
  );

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text) return;
    if (!peerId) return;

    setChatInput("");
    await sendMessage(peerId, text);
    await markThreadRead(peerId);
  };

  const topError = adminError;

  if (!adminResolved) {
    return (
      <div className="w-full h-full">
        <SurveyResponsesSkeletal withChatPanel={false} />
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full flex gap-4">
        <Card className="w-full h-full flex flex-col">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <CardTitle className="truncate">Survey Responses</CardTitle>
                <CardDescription className="mt-1">
                  View student survey responses and depression risk assessment
                </CardDescription>
              </div>

              <div className="w-full lg:w-auto">
                <div className="flex flex-col gap-3 lg:items-end">
                  <div className="w-full lg:w-80">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email, program, year level..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-end">
                    <select
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">All Programs</option>
                      {uniqueCourses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full border border-border bg-background rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">All Years</option>
                      {uniqueYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full sm:w-auto gap-2 text-foreground hover:text-foreground border"
                      onClick={() => {
                        setCourseFilter("");
                        setYearFilter("");
                        setSearchTerm("");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {topError ? (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {topError}
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-0 mr-2">
            <div className="overflow-x-auto px-5">
              <Table className="border-separate border-spacing-y-2">
                <TableHeader>
                  <TableRow className="sticky top-0 bg-muted/50">
                    {/* <TableHead>Student ID</TableHead> */}
                    <TableHead>Program</TableHead>
                    <TableHead>Year Level</TableHead>
                    <TableHead>Depression Risk</TableHead>
                    <TableHead>Risk Probability</TableHead>
                    <TableHead>Survey Response</TableHead>
                    <TableHead>Result Explanation</TableHead>
                    <TableHead>Chat</TableHead>
                    <TableHead className="text-center">Add to Filter</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pageRows.map((response) => {
                    const sid = String(response?.surveyresponseId || "");
                    const added = sid ? filteredSet.has(sid) : false;
                    const busy = addBusyKey === sid;
                    const safeAdded = filterResolved ? added : false;

                    return (
                      <TableRow
                        key={response.key}
                        className="hover:bg-muted/50"
                      >
                        {/* <TableCell className="font-medium py-3">
                          {response.studentId || response.studentName}
                        </TableCell> */}

                        <TableCell className="text-muted-foreground py-3">
                          {response.course || "Not set"}
                        </TableCell>

                        <TableCell className="text-foreground py-3">
                          {response.yearLevel || "Not set"}
                        </TableCell>

                        <TableCell className="py-3">
                          <Badge
                            variant={
                              String(
                                response.depressionRisk || "",
                              ).toLowerCase() === "yes"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {String(
                              response.depressionRisk || "",
                            ).toLowerCase() === "yes"
                              ? "At risk"
                              : String(
                                    response.depressionRisk || "",
                                  ).toLowerCase() === "no"
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
                                  width: `${response.depressionRiskProbability}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm">
                              {response.depressionRiskProbability}/100
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
                                        response.gender === "1"
                                          ? "Male"
                                          : "Female"
                                      }
                                    />
                                    <Field label="Age" value={response.age} />
                                    <Field
                                      label="Program"
                                      value={response.course}
                                    />
                                    <Field
                                      label="Year Level"
                                      value={response.yearLevel}
                                    />
                                    <Field
                                      label="Working Student"
                                      value={
                                        response.workingStudent === "1"
                                          ? "Yes"
                                          : "No"
                                      }
                                    />
                                    <Field
                                      label="PWD"
                                      value={
                                        response.pwd === "1" ? "Yes" : "No"
                                      }
                                    />
                                    <Field
                                      label="Living Arrangement"
                                      value={response.livingArrangement}
                                    />
                                    <Field
                                      label="Indigenous Group"
                                      value={
                                        response.indigenousGroup === "1"
                                          ? "Yes"
                                          : "No"
                                      }
                                    />
                                    <Field label="BMI" value={response.bmi} />
                                    <Field
                                      label="Sleep Duration"
                                      value={response.sleepDuration}
                                    />
                                    <Field
                                      label="Breakfast Habit"
                                      value={response.breakfastHabit}
                                    />
                                    <Field
                                      label="Exercise Frequency"
                                      value={response.exerciseFrequency}
                                    />
                                    <Field
                                      label="Smoking Status"
                                      value={response.smokingStatus}
                                    />
                                    <Field
                                      label="Alcohol Consumption"
                                      value={response.alcoholConsumption}
                                    />
                                    <Field
                                      label="Schoolwork Time"
                                      value={response.schoolworkTime}
                                    />
                                    <Field
                                      label="Social Support"
                                      value={response.socialSupport}
                                    />
                                    <Field
                                      label="Relationship Stress"
                                      value={response.relationshipStress}
                                    />
                                    <Field
                                      label="Bullied"
                                      value={
                                        response.bullied === "1" ? "Yes" : "No"
                                      }
                                    />
                                    <Field
                                      label="Academic Pressure"
                                      value={response.academicPressure}
                                    />
                                    <Field
                                      label="Academic Dissatisfaction"
                                      value={response.academicDissatisfaction}
                                    />
                                    <Field
                                      label="Schoolwork Overload"
                                      value={response.schoolworkOverload}
                                    />
                                    <Field
                                      label="Financial Stress"
                                      value={response.financialStress}
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
                              <Button
                                variant="outline"
                                disabled={!response.result}
                              >
                                Explanation
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-130 p-4">
                              {response.result ? (
                                <PredictionResult result={response.result} />
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  No prediction result yet.
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </TableCell>

                        {/* ✅ Chat icon -> opens Drawer */}
                        <TableCell className="py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openChatDrawer(response)}
                            className={[
                              "gap-2",
                              "text-muted-foreground hover:text-foreground",
                              "hover:bg-muted",
                              "relative",
                            ].join(" ")}
                            title={`Chat with ${response.studentName}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </TableCell>

                        <TableCell className="text-center py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={
                              busy ||
                              safeAdded ||
                              filteredLoading ||
                              !filterResolved
                            }
                            onClick={() => onAddToFilter(response)}
                            className={[
                              "gap-2",
                              "text-muted-foreground hover:text-foreground",
                              "hover:bg-muted",
                              "relative",
                            ].join(" ")}
                            title={safeAdded ? "Added" : "Add"}
                          >
                            {safeAdded ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!adminLoading && pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
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
      </div>

      {/* ✅ Drawer (right) + FULL chat behavior inline */}
      <Drawer
        direction="right"
        open={chatOpen}
        onOpenChange={(open) => {
          setChatOpen(open);
          if (!open) {
            setChatRow(null);
            setChatInput("");
            shouldAutoScrollRef.current = true;
          }
        }}
      >
        <DrawerContent
          className={[
            "h-dvh",
            "w-[92vw] sm:w-105 md:w-130",
            "ml-auto",
            "flex flex-col",
          ].join(" ")}
        >
          <DrawerHeader className="shrink-0 border-b border-border pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DrawerTitle className="truncate">
                  {chatRow?.studentName || "Student"}
                </DrawerTitle>
                <DrawerDescription className="truncate">
                  ID: {chatRow?.studentId || "N/A"} • Program:{" "}
                  {chatRow?.course || "N/A"} • Year:{" "}
                  {chatRow?.yearLevel || "N/A"}
                </DrawerDescription>
              </div>

              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>

            {!peerId ? (
              // <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              //   Cannot open chat: missing userId (peerId).
              // </div>
              <div></div>
            ) : null}

            {messagesError ? (
              <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {messagesError}
              </div>
            ) : null}
          </DrawerHeader>

          {/* ✅ Messages */}
          <ScrollArea className="flex-1 min-h-0">
            <div
              className="p-4 space-y-4"
              onScroll={(e) => {
                const el = e.currentTarget;
                const nearBottom =
                  el.scrollHeight - (el.scrollTop + el.clientHeight) < 120;
                shouldAutoScrollRef.current = nearBottom;
              }}
            >
              {messagesLoading ? (
                <SectionLoader
                  title="Loading messages"
                  subtitle="Retrieving conversation history"
                />
              ) : chatList.length ? (
                chatList.map((msg) => {
                  // same logic you used:
                  // sender === "user" means "mine" (admin side in your UI)
                  const mine = msg.sender === "user";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={[
                          "max-w-xs px-3 py-2 rounded-lg text-sm",
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted text-foreground rounded-bl-none",
                        ].join(" ")}
                      >
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {msg.message}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            mine
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">
                  No messages yet.
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* ✅ Composer */}
          <DrawerFooter className="shrink-0 border-t border-border p-4">
            <div className="flex gap-2 w-full">
              <Input
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sending || !peerId}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!peerId || !chatInput.trim() || sending}
                size="sm"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
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
