// src/components/chat/ChatList.jsx
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageCircle, Eye, EyeOff } from "lucide-react";
import { ChatInterface } from "./chat-interface";
import { useChatStore } from "@/stores/chatStore";
import { SectionLoader } from "@/components/SectionLoader";
import { Button } from "@/components/ui/button";

// ✅ your inactivity hook
import { useInactivityGuard } from "@/hooks/useInactivityGuard";

/**
 * Mask format examples:
 *  - "Jerald" -> "J****D"
 *  - "Cahulogan" -> "C****N"
 *  - "Dhi" -> "D*I"
 */
function maskToken(token) {
  const s = String(token || "").trim();
  if (!s) return "";
  if (s.length === 1) return s;
  if (s.length === 2) return s[0] + "*";
  if (s.length === 3) return s[0] + "*" + s[2];

  const first = s[0];
  const last = s[s.length - 1];
  const stars = "*".repeat(Math.max(3, s.length - 2));
  return `${first}${stars}${last}`;
}

function maskFullName(fullName) {
  const raw = String(fullName || "").trim();
  if (!raw) return "";

  const parts = raw.split(/\s+/).filter(Boolean);
  if (!parts.length) return "";

  return parts.map(maskToken).join(" ");
}

export function ChatList() {
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Privacy toggle: default is masked
  const [showFullNames, setShowFullNames] = useState(false);

  // ✅ If no interaction for 30s -> auto back to masked
  // const inactive = useInactivityGuard(30_000, showFullNames);
  const inactive = useInactivityGuard(5_000, showFullNames);

  useEffect(() => {
    if (inactive) setShowFullNames(false);
  }, [inactive]);

  const users = useChatStore((s) => s.users);
  const usersLoading = useChatStore((s) => s.usersLoading);
  const usersError = useChatStore((s) => s.usersError);

  const activePeer = useChatStore((s) => s.activePeer);
  const openChat = useChatStore((s) => s.openChat);
  const closeChat = useChatStore((s) => s.closeChat);

  const fetchUsersDirectory = useChatStore((s) => s.fetchUsersDirectory);
  const subscribeUsersDirectory = useChatStore(
    (s) => s.subscribeUsersDirectory,
  );

  const subscribedRef = useRef(false);

  // ✅ Blink-free resolved gates for the directory
  const [dirStarted, setDirStarted] = useState(false);
  const [dirResolved, setDirResolved] = useState(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    fetchUsersDirectory?.();
    const unsub = subscribeUsersDirectory?.();

    return () => {
      unsub?.();
    };
  }, [fetchUsersDirectory, subscribeUsersDirectory]);

  // Track resolved to prevent "loader -> list -> loader -> list" flicker
  useEffect(() => {
    const hasData = Array.isArray(users);
    const hasError = Boolean(usersError);

    if (usersLoading) setDirStarted(true);
    if (hasData || hasError) setDirResolved(true);
    if (dirStarted && !usersLoading) setDirResolved(true);
  }, [usersLoading, users, usersError, dirStarted]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const rows = Array.isArray(users) ? users : [];
    if (!q) return rows;

    return rows.filter((u) => {
      const name = String(u.name || "").toLowerCase();
      const course = String(u.course || "").toLowerCase();
      const year = String(u.yearLevel || "").toLowerCase();
      const sid = String(u.studentId || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      return (
        name.includes(q) ||
        course.includes(q) ||
        year.includes(q) ||
        sid.includes(q) ||
        email.includes(q)
      );
    });
  }, [users, searchTerm]);

  // ✅ Optional: keep layout stable when opening chat
  if (activePeer) {
    return (
      <div className="flex h-full">
        <div className="flex-1 min-w-0">
          <ChatInterface
            studentId={activePeer.studentId}
            studentName={activePeer.name}
            peerId={activePeer.peerId}
            onClose={closeChat}
          />
        </div>
      </div>
    );
  }

  // ✅ Show loader only before first resolve
  if (!dirResolved) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="border-b border-border p-6">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-foreground mb-1">
              Messages
            </h2>
            <p className="text-sm text-muted-foreground">
              Select a user to start or continue a chat
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, email, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted border-border"
              disabled
            />
          </div>
        </div>

        <div className="flex-1 p-6">
          <SectionLoader
            title="Loading users directory"
            subtitle="Retrieving user information and chat statuses..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b border-border p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-3xl font-bold text-foreground mb-1">
              Messages
            </h2>
            <p className="text-sm text-muted-foreground">
              Select a user to start or continue a chat
            </p>
          </div>

          {/* ✅ Toggle button (professional + consistent) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFullNames((v) => !v)}
            className={[
              "shrink-0 gap-2",
              // ✅ remove the little focus shadow after click
              "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            ].join(" ")}
            title={
              showFullNames
                ? "Hide names (mask)"
                : "Show full names (auto hides after inactivity)"
            }
          >
            {showFullNames ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showFullNames ? "Hide names" : "Show names"}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, email, course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>

        {usersError ? (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {usersError}
          </div>
        ) : null}

        {usersLoading ? (
          <p className="mt-2 text-xs text-muted-foreground">Syncing…</p>
        ) : null}

        {showFullNames ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Full names are temporarily visible and will auto-hide after
            inactivity.
          </p>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-3">
          {filteredUsers.length ? (
            filteredUsers.map((u) => {
              const displayName = showFullNames ? u.name : maskFullName(u.name);
              const hasUnread = Number(u.unread || 0) > 0;

              return (
                <button
                  key={u.peerId}
                  onClick={() => openChat?.(u)}
                  className={[
                    "w-full text-left p-4 rounded-lg border border-border bg-background",
                    "hover:bg-muted transition-all duration-200 group",
                    // ✅ remove the little focus shadow after click
                    "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                    "active:translate-y-[0.5px]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {displayName || "Unknown"}
                        </h3>

                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {u.course} • {u.yearLevel} • {u.studentId || "No ID"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-2">
                      <span className="text-xs text-muted-foreground">
                        {u.timestampLabel || ""}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {u.lastMessage || "No messages yet"}
                  </p>

                  {hasUnread ? (
                    <div className="flex items-center justify-between">
                      {/* ✅ Better unread dot contrast in light/dark */}
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "h-2.5 w-2.5 rounded-full bg-primary",
                            // ring makes it visible on any background
                            "ring-2 ring-background",
                          ].join(" ")}
                        />
                        <span className="text-xs text-muted-foreground">
                          Unread
                        </span>
                      </div>

                      {/* ✅ Badge that pops in light/dark */}
                      <span className="bg-primary text-primary-foreground text-xs font-semibold rounded-full px-2 py-1">
                        {u.unread} new
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No users found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
