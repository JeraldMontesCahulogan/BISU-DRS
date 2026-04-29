/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquareOff, Mail, Clock } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { useUserStore } from "@/stores/userStore";
import { SectionLoader } from "../SectionLoader";
import ChatStudentSkeletal from "../skeletal/chatStudentSkeletal";
import { Badge } from "@/components/ui/badge";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function PendingChatNotice({ email, profile }) {
  const contactEmail = email || "jerald.cahulogan@bisu.edu.ph";

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

  const subject = "Chat Access Request (Pending Approval)";
  const body = [
    "Good day Guidance Office,",
    "",
    "I would like to request access to the chat feature. My account is still showing as pending approval.",
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

    const mailtoUrl = `mailto:${contactEmail}?subject=${enc(
      subject,
    )}&body=${enc(body)}`;

    if (isMobile) {
      window.location.href = mailtoUrl;
      return;
    }

    const gmailUrl =
      `https://mail.google.com/mail/u/0/?view=cm&fs=1&ui=2&tf=1` +
      `&to=${enc(contactEmail)}&su=${enc(subject)}&body=${enc(body)}`;

    try {
      const w = window.open(gmailUrl, "_blank", "noopener,noreferrer");
      if (!w) window.location.href = mailtoUrl;
    } catch {
      window.location.href = mailtoUrl;
    }
  };

  return (
    <div className="bg-background flex h-full items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-xl">
        <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-background/30">
            <div className="flex items-start justify-between gap-3 mt-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/60">
                  <MessageSquareOff className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="grid gap-1">
                  <CardTitle className="text-base sm:text-lg leading-tight">
                    Chat unavailable
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Your account is still under review by the Guidance Office.
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                Pending approval
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-5 pt-2 sm:px-6 space-y-5">
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-sm text-muted-foreground">
                You cannot access the chat feature until your account has been
                approved.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-foreground">
                Guidance Office Contact
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm font-medium text-foreground">
                    {contactEmail}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Office hours
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    Monday–Friday, 8:00 AM–5:00 PM
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="border-border/60 bg-background/40 w-full sm:w-auto"
                onClick={handleEmailClick}
              >
                Email Guidance Office
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ChatStudent() {
  const subscribedRef = useRef(false);
  const bottomRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const profile = useUserStore((s) => s.profile);
  const profileLoading = useUserStore((s) => s.profileLoading);
  const profileError = useUserStore((s) => s.profileError);
  const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);

  const approvalStatus = profile?.approvalStatus_id ?? null;
  const isApproved = approvalStatus === 2;
  const isPending = approvalStatus === 1;

  const adminPeer = useChatStore((s) => s.adminPeer);
  const adminLoading = useChatStore((s) => s.adminLoading);
  const adminError = useChatStore((s) => s.adminError);

  const messages = useChatStore((s) => s.messages);
  const messagesLoading = useChatStore((s) => s.messagesLoading);
  const messagesError = useChatStore((s) => s.messagesError);
  const sending = useChatStore((s) => s.sending);

  const fetchFirstAdmin = useChatStore((s) => s.fetchFirstAdmin);
  const subscribeFirstAdmin = useChatStore((s) => s.subscribeFirstAdmin);

  const ensureChat = useChatStore((s) => s.ensureChat);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markThreadReadDebounced = useChatStore(
    (s) => s.markThreadReadDebounced,
  );
  const setChatOpen = useChatStore((s) => s.setChatOpen);

  const [inputValue, setInputValue] = useState("");

  const [profileResolved, setProfileResolved] = useState(false);
  const [chatBootStarted, setChatBootStarted] = useState(false);
  const [chatResolved, setChatResolved] = useState(false);

  useEffect(() => {
    setChatOpen(true);
    return () => setChatOpen(false);
  }, [setChatOpen]);

  useEffect(() => {
    const unsub = subscribeUserProfile?.();
    return () => unsub?.();
  }, [subscribeUserProfile]);

  useEffect(() => {
    if (profileError) {
      setProfileResolved(true);
      return;
    }
    if (!profileLoading && profile) setProfileResolved(true);
  }, [profileLoading, profile, profileError]);

  useEffect(() => {
    if (!isApproved) {
      subscribedRef.current = false;
      setChatBootStarted(false);
      setChatResolved(false);
      return;
    }

    if (subscribedRef.current) return;
    subscribedRef.current = true;

    fetchFirstAdmin();
    const unsub = subscribeFirstAdmin();
    return () => unsub?.();
  }, [isApproved, fetchFirstAdmin, subscribeFirstAdmin]);

  useEffect(() => {
    if (!isApproved) return;
    const peerId = adminPeer?.peerId;
    if (!peerId) return;

    ensureChat(peerId);
    markThreadReadDebounced(peerId);
  }, [isApproved, adminPeer?.peerId, ensureChat, markThreadReadDebounced]);

  useEffect(() => {
    if (!isApproved) return;

    const hasSomeData =
      (adminPeer && adminPeer.peerId) ||
      (Array.isArray(messages) && messages.length > 0);

    const hasAnyError = Boolean(adminError || messagesError);

    if (hasSomeData || hasAnyError) setChatResolved(true);
    if (adminLoading || messagesLoading) setChatBootStarted(true);

    if (chatBootStarted && !adminLoading && !messagesLoading) {
      setChatResolved(true);
    }
  }, [
    isApproved,
    adminPeer,
    messages,
    adminLoading,
    messagesLoading,
    adminError,
    messagesError,
    chatBootStarted,
  ]);

  useEffect(() => {
    if (!isApproved) return;
    if (!bottomRef.current) return;
    if (!shouldAutoScrollRef.current) return;

    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [isApproved, messages]);

  const list = useMemo(
    () => (Array.isArray(messages) ? messages : []),
    [messages],
  );

  const handleSendMessage = async () => {
    if (!isApproved) return;

    const text = inputValue.trim();
    if (!text) return;
    if (!adminPeer?.peerId) return;

    setInputValue("");
    await sendMessage(adminPeer.peerId, text);
    markThreadReadDebounced(adminPeer.peerId);
  };

  if (profileError)
    return <div className="p-6 text-red-600">{profileError}</div>;
  if (!profileResolved) return <ChatStudentSkeletal />;
  if (!profile)
    return <SectionLoader title="Loading profile" subtitle="Please wait..." />;

  if (isPending) {
    return (
      <PendingChatNotice
        email="jerald.cahulogan@bisu.edu.ph"
        profile={profile}
      />
    );
  }

  if (!isApproved) return <ChatStudentSkeletal />;
  if (!chatResolved) return <ChatStudentSkeletal />;

  const topError = adminError || messagesError;

  return (
    // ✅ IMPORTANT: this wrapper makes the Card fill outlet height
    <div className="h-full min-h-0 flex flex-col mt-1">
      <Card className="flex flex-col h-full min-h-0 m-2 xs:m-3 sm:m-4 lg:m-6">
        <CardHeader className="border-b border-border pb-3 shrink-0">
          <div>
            <CardTitle className="text-base">
              {/* {adminPeer?.name || "Guidance Office"} */}
              Guidance Counselor
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {adminPeer?.email || "Admin chat"}
            </p>
          </div>

          {topError ? (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {topError}
            </div>
          ) : null}
        </CardHeader>

        {/* ✅ SCROLL INSIDE CARD */}
        <div
          className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-4"
          onScroll={(e) => {
            const el = e.currentTarget;
            const nearBottom =
              el.scrollHeight - (el.scrollTop + el.clientHeight) < 120;
            shouldAutoScrollRef.current = nearBottom;
          }}
        >
          {list.length ? (
            list.map((msg) => {
              const mine = msg.sender === "user";

              return (
                <div
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      // ✅ auto width based on content
                      "inline-block w-fit",
                      // ✅ max width still applies
                      "max-w-[85%] sm:max-w-[70%] lg:max-w-[60%]",
                      // ✅ optional: prevents tiny bubbles looking weird
                      "min-w-12",
                      // ✅ styling
                      "px-3 py-2 rounded-lg text-sm",
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
              Send your first message to the Guidance Office.
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <CardContent className="border-t border-border px-4 pt-4 shrink-0">
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
              disabled={!adminPeer?.peerId || sending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !adminPeer?.peerId || sending}
              size="sm"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
