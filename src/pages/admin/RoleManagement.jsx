/* eslint-disable react-hooks/set-state-in-effect */
// RoleManagement.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminStore } from "@/stores/adminStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertTriangle,
  RefreshCcw,
  Search,
  Shield,
  UserCog,
  Eye,
  EyeOff,
} from "lucide-react";

import { SectionLoader } from "@/components/SectionLoader";
import { useInactivityGuard } from "@/hooks/useInactivityGuard";

const ROLE_STAFF_ID = 3;
const ROLE_CHAIRPERSON_ID = 4;

function roleLabelById(id) {
  if (Number(id) === 2) return "Student";
  if (Number(id) === 3) return "Staff";
  if (Number(id) === 4) return "Chairperson";
  return "Unknown";
}

function RoleBadge({ role }) {
  const label = String(role ?? "Unknown").toLowerCase();

  if (label === "student") return <Badge variant="secondary">Student</Badge>;
  if (label === "staff")
    return <Badge className="bg-blue-600 text-white">Staff</Badge>;
  if (label === "chairperson")
    return <Badge className="bg-purple-600 text-white">Chairperson</Badge>;

  return <Badge variant="outline">Unknown</Badge>;
}

function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4" />
      <div className="min-w-0">{message}</div>
    </div>
  );
}

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

export default function RoleManagement() {
  const users = useAdminStore((s) => s.roleUsers);
  const loading = useAdminStore((s) => s.roleUsersLoading);
  const error = useAdminStore((s) => s.roleUsersError);

  const busyId = useAdminStore((s) => s.roleActionBusyId);
  const actionError = useAdminStore((s) => s.roleActionError);

  const fetchRoleCandidates = useAdminStore((s) => s.fetchRoleCandidates);
  const updateUserRoleType = useAdminStore((s) => s.updateUserRoleType);

  const subscribeRoleCandidates = useAdminStore(
    (s) => s.subscribeRoleCandidates,
  );
  const unsubscribeRoleCandidates = useAdminStore(
    (s) => s.unsubscribeRoleCandidates,
  );

  const markRoleSeen = useAdminStore((s) => s.markRoleSeen);

  const [selected, setSelected] = useState({});
  const [query, setQuery] = useState("");

  const [revealAll, setRevealAll] = useState(false);

  const subscribedRef = useRef(false);

  // auto hide after 1 min inactivity
  // const inactive = useInactivityGuard(60_000, revealAll);
  const inactive = useInactivityGuard(5_000, revealAll);

  useEffect(() => {
    if (inactive) setRevealAll(false);
  }, [inactive]);

  const [started, setStarted] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    markRoleSeen?.();
  }, [markRoleSeen]);

  useEffect(() => {
    if (subscribedRef.current) return;

    subscribedRef.current = true;

    const unsub = subscribeRoleCandidates?.();

    fetchRoleCandidates?.();

    return () => {
      if (typeof unsub === "function") unsub();
      unsubscribeRoleCandidates?.();
    };
  }, [fetchRoleCandidates, subscribeRoleCandidates, unsubscribeRoleCandidates]);

  useEffect(() => {
    const hasData = Array.isArray(users);
    const hasError = Boolean(error);

    if (loading) setStarted(true);

    if (hasData || hasError) setResolved(true);

    if (started && !loading) setResolved(true);
  }, [loading, users, error, started]);

  const rows = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((u) => {
      const email = String(u.email ?? "").toLowerCase();
      const sid = String(u.student_id ?? "").toLowerCase();
      const yr = String(u?.year?.year_level ?? "").toLowerCase();
      const role = String(u?.user_type?.user_type ?? "").toLowerCase();

      return (
        email.includes(q) ||
        sid.includes(q) ||
        yr.includes(q) ||
        role.includes(q)
      );
    });
  }, [rows, query]);

  const count = filtered.length;

  const onPick = (userId, nextRoleId) => {
    const num = nextRoleId ? Number(nextRoleId) : null;

    setSelected((s) => ({
      ...s,
      [userId]: num,
    }));
  };

  const onUpdate = async (userId) => {
    const nextId = selected[userId];

    if (!nextId) return;

    await updateUserRoleType?.(userId, nextId);

    setSelected((s) => {
      const copy = { ...s };
      delete copy[userId];
      return copy;
    });
  };

  if (!resolved) {
    return (
      <Card className="h-full w-full">
        <div className="p-6">
          <SectionLoader
            title="Loading role candidates"
            subtitle="Retrieving users eligible for role updates"
          />
        </div>
      </Card>
    );
  }

  const revealLabel = revealAll ? "Hide details" : "Show details";

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <UserCog className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <CardTitle className="truncate">Role Management</CardTitle>

                <CardDescription className="mt-1">
                  Users with year level Not Applicable and current role Student
                </CardDescription>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />

              <span>
                {loading
                  ? "Syncing..."
                  : `${count} user${count === 1 ? "" : "s"}`}
              </span>
            </div>

            {revealAll && (
              <p className="mt-2 text-xs text-muted-foreground">
                Full details are visible and will auto-hide after 1 minute of
                inactivity.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full sm:w-72">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search email, student id, role..."
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={fetchRoleCandidates}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>

            <Button
              variant="outline"
              onClick={() => setRevealAll((v) => !v)}
              className="gap-2"
              title={
                revealAll
                  ? "Mask emails and institution IDs"
                  : "Show full emails and institution IDs (auto-hides after 1 min inactivity)"
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

        {error && <ErrorBanner message={error} />}
        {actionError && <ErrorBanner message={actionError} />}
      </CardHeader>

      <CardContent className="mr-2 flex-1 overflow-auto p-0">
        <div className="overflow-x-auto px-5">
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow className="sticky top-0 bg-muted/50">
                <TableHead>Email</TableHead>
                <TableHead>Institution ID</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead className="w-55">Set Role</TableHead>
                <TableHead className="w-35 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const currentRole =
                    u?.user_type?.user_type || roleLabelById(u.userType_id);

                  const nextValue = selected[u.user_id] ?? "";
                  const isBusy = busyId === u.user_id;

                  return (
                    <TableRow key={u.user_id} className="hover:bg-muted/50">
                      <TableCell className="py-3">
                        <span className="font-medium">
                          {revealAll ? u.email : maskEmail(u.email)}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        {u.student_id
                          ? revealAll
                            ? u.student_id
                            : maskKeepFirstLast(u.student_id)
                          : "-"}
                      </TableCell>

                      <TableCell className="py-3">
                        <RoleBadge role={currentRole} />
                      </TableCell>

                      <TableCell className="py-3">
                        <Select
                          value={nextValue ? String(nextValue) : ""}
                          onValueChange={(v) => onPick(u.user_id, v)}
                          disabled={isBusy}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value={String(ROLE_STAFF_ID)}>
                              Staff
                            </SelectItem>

                            <SelectItem value={String(ROLE_CHAIRPERSON_ID)}>
                              Chairperson
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <Button
                          onClick={() => onUpdate(u.user_id)}
                          disabled={!nextValue || isBusy}
                        >
                          {isBusy ? "Saving..." : "Update"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
