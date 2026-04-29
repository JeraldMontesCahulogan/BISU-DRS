/* eslint-disable react-hooks/set-state-in-effect */
// RequestApproval.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Search, Eye, EyeOff } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";
import RequestApprovalSkeletal from "@/components/skeletal/requestApprovalSkeletal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ✅ Tabs (shadcn/ui)
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ✅ inactivity hook (same one you used earlier)
import { useInactivityGuard } from "@/hooks/useInactivityGuard";

function maskKeepFirstLast(value) {
  const s = String(value ?? "");
  if (s.length <= 2) return s;
  return s[0] + "*".repeat(s.length - 2) + s[s.length - 1];
}

function maskEmail(email) {
  const s = String(email ?? "");
  const at = s.indexOf("@");
  if (at === -1) return maskKeepFirstLast(s);

  const local = s.slice(0, at);
  const domain = s.slice(at + 1);

  return maskKeepFirstLast(local) + "@" + maskKeepFirstLast(domain);
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

function RequestsTable({
  rows,
  mode, // "pending" | "approved" | "rejected"
  onApprove,
  onReject,
  busyId,
  page,
  pageSize,
  onPage,
  onPageSize,
  revealAll,
}) {
  const showActions = mode === "pending";

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = clamp(page, 1, totalPages);

  useEffect(() => {
    if (page !== safePage) onPage(safePage);
  }, [page, safePage, onPage]);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return rows.slice(start, end);
  }, [rows, safePage, pageSize]);

  const emptyText =
    mode === "pending"
      ? "No pending requests"
      : mode === "approved"
        ? "No approved users"
        : "No rejected users";

  const colCount = showActions ? 6 : 5;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-x-auto px-5">
        <Table className="border-separate border-spacing-y-2">
          <TableHeader>
            <TableRow className="sticky top-0 bg-muted/50">
              <TableHead>Institution ID</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Year Level</TableHead>
              {showActions ? (
                <TableHead className="w-44 text-right">Action</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>

          <TableBody>
            {pageRows.length > 0 ? (
              pageRows.map((request) => {
                const busy = busyId === request.id;

                return (
                  <TableRow key={request.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium py-3">
                      {revealAll
                        ? request.studentId
                        : maskKeepFirstLast(request.studentId)}
                    </TableCell>

                    <TableCell className="py-3">
                      {revealAll ? request.email : maskEmail(request.email)}
                    </TableCell>

                    <TableCell className="py-3">
                      {request.department || "-"}
                    </TableCell>
                    <TableCell className="py-3">
                      {request.program || "-"}
                    </TableCell>
                    <TableCell className="py-3">
                      {request.yearLevel === "Not Applicable" ||
                      request.year_level === "Not Applicable"
                        ? "Personnel"
                        : (request.yearLevel ?? request.year_level ?? "-")}
                    </TableCell>

                    {showActions ? (
                      <TableCell className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReject?.(request.id)}
                            disabled={busy}
                            className="text-red-600 hover:text-red-700"
                          >
                            {busy ? "Working..." : "Reject"}
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => onApprove?.(request.id)}
                            disabled={busy}
                          >
                            {busy ? "Working..." : "Approve"}
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="py-10 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPage={(p) => onPage(clamp(p, 1, totalPages))}
        pageSize={pageSize}
        onPageSize={(n) => onPageSize(n)}
      />
    </div>
  );
}

function mapUsersToRows(users, q) {
  const rows = Array.isArray(users) ? users : [];
  const query = String(q ?? "")
    .trim()
    .toLowerCase();

  const mapped = rows.map((u) => {
    const deptCode = u.program?.department?.code ?? "";
    const progName = u.program?.program ?? "";
    const yearName = u.year?.year_level ?? "";

    return {
      id: u.user_id,
      studentId: u.student_id ?? "",
      email: u.email ?? "",
      department: deptCode,
      program: progName,
      yearLevel: yearName,
    };
  });

  if (!query) return mapped;

  return mapped.filter((r) => {
    return (
      String(r.studentId).toLowerCase().includes(query) ||
      String(r.email).toLowerCase().includes(query) ||
      String(r.program).toLowerCase().includes(query) ||
      String(r.department).toLowerCase().includes(query) ||
      String(r.yearLevel).toLowerCase().includes(query)
    );
  });
}

export default function RequestApproval() {
  const [tab, setTab] = useState("pending");

  // Separate search + paging per tab
  const [pendingSearch, setPendingSearch] = useState("");
  const [approvedSearch, setApprovedSearch] = useState("");
  const [rejectedSearch, setRejectedSearch] = useState("");

  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const [pendingPageSize, setPendingPageSize] = useState(10);
  const [approvedPageSize, setApprovedPageSize] = useState(10);
  const [rejectedPageSize, setRejectedPageSize] = useState(10);

  // ✅ Global reveal toggle
  const [revealAll, setRevealAll] = useState(false);

  // ✅ auto-hide after 1 min inactivity (only when revealAll is ON)
  // const inactive = useInactivityGuard(60_000, revealAll);
  const inactive = useInactivityGuard(5_000, revealAll);
  useEffect(() => {
    if (inactive) setRevealAll(false);
  }, [inactive]);

  // Store data
  const pendingUsers = useAdminStore((s) => s.pendingUsers);
  const pendingLoading = useAdminStore((s) => s.pendingLoading);
  const pendingError = useAdminStore((s) => s.pendingError);

  const approvedUsers = useAdminStore((s) => s.approvedUsers);
  const approvedLoading = useAdminStore((s) => s.approvedLoading);
  const approvedError = useAdminStore((s) => s.approvedError);

  const rejectedUsers = useAdminStore((s) => s.rejectedUsers);
  const rejectedLoading = useAdminStore((s) => s.rejectedLoading);
  const rejectedError = useAdminStore((s) => s.rejectedError);

  const actionBusyId = useAdminStore((s) => s.actionBusyId);
  const actionError = useAdminStore((s) => s.actionError);

  const approveUser = useAdminStore((s) => s.approveUser);
  const rejectUser = useAdminStore((s) => s.rejectUser);

  const subscribePendingApprovals = useAdminStore(
    (s) => s.subscribePendingApprovals,
  );
  const subscribeApprovedApprovals = useAdminStore(
    (s) => s.subscribeApprovedApprovals,
  );
  const subscribeRejectedApprovals = useAdminStore(
    (s) => s.subscribeRejectedApprovals,
  );

  const markPendingSeen = useAdminStore((s) => s.markPendingSeen);

  const subscribedRef = useRef(false);

  // ✅ Gate per tab (avoid blink)
  const [pendingStarted, setPendingStarted] = useState(false);
  const [pendingResolved, setPendingResolved] = useState(false);

  const [approvedStarted, setApprovedStarted] = useState(false);
  const [approvedResolved, setApprovedResolved] = useState(false);

  const [rejectedStarted, setRejectedStarted] = useState(false);
  const [rejectedResolved, setRejectedResolved] = useState(false);

  // Subscribe once (all tabs)
  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsubPending = subscribePendingApprovals?.();
    const unsubApproved = subscribeApprovedApprovals?.();
    const unsubRejected = subscribeRejectedApprovals?.();

    return () => {
      unsubPending?.();
      unsubApproved?.();
      unsubRejected?.();
    };
  }, [
    subscribePendingApprovals,
    subscribeApprovedApprovals,
    subscribeRejectedApprovals,
  ]);

  // Mark pending seen once
  useEffect(() => {
    markPendingSeen?.();
  }, [markPendingSeen]);

  // Resolve logic
  useEffect(() => {
    if (pendingLoading) setPendingStarted(true);
    if (pendingError) setPendingResolved(true);
    if (pendingStarted && !pendingLoading) setPendingResolved(true);
    if (Array.isArray(pendingUsers)) setPendingResolved(true);
  }, [pendingLoading, pendingStarted, pendingError, pendingUsers]);

  useEffect(() => {
    if (approvedLoading) setApprovedStarted(true);
    if (approvedError) setApprovedResolved(true);
    if (approvedStarted && !approvedLoading) setApprovedResolved(true);
    if (Array.isArray(approvedUsers)) setApprovedResolved(true);
  }, [approvedLoading, approvedStarted, approvedError, approvedUsers]);

  useEffect(() => {
    if (rejectedLoading) setRejectedStarted(true);
    if (rejectedError) setRejectedResolved(true);
    if (rejectedStarted && !rejectedLoading) setRejectedResolved(true);
    if (Array.isArray(rejectedUsers)) setRejectedResolved(true);
  }, [rejectedLoading, rejectedStarted, rejectedError, rejectedUsers]);

  // Reset paging when search/pageSize changes per tab
  useEffect(() => setPendingPage(1), [pendingSearch, pendingPageSize]);
  useEffect(() => setApprovedPage(1), [approvedSearch, approvedPageSize]);
  useEffect(() => setRejectedPage(1), [rejectedSearch, rejectedPageSize]);

  // ✅ When switching tab: auto-mask again (privacy)
  useEffect(() => {
    setRevealAll(false);
  }, [tab]);

  const pendingRows = useMemo(
    () => mapUsersToRows(pendingUsers, pendingSearch),
    [pendingUsers, pendingSearch],
  );

  const approvedRows = useMemo(
    () => mapUsersToRows(approvedUsers, approvedSearch),
    [approvedUsers, approvedSearch],
  );

  const rejectedRows = useMemo(
    () => mapUsersToRows(rejectedUsers, rejectedSearch),
    [rejectedUsers, rejectedSearch],
  );

  const handleApprove = async (id) => {
    await approveUser?.(id);
  };

  const handleReject = async (id) => {
    await rejectUser?.(id);
  };

  const topError =
    tab === "pending"
      ? pendingError || actionError
      : tab === "approved"
        ? approvedError
        : rejectedError;

  const syncing =
    tab === "pending"
      ? pendingLoading
      : tab === "approved"
        ? approvedLoading
        : rejectedLoading;

  // ✅ Render gate per tab
  const mustWait =
    (tab === "pending" && !pendingResolved) ||
    (tab === "approved" && !approvedResolved) ||
    (tab === "rejected" && !rejectedResolved);

  if (mustWait) return <RequestApprovalSkeletal />;

  const revealLabel = revealAll ? "Hide details" : "Show details";

  // ✅ per-tab bindings for UI
  const searchValue =
    tab === "pending"
      ? pendingSearch
      : tab === "approved"
        ? approvedSearch
        : rejectedSearch;

  const setSearchValue =
    tab === "pending"
      ? setPendingSearch
      : tab === "approved"
        ? setApprovedSearch
        : setRejectedSearch;

  const headerTitle =
    tab === "pending"
      ? "Approval Requests"
      : tab === "approved"
        ? "Approved Users"
        : "Rejected Users";

  const headerDesc =
    tab === "pending"
      ? "Review and approve student requests"
      : tab === "approved"
        ? "View the list of approved accounts"
        : "View the list of rejected accounts";

  return (
    <Card className="w-full h-full flex flex-col">
      {/* ✅ MATCHED header style (like Filtered/Survey pages) */}
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="truncate">{headerTitle}</CardTitle>
            <CardDescription className="mt-1">{headerDesc}</CardDescription>

            {syncing ? (
              <p className="mt-2 text-xs text-muted-foreground">Syncing…</p>
            ) : null}

            {revealAll ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Full details are visible and will auto-hide after 1 minute of
                inactivity.
              </p>
            ) : null}
          </div>

          <div className="w-full lg:w-auto">
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="w-full lg:w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, email, dept, program..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Tabs
                  value={tab}
                  onValueChange={setTab}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="pending" className="gap-2">
                      Pending
                      <Badge variant="secondary" className="h-5 px-2">
                        {pendingRows.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="gap-2">
                      Approved
                      <Badge variant="secondary" className="h-5 px-2">
                        {approvedRows.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="gap-2">
                      Rejected
                      <Badge variant="secondary" className="h-5 px-2">
                        {rejectedRows.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  variant="outline"
                  onClick={() => setRevealAll((v) => !v)}
                  className="w-full sm:w-auto gap-2"
                  title={
                    revealAll
                      ? "Mask IDs and emails"
                      : "Show full IDs and emails (auto-hides after 1 min inactivity)"
                  }
                >
                  {revealAll ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {revealLabel}
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

      {/* ✅ content layout matched (scroll + p-0 + mr-2) */}
      <CardContent className="flex-1 min-h-0 overflow-auto p-0 mr-2">
        <Tabs value={tab} className="h-full">
          <TabsContent value="pending" className="h-full m-0">
            <RequestsTable
              rows={pendingRows}
              mode="pending"
              onApprove={handleApprove}
              onReject={handleReject}
              busyId={actionBusyId}
              page={pendingPage}
              pageSize={pendingPageSize}
              onPage={setPendingPage}
              onPageSize={(n) => {
                setPendingPageSize(n);
                setPendingPage(1);
              }}
              revealAll={revealAll}
            />
          </TabsContent>

          <TabsContent value="approved" className="h-full m-0">
            <RequestsTable
              rows={approvedRows}
              mode="approved"
              busyId={null}
              page={approvedPage}
              pageSize={approvedPageSize}
              onPage={setApprovedPage}
              onPageSize={(n) => {
                setApprovedPageSize(n);
                setApprovedPage(1);
              }}
              revealAll={revealAll}
            />
          </TabsContent>

          <TabsContent value="rejected" className="h-full m-0">
            <RequestsTable
              rows={rejectedRows}
              mode="rejected"
              busyId={null}
              page={rejectedPage}
              pageSize={rejectedPageSize}
              onPage={setRejectedPage}
              onPageSize={(n) => {
                setRejectedPageSize(n);
                setRejectedPage(1);
              }}
              revealAll={revealAll}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
