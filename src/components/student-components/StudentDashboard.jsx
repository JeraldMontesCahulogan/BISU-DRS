// ------------------------------------------------------------------------------------------------------

// import {
//   Calendar,
//   Mail,
//   ChevronRight,
//   Send,
//   Clock,
//   Users,
//   Zap,
//   ArrowRight,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useEffect, useRef } from "react";
// import { useUserStore } from "@/stores/userStore";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Link, useNavigate } from "react-router-dom";
// import { SectionLoader } from "../SectionLoader";
// import { toast } from "sonner";
// import StudentHomePageSkeletal from "../skeletal/studentHomePageSkeletal";

// export default function StudentDashboard() {
//   const profile = useUserStore((s) => s.profile);
//   const profileLoading = useUserStore((s) => s.profileLoading);
//   const profileError = useUserStore((s) => s.profileError);

//   const schedule = useUserStore((s) => s.schedule);
//   const scheduleLoading = useUserStore((s) => s.scheduleLoading);
//   const scheduleError = useUserStore((s) => s.scheduleError);

//   const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);

//   const navigate = useNavigate();
//   const subscribedRef = useRef(false);

//   useEffect(() => {
//     if (subscribedRef.current) return;
//     subscribedRef.current = true;

//     const unsub = subscribeUserProfile();
//     return () => unsub?.();
//   }, [subscribeUserProfile]);

//   if (profileLoading && !profile) {
//     return <StudentHomePageSkeletal />;
//   }

//   if (profileError) {
//     return (
//       <div className="p-6 bg-white rounded-lg shadow-sm text-red-600">
//         {profileError}
//       </div>
//     );
//   }

//   function formatDate(value) {
//     if (!value) return "N/A";

//     try {
//       const date = new Date(value);

//       const formattedDate = date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//       });

//       const formattedTime = date.toLocaleTimeString("en-US", {
//         hour: "numeric",
//         minute: "2-digit",
//         hour12: true,
//       });

//       return `${formattedDate} · ${formattedTime}`;
//     } catch {
//       return value;
//     }
//   }

//   const statusId = profile?.approvalStatus_id ?? null;

//   const isPending = statusId === 1;
//   const isApproved = statusId === 2;
//   const isRejected = statusId === 3;

//   const takeSurvey = () => {
//     navigate("/student-portal/survey", { replace: true });
//   };

//   return (
//     <main className="min-h-screen bg-(--page-bg) text-(--text-primary) p-4 md:p-8">
//       <div className="max-w-6xl mx-auto space-y-8">
//         {/* Pending Notice Section */}
//         {isPending ? (
//           <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
//             Your account is under review. Survey access is disabled until
//             approval.
//           </div>
//         ) : null}

//         {isRejected ? (
//           <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded">
//             Your account was rejected. Please contact the Guidance Office.
//           </div>
//         ) : null}

//         {/* Hero Section */}
//         <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 md:p-12 shadow-lg">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
//             <div>
//               <div className="inline-block mb-4 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700">
//                 <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
//                   Welcome to BISU-DRS
//                 </span>
//               </div>

//               <h1 className="text-5xl font-black mb-4">
//                 Ready to <span className="text-(--accent-blue)">Succeed</span>?
//               </h1>

//               <p className="text-xl text-(--text-secondary) max-w-2xl">
//                 Complete your survey and access support tailored to your needs.
//               </p>
//             </div>

//             <div className="w-32 h-32 md:w-40 md:h-40 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold border-4 border-blue-300 dark:border-blue-700">
//               ✓
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-(--card-border)">
//             <InfoBlock
//               label="Program"
//               value={profile?.program?.program ?? "Not set"}
//             />
//             <InfoBlock
//               label="Year Level"
//               value={profile?.year?.year_level ?? "Not set"}
//             />
//             <div>
//               <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//                 Status
//               </p>

//               {isPending ? (
//                 <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 mt-1">
//                   <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
//                   <span className="font-bold text-yellow-700 dark:text-yellow-400">
//                     Pending
//                   </span>
//                 </span>
//               ) : isApproved ? (
//                 <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700 mt-1">
//                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
//                   <span className="font-bold text-green-700 dark:text-green-400">
//                     Approved
//                   </span>
//                 </span>
//               ) : (
//                 <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700 mt-1">
//                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
//                   <span className="font-bold text-red-700 dark:text-red-400">
//                     Rejected
//                   </span>
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Survey and Support */}
//         <div className="grid md:grid-cols-2 gap-8">
//           {/* Survey Card */}
//           {/* border-(--card-border) */}
//           <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg flex flex-col">
//             <div className="flex justify-between mb-6">
//               <div>
//                 <h2 className="text-2xl font-black mb-2">Survey Schedule</h2>
//                 <p
//                   className={
//                     schedule
//                       ? "text-green-600 dark:text-green-400 font-semibold text-sm"
//                       : "text-yellow-600 dark:text-yellow-400 font-semibold text-sm"
//                   }
//                 >
//                   {schedule ? "Active" : "No Schedule"}
//                 </p>
//               </div>
//               <div className="text-3xl">📊</div>
//             </div>

//             {scheduleError ? (
//               <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
//                 {scheduleError}
//               </p>
//             ) : scheduleLoading ? (
//               <div className="space-y-4 mb-6 ">
//                 <DateItem label="Starts" value="Loading..." />
//                 <DateItem label="Ends" value="Loading..." />
//               </div>
//             ) : schedule ? (
//               <div className="space-y-4 mb-6">
//                 <DateItem
//                   label="Starts"
//                   value={formatDate(schedule.start_at)}
//                 />
//                 <DateItem label="Ends" value={formatDate(schedule.end_at)} />
//               </div>
//             ) : (
//               <p className="text-muted-foreground h-35 flex items-center justify-center text-center px-4 text-semibold">
//                 No active survey for your program and year level.
//               </p>
//             )}

//             <Button
//               disabled={isPending || !schedule}
//               className={
//                 isPending || !schedule
//                   ? "w-full bg-gray-400 hover:bg-gray-400 text-white py-5 rounded-xl flex items-center justify-center gap-2 mt-auto cursor-not-allowed"
//                   : "w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl flex items-center justify-center gap-2 mt-auto cursor-pointer"
//               }
//               onClick={takeSurvey}
//             >
//               <Zap className="w-5 h-5" />
//               Take Survey
//               <ChevronRight className="w-5 h-5" />
//             </Button>
//           </div>

//           {/* Support Card */}
//           <div className="rounded-3xl border border-accent-foreground/15 px-8 py-6 shadow-lg">
//             <h2 className="text-2xl font-black mb-4">Get Support</h2>

//             <div className="space-y-3">
//               <Link to="/student-portal/chat" className="block">
//                 <SupportButton
//                   icon="💬"
//                   title="Message Us"
//                   desc="Chat with our team"
//                 />
//               </Link>
//               <SupportButton
//                 icon="📍"
//                 title="Visit Us"
//                 desc="Come by our office"
//                 onClick={() =>
//                   toast.warning("This feature is not available yet.")
//                 }
//               />
//               <SupportButton
//                 icon="✉️"
//                 title="Email Us"
//                 desc="guidance@bisu.edu.ph"
//                 onClick={() =>
//                   toast.warning("This feature is not available yet.")
//                 }
//               />
//             </div>
//           </div>
//         </div>

//         {/* Office and Feedback */}
//         <div className="grid md:grid-cols-2 gap-8">
//           <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg">
//             <h2 className="text-3xl font-black mb-6">Office Info</h2>

//             <OfficeItem
//               icon={<Mail />}
//               label="Email"
//               value="guidance@bisu.edu.ph"
//             />
//             <OfficeItem
//               icon={<Clock />}
//               label="Hours"
//               value="Mon–Fri, 8 AM–5 PM"
//             />
//             <OfficeItem
//               icon={<Users />}
//               label="Support"
//               value="In-office & Chat"
//             />
//           </div>
//           <LatestSubmissionCard />
//         </div>

//         {/* Info Banner */}
//         <div className="bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-6">
//           <div>
//             <h3 className="text-2xl font-black mb-2">Did You Know?</h3>
//             <p>
//               Completing your survey helps us understand your needs and provide
//               better support.
//             </p>
//           </div>
//           <Button
//             className="bg-amber-900 text-white hover:bg-amber-800 px-6 py-4 rounded-xl flex items-center gap-2"
//             onClick={() => toast.warning("This feature is not available yet.")}
//           >
//             Learn More <ArrowRight className="w-5 h-5" />
//           </Button>
//         </div>
//       </div>
//     </main>
//   );
// }

// /* Reusable Components */

// function InfoBlock({ label, value }) {
//   return (
//     <div>
//       <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//         {label}
//       </p>
//       <p className="text-2xl font-bold">{value}</p>
//     </div>
//   );
// }

// function DateItem({ label, value }) {
//   return (
//     <div className="flex items-center gap-3">
//       <Calendar className="w-5 h-5 text-blue-600" />
//       <div>
//         <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//           {label}
//         </p>
//         <p className="font-semibold">{value}</p>
//       </div>
//     </div>
//   );
// }

// function SupportButton({ icon, title, desc, onClick }) {
//   return (
//     <button
//       onClick={onClick}
//       className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-gray-100 dark:bg-slate-700 text-left flex items-center gap-4 hover:border-gray-400"
//     >
//       <div className="text-2xl">{icon}</div>
//       <div>
//         <p className="font-semibold">{title}</p>
//         <p className="text-xs text-(--text-secondary)">{desc}</p>
//       </div>
//       <ChevronRight className="ml-auto w-4 h-4" />
//     </button>
//   );
// }

// function OfficeItem({ icon, label, value }) {
//   return (
//     <div className="flex items-center gap-4 mb-5">
//       <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950">{icon}</div>
//       <div>
//         <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//           {label}
//         </p>
//         <p className="font-semibold">{value}</p>
//       </div>
//     </div>
//   );
// }

// function LatestSubmissionCard() {
//   // dummy data
//   const submission = {
//     hasSubmitted: true,
//     submittedAt: "2026-02-09T09:04:00",
//     surveyStart: "2026-02-01T08:00:00",
//     surveyEnd: "2026-02-15T17:00:00",
//   };

//   function formatDate(value) {
//     if (!value) return "N/A";

//     const date = new Date(value);

//     const formattedDate = date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });

//     const formattedTime = date.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });

//     return `${formattedDate} · ${formattedTime}`;
//   }

//   return (
//     <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg">
//       <h2 className="text-2xl font-black mb-6">Latest Survey Submission</h2>

//       <div className="space-y-4">
//         <div>
//           <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//             Survey Period
//           </p>
//           <p className="font-semibold">
//             {formatDate(submission.surveyStart)} –{" "}
//             {formatDate(submission.surveyEnd)}
//           </p>
//         </div>

//         {submission.hasSubmitted && (
//           <div>
//             <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//               Submitted At
//             </p>
//             <p className="font-semibold">
//               {formatDate(submission.submittedAt)}
//             </p>
//           </div>
//         )}

//         <div className="mt-4 p-4 bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-xl text-sm font-semibold text-green-700 dark:text-green-300">
//           {submission.hasSubmitted
//             ? "Your response has been successfully recorded."
//             : "You have not completed the current survey."}
//         </div>
//       </div>
//     </div>
//   );
// }

// ------------------------------------------------------------------------------------------------------------

// import {
//   Calendar,
//   Mail,
//   ChevronRight,
//   Send,
//   Clock,
//   Users,
//   Zap,
//   ArrowRight,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useEffect, useRef } from "react";
// import { useUserStore } from "@/stores/userStore";
// import { Link, useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import StudentHomePageSkeletal from "../skeletal/studentHomePageSkeletal";

// export default function StudentDashboard() {
//   const profile = useUserStore((s) => s.profile);
//   const profileLoading = useUserStore((s) => s.profileLoading);
//   const profileError = useUserStore((s) => s.profileError);

//   const schedule = useUserStore((s) => s.schedule);
//   const scheduleLoading = useUserStore((s) => s.scheduleLoading);
//   const scheduleError = useUserStore((s) => s.scheduleError);

//   const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);

//   const navigate = useNavigate();
//   const subscribedRef = useRef(false);

//   useEffect(() => {
//     if (subscribedRef.current) return;
//     subscribedRef.current = true;

//     const unsub = subscribeUserProfile();
//     return () => unsub?.();
//   }, [subscribeUserProfile]);

//   if (profileLoading && !profile) {
//     return (
//       <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
//         <StudentHomePageSkeletal />
//       </div>
//     );
//   }

//   if (profileError) {
//     return (
//       <div className="flex-1 min-h-0 overflow-y-auto p-6">
//         <div className="p-6 bg-white rounded-lg shadow-sm text-red-600">
//           {profileError}
//         </div>
//       </div>
//     );
//   }

//   function formatDate(value) {
//     if (!value) return "N/A";
//     try {
//       const date = new Date(value);
//       const formattedDate = date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//       });
//       const formattedTime = date.toLocaleTimeString("en-US", {
//         hour: "numeric",
//         minute: "2-digit",
//         hour12: true,
//       });
//       return `${formattedDate} · ${formattedTime}`;
//     } catch {
//       return value;
//     }
//   }

//   const statusId = profile?.approvalStatus_id ?? null;
//   const isPending = statusId === 1;
//   const isApproved = statusId === 2;
//   const isRejected = statusId === 3;

//   const takeSurvey = () => {
//     navigate("/student-portal/survey", { replace: true });
//   };

//   return (
//     // ✅ THIS makes the dashboard itself scrollable
//     <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
//       <div className="bg-(--page-bg) text-(--text-primary) p-4 md:p-8">
//         <div className="max-w-6xl mx-auto space-y-8">
//           {/* Pending Notice Section */}
//           {isPending ? (
//             <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
//               Your account is under review. Survey access is disabled until
//               approval.
//             </div>
//           ) : null}

//           {isRejected ? (
//             <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded">
//               Your account was rejected. Please contact the Guidance Office.
//             </div>
//           ) : null}

//           {/* Hero Section */}
//           <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 md:p-12 shadow-lg">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
//               <div>
//                 <div className="inline-block mb-4 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700">
//                   <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
//                     Welcome to BISU-Depression Risk System
//                   </span>
//                 </div>

//                 <h1 className="text-5xl font-black mb-4">
//                   Ready to <span className="text-(--accent-blue)">Succeed</span>
//                   ?
//                 </h1>

//                 <p className="text-xl text-(--text-secondary) max-w-2xl">
//                   Complete your survey and access support tailored to your
//                   needs.
//                 </p>
//               </div>

//               <div className="w-32 h-32 md:w-40 md:h-40 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold border-4 border-blue-300 dark:border-blue-700">
//                 ✓
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-(--card-border)">
//               <InfoBlock
//                 label="Program"
//                 value={profile?.program?.program ?? "Not set"}
//               />
//               <InfoBlock
//                 label="Year Level"
//                 value={profile?.year?.year_level ?? "Not set"}
//               />
//               <div>
//                 <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//                   Status
//                 </p>

//                 {isPending ? (
//                   <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 mt-1">
//                     <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
//                     <span className="font-bold text-yellow-700 dark:text-yellow-400">
//                       Pending
//                     </span>
//                   </span>
//                 ) : isApproved ? (
//                   <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700 mt-1">
//                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
//                     <span className="font-bold text-green-700 dark:text-green-400">
//                       Approved
//                     </span>
//                   </span>
//                 ) : (
//                   <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700 mt-1">
//                     <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
//                     <span className="font-bold text-red-700 dark:text-red-400">
//                       Rejected
//                     </span>
//                   </span>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Survey and Support */}
//           <div className="grid md:grid-cols-2 gap-8">
//             {/* Survey Card */}
//             {/* border-(--card-border) */}
//             <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg flex flex-col">
//               <div className="flex justify-between mb-6">
//                 <div>
//                   <h2 className="text-2xl font-black mb-2">Survey Schedule</h2>
//                   <p
//                     className={
//                       schedule
//                         ? "text-green-600 dark:text-green-400 font-semibold text-sm"
//                         : "text-yellow-600 dark:text-yellow-400 font-semibold text-sm"
//                     }
//                   >
//                     {schedule ? "Active" : "No Schedule"}
//                   </p>
//                 </div>
//                 <div className="text-3xl">📊</div>
//               </div>

//               {scheduleError ? (
//                 <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
//                   {scheduleError}
//                 </p>
//               ) : scheduleLoading ? (
//                 <div className="space-y-4 mb-6 ">
//                   <DateItem label="Starts" value="Loading..." />
//                   <DateItem label="Ends" value="Loading..." />
//                 </div>
//               ) : schedule ? (
//                 <div className="space-y-4 mb-6">
//                   <DateItem
//                     label="Starts"
//                     value={formatDate(schedule.start_at)}
//                   />
//                   <DateItem label="Ends" value={formatDate(schedule.end_at)} />
//                 </div>
//               ) : (
//                 <p className="text-muted-foreground h-35 flex items-center justify-center text-center px-4 text-semibold">
//                   No active survey for your program and year level.
//                 </p>
//               )}

//               <Button
//                 disabled={isPending || !schedule}
//                 className={
//                   isPending || !schedule
//                     ? "w-full bg-gray-400 hover:bg-gray-400 text-white py-5 rounded-xl flex items-center justify-center gap-2 mt-auto cursor-not-allowed"
//                     : "w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl flex items-center justify-center gap-2 mt-auto cursor-pointer"
//                 }
//                 onClick={takeSurvey}
//               >
//                 <Zap className="w-5 h-5" />
//                 Take Survey
//                 <ChevronRight className="w-5 h-5" />
//               </Button>
//             </div>

//             {/* Support Card */}
//             <div className="rounded-3xl border border-accent-foreground/15 px-8 py-6 shadow-lg">
//               <h2 className="text-2xl font-black mb-4">Get Support</h2>

//               <div className="space-y-3">
//                 <Link to="/student-portal/chat" className="block">
//                   <SupportButton
//                     icon="💬"
//                     title="Message Us"
//                     desc="Chat with our team"
//                   />
//                 </Link>
//                 <SupportButton
//                   icon="📍"
//                   title="Visit Us"
//                   desc="Come by our office"
//                   onClick={() =>
//                     toast.warning("This feature is not available yet.")
//                   }
//                 />
//                 <SupportButton
//                   icon="✉️"
//                   title="Email Us"
//                   desc="guidance@bisu.edu.ph"
//                   onClick={() =>
//                     toast.warning("This feature is not available yet.")
//                   }
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Office and Feedback */}
//           <div className="grid md:grid-cols-2 gap-8">
//             <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg">
//               <h2 className="text-3xl font-black mb-6">Office Info</h2>

//               <OfficeItem
//                 icon={<Mail />}
//                 label="Email"
//                 value="guidance@bisu.edu.ph"
//               />
//               <OfficeItem
//                 icon={<Clock />}
//                 label="Hours"
//                 value="Mon–Fri, 8 AM–5 PM"
//               />
//               <OfficeItem
//                 icon={<Users />}
//                 label="Support"
//                 value="In-office & Chat"
//               />
//             </div>
//             <LatestSubmissionCard />
//           </div>

//           {/* Info Banner */}
//           <div className="bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-6">
//             <div>
//               <h3 className="text-2xl font-black mb-2">Did You Know?</h3>
//               <p>
//                 Completing your survey helps us understand your needs and
//                 provide better support.
//               </p>
//             </div>
//             <Button
//               className="bg-amber-900 text-white hover:bg-amber-800 px-6 py-4 rounded-xl flex items-center gap-2"
//               onClick={() =>
//                 toast.warning("This feature is not available yet.")
//               }
//             >
//               Learn More <ArrowRight className="w-5 h-5" />
//             </Button>
//           </div>

//           {/* ... KEEP THE REST OF YOUR DASHBOARD EXACTLY THE SAME ... */}
//           {/* Survey and Support */}
//           {/* Office and Feedback */}
//           {/* Info Banner */}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* Reusable Components */
// function InfoBlock({ label, value }) {
//   return (
//     <div>
//       <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//         {label}
//       </p>
//       <p className="text-2xl font-bold">{value}</p>
//     </div>
//   );
// }

// function DateItem({ label, value }) {
//   return (
//     <div className="flex items-center gap-3">
//       <Calendar className="w-5 h-5 text-blue-600" />
//       <div>
//         <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//           {label}
//         </p>
//         <p className="font-semibold">{value}</p>
//       </div>
//     </div>
//   );
// }

// function SupportButton({ icon, title, desc, onClick }) {
//   return (
//     <button
//       onClick={onClick}
//       className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-gray-100 dark:bg-slate-700 text-left flex items-center gap-4 hover:border-gray-400"
//     >
//       <div className="text-2xl">{icon}</div>
//       <div>
//         <p className="font-semibold">{title}</p>
//         <p className="text-xs text-(--text-secondary)">{desc}</p>
//       </div>
//       <ChevronRight className="ml-auto w-4 h-4" />
//     </button>
//   );
// }

// function OfficeItem({ icon, label, value }) {
//   return (
//     <div className="flex items-center gap-4 mb-5">
//       <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950">{icon}</div>
//       <div>
//         <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//           {label}
//         </p>
//         <p className="font-semibold">{value}</p>
//       </div>
//     </div>
//   );
// }

// function LatestSubmissionCard() {
//   // dummy data
//   const submission = {
//     hasSubmitted: true,
//     submittedAt: "2026-02-09T09:04:00",
//     surveyStart: "2026-02-01T08:00:00",
//     surveyEnd: "2026-02-15T17:00:00",
//   };

//   function formatDate(value) {
//     if (!value) return "N/A";

//     const date = new Date(value);

//     const formattedDate = date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });

//     const formattedTime = date.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });

//     return `${formattedDate} · ${formattedTime}`;
//   }

//   return (
//     <div className="bg-(--card-bg) rounded-3xl border border-accent-foreground/15 p-8 shadow-lg">
//       <h2 className="text-2xl font-black mb-6">Latest Survey Submission</h2>

//       <div className="space-y-4">
//         <div>
//           <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//             Survey Period
//           </p>
//           <p className="font-semibold">
//             {formatDate(submission.surveyStart)} –{" "}
//             {formatDate(submission.surveyEnd)}
//           </p>
//         </div>

//         {submission.hasSubmitted && (
//           <div>
//             <p className="text-xs uppercase font-semibold text-(--text-secondary)">
//               Submitted At
//             </p>
//             <p className="font-semibold">
//               {formatDate(submission.submittedAt)}
//             </p>
//           </div>
//         )}

//         <div className="mt-4 p-4 bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-xl text-sm font-semibold text-green-700 dark:text-green-300">
//           {submission.hasSubmitted
//             ? "Your response has been successfully recorded."
//             : "You have not completed the current survey."}
//         </div>
//       </div>
//     </div>
//   );
// }

import {
  Calendar,
  Mail,
  ChevronRight,
  Clock,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import StudentHomePageSkeletal from "../skeletal/studentHomePageSkeletal";

export default function StudentDashboard() {
  const profile = useUserStore((s) => s.profile);
  const profileLoading = useUserStore((s) => s.profileLoading);
  const profileError = useUserStore((s) => s.profileError);

  const schedule = useUserStore((s) => s.schedule);
  const scheduleLoading = useUserStore((s) => s.scheduleLoading);
  const scheduleError = useUserStore((s) => s.scheduleError);

  const subscribeUserProfile = useUserStore((s) => s.subscribeUserProfile);

  const navigate = useNavigate();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsub = subscribeUserProfile();
    return () => unsub?.();
  }, [subscribeUserProfile]);

  if (profileLoading && !profile) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <StudentHomePageSkeletal />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-4 sm:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {profileError}
        </div>
      </div>
    );
  }

  function formatDate(value) {
    if (!value) return "N/A";
    try {
      const date = new Date(value);

      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      return `${formattedDate} · ${formattedTime}`;
    } catch {
      return String(value);
    }
  }

  const statusId = profile?.approvalStatus_id ?? null;
  const isPending = statusId === 1;
  const isApproved = statusId === 2;
  const isRejected = statusId === 3;

  const takeSurvey = () => {
    navigate("/student-portal/survey", { replace: true });
  };

  const programLabel = profile?.program?.program ?? "Not set";
  const yearLabel = profile?.year?.year_level ?? "Not set";

  return (
    // ✅ keep this as your scroll container (StudentPage keeps overflow-hidden)
    <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
      <div className="bg-(--page-bg) text-(--text-primary) px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
          {/* Notices */}
          {isPending ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
              <p className="text-sm font-semibold">
                Your account is under review. Survey access is disabled until
                approval.
              </p>
            </div>
          ) : null}

          {isRejected ? (
            <div className="rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-red-900 dark:border-red-700 dark:bg-red-950/60 dark:text-red-200">
              <p className="text-sm font-semibold">
                Your account was rejected. Please contact the Guidance Office.
              </p>
            </div>
          ) : null}

          {/* HERO (keeps the same “desktop look” even on mobile) */}
          <div className="rounded-3xl border border-accent-foreground/15 bg-(--card-bg) p-5 shadow-lg sm:p-7 lg:p-10">
            <div className="flex items-center justify-between gap-4 sm:gap-6">
              {/* Left */}
              <div className="min-w-0">
                <div className="mb-3 inline-flex max-w-full items-center rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 sm:px-4 sm:py-2 sm:text-sm">
                  <span className="truncate">
                    Welcome to BISU-Depression Risk System
                  </span>
                </div>

                <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  Ready to <span className="text-(--accent-blue)">Succeed</span>
                  ?
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-(--text-secondary) sm:text-base lg:text-xl">
                  Complete your survey and access support tailored to your
                  needs.
                </p>
              </div>

              {/* Right check (always visible, like your screenshot) */}
              <div className="shrink-0">
                <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-blue-300 bg-blue-100 text-2xl font-black dark:border-blue-700 dark:bg-blue-950 sm:h-28 sm:w-28 sm:text-4xl lg:h-36 lg:w-36 lg:text-5xl">
                  ✓
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-(--card-border) pt-5 sm:mt-7 sm:pt-7">
              {/* Keep 3 columns even on mobile (same layout) */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <InfoBlock label="Program" value={programLabel} />
                <InfoBlock label="Year Level" value={yearLabel} />
                <StatusBlock
                  isPending={isPending}
                  isApproved={isApproved}
                  isRejected={isRejected}
                />
              </div>
            </div>
          </div>

          {/* Survey + Support (keep 2 columns even on mobile like screenshot) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Survey Card */}
            <div className="rounded-3xl border border-accent-foreground/15 bg-(--card-bg) p-4 shadow-lg sm:p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-black sm:text-xl lg:text-2xl">
                    Survey Schedule
                  </h2>
                  <p
                    className={[
                      "mt-1 text-xs font-semibold sm:text-sm",
                      schedule
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400",
                    ].join(" ")}
                  >
                    {schedule ? "Active" : "No Schedule"}
                  </p>
                </div>
                <div className="text-2xl sm:text-3xl" aria-hidden="true">
                  📊
                </div>
              </div>

              <div className="mt-4">
                {scheduleError ? (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 sm:text-sm">
                    {scheduleError}
                  </p>
                ) : scheduleLoading ? (
                  <div className="space-y-3">
                    <DateItem label="Starts" value="Loading..." />
                    <DateItem label="Ends" value="Loading..." />
                  </div>
                ) : schedule ? (
                  <div className="space-y-3">
                    <DateItem
                      label="Starts"
                      value={formatDate(schedule.start_at)}
                    />
                    <DateItem
                      label="Ends"
                      value={formatDate(schedule.end_at)}
                    />
                  </div>
                ) : (
                  <div className="grid min-h-23 place-items-center px-2 text-center">
                    <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
                      No active survey for your program and year level.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 sm:mt-6">
                <Button
                  disabled={isPending || !schedule}
                  onClick={takeSurvey}
                  className={[
                    "w-full rounded-xl py-5 text-xs font-bold sm:text-sm",
                    "flex items-center justify-center gap-2",
                    isPending || !schedule
                      ? "cursor-not-allowed bg-gray-400 hover:bg-gray-400 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white",
                  ].join(" ")}
                >
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                  Take Survey
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>

            {/* Support Card */}
            <div className="rounded-3xl border border-accent-foreground/15 bg-(--card-bg) p-4 shadow-lg sm:p-6 lg:p-8">
              <h2 className="text-lg font-black sm:text-xl lg:text-2xl">
                Get Support
              </h2>

              <div className="mt-4 space-y-3">
                <Link to="/student-portal/chat" className="block">
                  <SupportButton
                    icon="💬"
                    title="Message Us"
                    desc="Chat with our team"
                  />
                </Link>

                <SupportButton
                  icon="📍"
                  title="Visit Us"
                  desc="Come by our office"
                  onClick={() =>
                    toast.warning("This feature is not available yet.")
                  }
                />

                <SupportButton
                  icon="✉️"
                  title="Email Us"
                  desc="guidance@bisu.edu.ph"
                  onClick={() =>
                    toast.warning("This feature is not available yet.")
                  }
                />
              </div>
            </div>
          </div>

          {/* Office + Latest (keep 2 columns even on mobile like screenshot) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div className="rounded-3xl border border-accent-foreground/15 bg-(--card-bg) p-4 shadow-lg sm:p-6 lg:p-8">
              <h2 className="text-xl font-black sm:text-2xl lg:text-3xl">
                Office Info
              </h2>

              <div className="mt-5 space-y-4 sm:mt-6">
                <OfficeItem
                  icon={<Mail className="h-5 w-5 text-foreground" />}
                  label="Email"
                  value="guidance@bisu.edu.ph"
                />
                <OfficeItem
                  icon={<Clock className="h-5 w-5 text-foreground" />}
                  label="Hours"
                  value="Mon–Fri, 8 AM–5 PM"
                />
                <OfficeItem
                  icon={<Users className="h-5 w-5 text-foreground" />}
                  label="Support"
                  value="In-office & Chat"
                />
              </div>
            </div>

            <LatestSubmissionCard />
          </div>

          {/* Info Banner */}
          <div className="rounded-3xl border border-amber-300 bg-amber-100 p-5 shadow-lg dark:border-amber-700 dark:bg-amber-950 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h3 className="text-xl font-black sm:text-2xl">
                  Did You Know?
                </h3>
                <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-100/90 sm:text-base">
                  Completing your survey helps us understand your needs and
                  provide better support.
                </p>
              </div>

              <Button
                className="w-full rounded-xl bg-amber-900 px-6 py-4 text-white hover:bg-amber-800 sm:w-auto"
                onClick={() =>
                  toast.warning("This feature is not available yet.")
                }
              >
                Learn More <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}

/* ========================= */
/* Reusable Components (FULL) */
/* ========================= */

function InfoBlock({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-(--text-secondary) sm:text-xs">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-extrabold sm:text-xl lg:text-2xl">
        {value}
      </p>
    </div>
  );
}

function StatusBlock({ isPending, isApproved, isRejected }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-(--text-secondary) sm:text-xs">
        Status
      </p>

      <div className="mt-1">
        {isPending ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-100 px-2 py-1 text-[11px] font-bold text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 sm:px-3 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            Pending
          </span>
        ) : isApproved ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-green-100 px-2 py-1 text-[11px] font-bold text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300 sm:px-3 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Approved
          </span>
        ) : isRejected ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-1 text-[11px] font-bold text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300 sm:px-3 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Rejected
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground sm:px-3 sm:text-sm">
            Unknown
          </span>
        )}
      </div>
    </div>
  );
}

function DateItem({ label, value }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 dark:bg-blue-950 sm:h-10 sm:w-10">
        <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-300 sm:h-5 sm:w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-(--text-secondary) sm:text-xs">
          {label}
        </p>
        <p className="truncate text-xs font-semibold sm:text-sm">{value}</p>
      </div>
    </div>
  );
}

function SupportButton({ icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={[
        "w-full rounded-2xl border border-foreground/10",
        "bg-gray-100 dark:bg-slate-700/70",
        "px-4 py-3 text-left",
        "flex items-center gap-3 sm:gap-4",
        "transition hover:border-foreground/30 active:scale-[0.99]",
      ].join(" ")}
    >
      <div className="text-xl sm:text-2xl">{icon}</div>

      <div className="min-w-0">
        <p className="truncate text-xs font-bold sm:text-sm">{title}</p>
        <p className="truncate text-[11px] text-(--text-secondary) sm:text-xs">
          {desc}
        </p>
      </div>

      <ChevronRight className="ml-auto h-4 w-4 opacity-80" />
    </button>
  );
}

function OfficeItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 dark:bg-blue-950 sm:h-12 sm:w-12">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-(--text-secondary) sm:text-xs">
          {label}
        </p>
        <p className="truncate text-xs font-semibold sm:text-sm">{value}</p>
      </div>
    </div>
  );
}

function LatestSubmissionCard() {
  // dummy data (replace later with real)
  const submission = {
    hasSubmitted: true,
    submittedAt: "2026-02-09T09:04:00",
    surveyStart: "2026-02-01T08:00:00",
    surveyEnd: "2026-02-15T17:00:00",
  };

  function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${formattedDate} · ${formattedTime}`;
  }

  const underDevelopment = true;

  if (underDevelopment) {
    return (
      <div className="rounded-3xl border border-accent-foreground/15 bg-(--card-bg) p-4 shadow-lg sm:p-6 lg:p-8">
        <h2 className="text-lg font-black sm:text-xl lg:text-2xl">
          Latest Survey Submission
        </h2>

        <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground sm:text-sm">
          Survey submission details are not available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-accent-foreground/15 bg-(--card-bg) p-4 shadow-lg sm:p-6 lg:p-8">
      <h2 className="text-lg font-black sm:text-xl lg:text-2xl">
        Latest Survey Submission
      </h2>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-(--text-secondary) sm:text-xs">
            Survey Period
          </p>
          <p className="mt-1 text-xs font-semibold sm:text-sm">
            {formatDate(submission.surveyStart)} –{" "}
            {formatDate(submission.surveyEnd)}
          </p>
        </div>

        {submission.hasSubmitted ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-(--text-secondary) sm:text-xs">
              Submitted At
            </p>
            <p className="mt-1 text-xs font-semibold sm:text-sm">
              {formatDate(submission.submittedAt)}
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-green-300 bg-green-100 p-4 text-xs font-semibold text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300 sm:text-sm">
          {submission.hasSubmitted
            ? "Your response has been successfully recorded."
            : "You have not completed the current survey."}
        </div>
      </div>
    </div>
  );
}
