// src/components/RejectionEmailModal.jsx
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, MailX } from "lucide-react";

const FROM_EMAIL = "guidance.counselor@bisu.edu.ph";

function buildDefaultBody(fullName = "Student") {
  return [
    `Hello ${fullName},`,
    "",
    "Your account registration has been rejected after review by the Guidance Office.",
    "",
    "Common reasons for rejection:",
    "1) Incomplete or incorrect information",
    "2) Invalid student ID or mismatch with records",
    "3) Duplicate account registration",
    "",
    "If you believe this is a mistake, please contact the Guidance Office for assistance.",
  ].join("\n");
}

export default function RejectionEmailModal({
  open,
  onOpenChange,
  request,
  onSend,
}) {
  const toEmail = request?.email || "";
  const fullName =
    `${request?.firstname || ""} ${request?.lastname || ""}`.trim();

  const [extraReason, setExtraReason] = useState("");
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const baseBody = useMemo(
    () => buildDefaultBody(fullName || "Student"),
    [fullName],
  );

  useEffect(() => {
    if (!open) return;
    setExtraReason("");
    setSending(false);
    setSuccessMsg("");
    setErrorMsg("");
  }, [open]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const finalBody = useMemo(() => {
    const extra = extraReason.trim();
    if (!extra) return baseBody;

    return [baseBody, "", "Specific reason provided:", extra].join("\n");
  }, [baseBody, extraReason]);

  const handleSend = async () => {
    if (!request?.id) return;
    if (!toEmail) return;

    setSending(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await onSend?.({
      userId: request.id,
      to: toEmail,
      from: FROM_EMAIL,
      subject: "Account Registration Rejected",
      body: finalBody,
      extraReason: extraReason.trim(),
    });

    setSending(false);

    if (res?.error) {
      setErrorMsg(res.error.message || "Failed to send email.");
      return;
    }

    setSuccessMsg("Email sent.");
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] max-w-2xl rounded-3xl p-0 overflow-hidden">
        <div className="border-b bg-linear-to-b from-muted/60 to-background p-6">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-red-500/10">
                <MailX className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl tracking-tight">
                  Reject account and notify user
                </DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  This sends an email and schedules account deletion after 30
                  minutes.
                </p>
              </div>
            </div>
          </DialogHeader>

          {successMsg ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMsg}
            </div>
          ) : null}

          {errorMsg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}
        </div>

        <div className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">From</div>
              <Input value={FROM_EMAIL} disabled className="h-11 rounded-xl" />
            </div>

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">To</div>
              <Input value={toEmail} disabled className="h-11 rounded-xl" />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Default message</div>
            <Textarea
              value={baseBody}
              readOnly
              className="min-h-45 rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Add specific reason
            </div>
            <Textarea
              value={extraReason}
              onChange={(e) => setExtraReason(e.target.value)}
              placeholder="Type a specific reason for rejection..."
              className="min-h-27.5 rounded-2xl"
              disabled={sending}
            />
          </div>
        </div>

        <div className="border-t bg-background/80 p-6">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => onOpenChange?.(false)}
              disabled={sending}
            >
              Cancel
            </Button>

            <Button
              className="rounded-2xl bg-red-600 hover:bg-red-700"
              onClick={handleSend}
              disabled={sending || !request?.id || !toEmail}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className={sending ? "ml-2" : ""}>
                {sending ? "Sending" : "Send rejection email"}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
