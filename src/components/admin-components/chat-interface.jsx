/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Eye, EyeOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/chatStore";
import { SectionLoader } from "../SectionLoader";
import { useInactivityGuard } from "@/hooks/useInactivityGuard";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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

function maskStudentId(value) {
  const s = String(value || "").trim();
  if (!s) return "No ID";
  if (s.length <= 2) return s;
  return s[0] + "*".repeat(Math.max(1, s.length - 2)) + s[s.length - 1];
}

export function ChatInterface({ studentId, studentName, peerId, onClose }) {
  const messages = useChatStore((s) => s.messages);
  const messagesLoading = useChatStore((s) => s.messagesLoading);
  const messagesError = useChatStore((s) => s.messagesError);
  const sending = useChatStore((s) => s.sending);

  const ensureChat = useChatStore((s) => s.ensureChat);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markThreadRead = useChatStore((s) => s.markThreadRead);

  const [inputValue, setInputValue] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const bottomRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  // auto-hide details after 1 minute inactivity when details are visible
  // const detailsInactive = useInactivityGuard(60_000, showDetails);
  const detailsInactive = useInactivityGuard(5_000, showDetails);

  // auto-close chat after 1 minute inactivity while chat interface is open
  // const chatInactive = useInactivityGuard(60_000, true);
  const chatInactive = useInactivityGuard(7_000, true);

  useEffect(() => {
    if (!peerId) return;
    ensureChat(peerId);
  }, [peerId, ensureChat]);

  useEffect(() => {
    if (!bottomRef.current) return;
    if (!shouldAutoScrollRef.current) return;

    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (detailsInactive) setShowDetails(false);
  }, [detailsInactive]);

  useEffect(() => {
    if (!chatInactive) return;
    onClose?.();
  }, [chatInactive, onClose]);

  const list = useMemo(
    () => (Array.isArray(messages) ? messages : []),
    [messages],
  );

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || !peerId) return;

    setInputValue("");
    await sendMessage(peerId, text);
    await markThreadRead(peerId);
  };

  const displayName = showDetails
    ? studentName || "Unknown"
    : maskFullName(studentName) || "Unknown";

  const displayStudentId = showDetails
    ? studentId || "No ID"
    : maskStudentId(studentId);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="shrink-0 border-b border-border pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{displayName}</CardTitle>
            <p className="text-xs text-muted-foreground">
              ID: {displayStudentId}
            </p>

            {showDetails ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Full details are temporarily visible and will auto-hide after 1
                minute of inactivity.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDetails((v) => !v)}
              className="gap-2"
              title={
                showDetails
                  ? "Hide student details"
                  : "Show student details (auto hides after inactivity)"
              }
            >
              {showDetails ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showDetails ? "Hide details" : "Show details"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {messagesError ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {messagesError}
          </div>
        ) : null}
      </CardHeader>

      <ScrollArea className="flex-1">
        <div
          className="h-140 space-y-4 overflow-y-auto p-4 no-scrollbar"
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
          ) : list.length ? (
            list.map((msg) => {
              const mine = msg.sender === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      "max-w-xs rounded-lg px-3 py-2 text-sm",
                      mine
                        ? "rounded-br-none bg-primary text-primary-foreground"
                        : "rounded-bl-none bg-muted text-foreground",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap wrap-break-word">
                      {msg.message}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
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

      <CardContent className="shrink-0 border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending || !peerId}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || sending || !peerId}
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
