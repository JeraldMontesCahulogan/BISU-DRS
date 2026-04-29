/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border bg-card/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
    </section>
  );
}

export function DataPrivacyNoticeEveryLoginModal() {
  const session = useAuthStore((s) => s.session);
  const loadingAuth = useAuthStore((s) => s.loadingAuth);
  const loadingProfile = useAuthStore((s) => s.loadingProfile);

  const [open, setOpen] = useState(false);
  const [lastUserId, setLastUserId] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (loadingAuth) return;

    const userId = session?.user?.id || null;

    if (userId && userId !== lastUserId && !loadingProfile) {
      setOpen(true);
      setScrolled(false);
    }

    if (!userId) setOpen(false);

    setLastUserId(userId);
  }, [session?.user?.id, loadingAuth, loadingProfile, lastUserId]);

  const close = () => setOpen(false);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (nearBottom) setScrolled(true);
  };

  const badgeText = useMemo(() => {
    if (!scrolled) return "Scroll to the end to enable Continue";
    return "You reached the end";
  }, [scrolled]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="w-[94vw] max-w-3xl overflow-hidden rounded-3xl p-0 shadow-2xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Data Privacy Notice</DialogTitle>
          <DialogDescription>
            Privacy notice of the Guidance Office of Bohol Island State
            University, Cogtong Candijay Campus.
          </DialogDescription>
        </DialogHeader>

        <div className="relative border-b bg-linear-to-b from-muted/60 to-background">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 text-left">
                <h2 className="text-xl font-semibold tracking-tight">
                  Data Privacy Notice
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Guidance Office Bohol Island State University, Cogtong
                  Candijay Campus
                </p>

                <div className="mt-3 inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                  {badgeText}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea
          className="h-[45vh] px-5 md:px-6 md:py-3"
          onScrollCapture={onScroll}
        >
          <div className="space-y-3">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                The Guidance Office of Bohol Island State University, Cogtong
                Candijay Campus (BISU-CCC) is dedicated to ensuring the
                confidentiality and privacy of personal data in accordance with
                the Data Privacy Act of 2012 (Republic Act No. 10173).
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Section title="Personal Information Gathered">
                The Guidance Office may gather personal information such as your
                name, student number, contact information, academic details, and
                other relevant data necessary for the provision of guidance and
                counseling services.
              </Section>

              <Section title="Purpose of Data Gathering">
                Personal data is gathered for the purpose of providing guidance
                and counseling services, processing student requests, keeping
                guidance records, developing students, and providing relevant
                academic and personal support services.
              </Section>

              <Section title="Use and Disclosure of Data">
                Personal information shall be used solely for legitimate
                guidance-related purposes and treated with utmost
                confidentiality. Data shall not be disclosed to unauthorized
                third parties, except as required by law or with the data
                subject’s consent. Anonymized survey responses will be used for
                system development and AI model training.
              </Section>

              <Section title="Data Storage and Security">
                Personal data is stored and protected using appropriate
                organizational, technical, and physical security measures to
                protect against unauthorized access, alteration, loss, or
                disclosure.
              </Section>

              <Section title="Data Retention and Disposal">
                Personal data shall be retained only as long as necessary for
                guidance and counseling purposes. Upon graduation, identifiable
                information shall be archived in accordance with University
                policies, while only anonymized data shall be retained. All
                records shall be disposed of in compliance with existing laws
                and regulations.
              </Section>

              <Section title="Data Subject Rights">
                You have the right to access, correct, object to the processing
                of, or request the deletion of your personal data, subject to
                existing laws, regulations, and institutional policies.
              </Section>
            </div>

            <Section title="Contact Information">
              For inquiries, concerns, or requests on your personal data, you
              may contact the Guidance Office of Bohol Island State University,
              Cogtong Candijay Campus.
            </Section>

            <div className="h-2" />
          </div>
        </ScrollArea>

        <div className="border-t bg-background/80 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              By continuing, you acknowledge you have read this notice.
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={close}
                disabled={!scrolled}
                title={!scrolled ? "Scroll to the end first" : "Continue"}
                className={`flex-1 items-center rounded-2xl py-4 ${
                  !scrolled ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// /* eslint-disable react-hooks/set-state-in-effect */
// import { useEffect, useMemo, useState } from "react";
// import { ShieldCheck } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Button } from "@/components/ui/button";
// import { useAuthStore } from "@/stores/authStore";

// function Section({ title, children }) {
//   return (
//     <section className="rounded-2xl border bg-card/50 p-4">
//       <div className="flex items-start justify-between gap-3">
//         <h3 className="text-sm font-semibold">{title}</h3>
//       </div>
//       <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
//     </section>
//   );
// }

// export function DataPrivacyNoticeEveryLoginModal() {
//   const session = useAuthStore((s) => s.session);
//   const loadingAuth = useAuthStore((s) => s.loadingAuth);
//   const loadingProfile = useAuthStore((s) => s.loadingProfile);

//   const [open, setOpen] = useState(false);
//   const [lastUserId, setLastUserId] = useState(null);
//   const [scrolled, setScrolled] = useState(false);

//   useEffect(() => {
//     if (loadingAuth) return;

//     const userId = session?.user?.id || null;

//     if (userId && userId !== lastUserId && !loadingProfile) {
//       setOpen(true);
//       setScrolled(false);
//     }

//     if (!userId) setOpen(false);

//     setLastUserId(userId);
//   }, [session?.user?.id, loadingAuth, loadingProfile, lastUserId]);

//   const close = () => setOpen(false);

//   const onScroll = (e) => {
//     const el = e.currentTarget;
//     const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
//     if (nearBottom) setScrolled(true);
//   };

//   const badgeText = useMemo(() => {
//     if (!scrolled) return "Scroll to the end to enable Continue";
//     return "You reached the end";
//   }, [scrolled]);

//   return (
//     <Dialog
//       open={open}
//       onOpenChange={() => {}}
//       className="relative z-50 backdrop-blur-sm"
//     >
//       <DialogContent
//         showCloseButton={false}
//         className="w-[94vw] max-w-3xl overflow-hidden rounded-3xl p-0 shadow-2xl "
//       >
//         <div className="relative border-b bg-linear-to-b from-muted/60 to-background">
//           <div className="p-6">
//             <DialogHeader>
//               <div className="flex items-start gap-3">
//                 <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-primary/10">
//                   <ShieldCheck className="h-5 w-5 text-primary" />
//                 </div>

//                 <div className="min-w-0 text-left">
//                   <DialogTitle className="text-xl tracking-tight">
//                     Data Privacy Notice
//                   </DialogTitle>
//                   <p className="mt-1 text-sm text-muted-foreground">
//                     Guidance Office Bohol Island State University, Cogtong
//                     Candijay Campus
//                   </p>

//                   <div className="mt-3 inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
//                     {badgeText}
//                   </div>
//                 </div>
//               </div>
//             </DialogHeader>
//           </div>
//         </div>

//         <ScrollArea
//           className="h-[45vh] px-5 md:px-6 md:py-3"
//           onScrollCapture={onScroll}
//         >
//           <div className="space-y-3 ">
//             <div className="rounded-2xl border bg-card p-4">
//               <p className="text-sm leading-6 text-muted-foreground">
//                 The Guidance Office of Bohol Island State University, Cogtong
//                 Candijay Campus (BISU-CCC) is dedicated to ensuring the
//                 confidentiality and privacy of personal data in accordance with
//                 the Data Privacy Act of 2012 (Republic Act No. 10173).
//               </p>
//             </div>

//             <div className="grid gap-3 sm:grid-cols-2">
//               <Section title="Personal Information Gathered">
//                 The Guidance Office may gather personal information such as your
//                 name, student number, contact information, academic details, and
//                 other relevant data necessary for the provision of guidance and
//                 counseling services.
//               </Section>

//               <Section title="Purpose of Data Gathering">
//                 Personal data is gathered for the purpose of providing guidance
//                 and counseling services, processing student requests, keeping
//                 guidance records, developing students, and providing relevant
//                 academic and personal support services.
//               </Section>

//               <Section title="Use and Disclosure of Data">
//                 Personal information shall be used solely for legitimate
//                 guidance-related purposes and treated with utmost
//                 confidentiality. Data shall not be disclosed to unauthorized
//                 third parties, except as required by law or with the data
//                 subject’s consent. Anonymized survey responses will be used for
//                 system development and AI model training.
//               </Section>

//               <Section title="Data Storage and Security">
//                 Personal data is stored and protected using appropriate
//                 organizational, technical, and physical security measures to
//                 protect against unauthorized access, alteration, loss, or
//                 disclosure.
//               </Section>

//               <Section title="Data Retention and Disposal">
//                 Personal data shall be retained only as long as necessary for
//                 guidance and counseling purposes. Upon graduation, identifiable
//                 information shall be archived in accordance with University
//                 policies, while only anonymized data shall be retained. All
//                 records shall be disposed of in compliance with existing laws
//                 and regulations.
//               </Section>

//               <Section title="Data Subject Rights">
//                 You have the right to access, correct, object to the processing
//                 of, or request the deletion of your personal data, subject to
//                 existing laws, regulations, and institutional policies.
//               </Section>
//             </div>

//             <Section title="Contact Information">
//               For inquiries, concerns, or requests on your personal data, you
//               may contact the Guidance Office of Bohol Island State University,
//               Cogtong Candijay Campus.
//             </Section>

//             <div className="h-2" />
//           </div>
//         </ScrollArea>

//         <div className="border-t bg-background/80 p-6">
//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//             <p className="text-xs text-muted-foreground">
//               By continuing, you acknowledge you have read this notice.
//             </p>

//             <div className="flex items-center justify-end gap-3">
//               <Button
//                 onClick={close}
//                 className="rounded-2xl"
//                 disabled={!scrolled}
//                 title={!scrolled ? "Scroll to the end first" : "Continue"}
//                 className={
//                   "flex-1 items-center rounded-2xl py-4" +
//                   (!scrolled ? "cursor-not-allowed opacity-50" : "")
//                 }
//               >
//                 Continue
//               </Button>
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
