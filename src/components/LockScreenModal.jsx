/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Lock, Loader2, LogOut, ShieldCheck } from "lucide-react";

export default function LockScreenModal({
  onUnlock,
  onLogout,
  verifyPin,
  loading,
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setPin("");
    setError("");
  }, []);

  const filled = pin.length === 4;

  const helper = useMemo(() => {
    if (error) return { tone: "bad", text: error };
    if (!filled) return { tone: "muted", text: "Enter your 4-digit PIN." };
    return { tone: "good", text: "Ready to unlock." };
  }, [error, filled]);

  const submit = async (e) => {
    e?.preventDefault?.();
    setError("");

    const clean = String(pin ?? "").trim();
    if (clean.length !== 4) {
      setError("Enter your 4-digit PIN.");
      return;
    }

    const ok = await verifyPin(clean);
    if (!ok) {
      setError("Wrong PIN.");
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 420);
      return;
    }

    onUnlock?.();
  };

  return (
    <Dialog open modal>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg w-[94vw] rounded-3xl p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* HEADER */}
        <div className="p-8 bg-linear-to-b from-muted/80 to-background border-b">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-2xl font-semibold tracking-tight">
                  Screen Locked
                </DialogTitle>

                <DialogDescription className="text-base text-muted-foreground mt-2">
                  Enter your 4-digit PIN to continue your session.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Session protection is active.</span>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={submit} className="px-8 space-y-6">
          <div className="flex justify-center">
            <div
              className={[
                "rounded-3xl border-2 bg-card/80 backdrop-blur-sm px-8 py-8",
                "shadow-lg",
                shake ? "animate-[shake_0.42s_ease-in-out]" : "",
              ].join(" ")}
            >
              <InputOTP
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  if (error) setError("");
                }}
                maxLength={4}
                pattern={REGEXP_ONLY_DIGITS}
                disabled={loading}
              >
                <InputOTPGroup className="gap-4">
                  <InputOTPSlot
                    index={0}
                    className="h-16 w-16 text-xl font-semibold rounded-2xl"
                  />
                  <InputOTPSlot
                    index={1}
                    className="h-16 w-16 text-xl font-semibold rounded-2xl"
                  />
                  <InputOTPSlot
                    index={2}
                    className="h-16 w-16 text-xl font-semibold rounded-2xl"
                  />
                  <InputOTPSlot
                    index={3}
                    className="h-16 w-16 text-xl font-semibold rounded-2xl"
                  />
                </InputOTPGroup>
              </InputOTP>

              <div
                className={[
                  "mt-4 text-sm text-center",
                  helper.tone === "bad"
                    ? "text-red-600"
                    : helper.tone === "good"
                      ? "text-emerald-700"
                      : "text-muted-foreground",
                ].join(" ")}
              >
                {helper.text}
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl px-5 py-2"
              onClick={onLogout}
              disabled={loading}
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Logout</span>
            </Button>

            <Button
              type="submit"
              className="rounded-2xl px-6 py-2"
              disabled={loading || !filled}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className={loading ? "ml-2" : ""}>
                {loading ? "Checking" : "Unlock"}
              </span>
            </Button>
          </div>

          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-6px); }
              40% { transform: translateX(6px); }
              60% { transform: translateX(-4px); }
              80% { transform: translateX(4px); }
            }
          `}</style>
        </form>
      </DialogContent>
    </Dialog>
  );
}
