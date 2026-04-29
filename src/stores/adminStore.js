// src/stores/adminStore.js
/* eslint-disable no-empty */
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { decryptUserRows } from "@/lib/userCrypto";
import { useAuthStore } from "@/stores/authStore";

const PENDING_ID = 1;
const APPROVED_ID = 2;
const REJECTED_ID = 3;

const NOT_APPLICABLE_YEARLEVEL_ID = 5;

const ROLE_STUDENT_ID = 2;
const ROLE_STAFF_ID = 3;
const ROLE_CHAIRPERSON_ID = 4;

const SEEN_PENDING_KEY = "admin_seen_pending_created_at";
const SEEN_ROLE_KEY = "admin_seen_role_created_at";

function readSeen(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeSeen(key, value) {
  try {
    localStorage.setItem(key, value || "");
  } catch {}
}

function maxCreatedAt(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  let max = "";
  for (const r of rows) {
    const v = r?.created_at ? String(r.created_at) : "";
    if (v && (!max || v > max)) max = v;
  }
  return max;
}

export const useAdminStore = create((set, get) => ({
  approvedUsers: [],
  approvedLoading: false,
  approvedError: null,

  _approvedChannel: null,
  _approvedSubscribing: false,

  pendingUsers: [],
  pendingLoading: false,
  pendingError: null,

  rejectedUsers: [],
  rejectedLoading: false,
  rejectedError: null,

  actionBusyId: null,
  actionError: null,

  _pendingChannel: null,
  _pendingSubscribing: false,

  _rejectedChannel: null,
  _rejectedSubscribing: false,

  departments: [],
  programs: [],
  deptLoading: false,
  progLoading: false,

  yearLevels: [],

  schedules: [],
  schedulesLoading: false,
  schedulesError: null,

  _schedulesChannel: null,
  _schedulesSubscribing: false,

  roleUsers: [],
  roleUsersLoading: false,
  roleUsersError: null,

  roleActionBusyId: null,
  roleActionError: null,

  _roleChannel: null,
  _roleSubscribing: false,

  pendingLatestCreatedAt: "",
  pendingHasNew: false,
  pendingSeenCreatedAt: readSeen(SEEN_PENDING_KEY),

  roleLatestCreatedAt: "",
  roleHasNew: false,
  roleSeenCreatedAt: readSeen(SEEN_ROLE_KEY),

  pinExists: null,
  pinLoading: false,
  pinError: null,

  pendingOpen: false,
  setPendingOpen: (open) => set({ pendingOpen: !!open }),

  roleOpen: false,
  setRoleOpen: (open) => set({ roleOpen: !!open }),

  markPendingSeen: async () => {
    if (!get().pendingLatestCreatedAt) {
      await get().fetchPendingApprovals();
    }

    const latest = get().pendingLatestCreatedAt || "";
    set({ pendingHasNew: false, pendingSeenCreatedAt: latest });
    writeSeen(SEEN_PENDING_KEY, latest);
  },

  markRoleSeen: async () => {
    if (!get().roleLatestCreatedAt) {
      await get().fetchRoleCandidates();
    }

    const latest = get().roleLatestCreatedAt || "";
    set({ roleHasNew: false, roleSeenCreatedAt: latest });
    writeSeen(SEEN_ROLE_KEY, latest);
  },

  fetchPendingApprovals: async () => {
    // set({ pendingLoading: true, pendingError: null });
    set({
      pendingLoading: (get().pendingUsers?.length ?? 0) === 0,
      pendingError: null,
    });

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        user_id,
        email,
        student_id,
        approvalStatus_id,
        created_at,
        approval_status:approval_status!users_approvalStatus_id_fkey (
          approval_status
        ),
        program:programs (
          program_id,
          program,
          department:departments (
            department_id,
            code
          )
        ),
        year:year_level (
          yearLevel_id,
          year_level
        )
      `,
      )
      .eq("approvalStatus_id", PENDING_ID)
      .order("created_at", { ascending: false });

    if (error) {
      set({
        pendingUsers: [],
        pendingLoading: false,
        pendingError: error.message,
      });
      return { error };
    }

    const rows = await decryptUserRows(data ?? []);
    const latestAt = maxCreatedAt(rows);
    const seenAt = get().pendingSeenCreatedAt || "";
    const hasNew = latestAt && (!seenAt || latestAt > seenAt);

    set({
      pendingUsers: rows,
      pendingLoading: false,
      pendingError: null,
      pendingLatestCreatedAt: latestAt,
      pendingHasNew: !!hasNew,
    });

    return { error: null, data: rows };
  },

  fetchRejectedApprovals: async () => {
    // set({ rejectedLoading: true, rejectedError: null });
    set({
      rejectedLoading: (get().rejectedUsers?.length ?? 0) === 0,
      rejectedError: null,
    });

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        user_id,
        email,
        student_id,
        approvalStatus_id,
        created_at,
        approval_status:approval_status!users_approvalStatus_id_fkey (
          approval_status
        ),
        program:programs (
          program_id,
          program,
          department:departments (
            department_id,
            code
          )
        ),
        year:year_level (
          yearLevel_id,
          year_level
        )
      `,
      )
      .eq("approvalStatus_id", REJECTED_ID)
      .order("created_at", { ascending: false });

    if (error) {
      set({
        rejectedUsers: [],
        rejectedLoading: false,
        rejectedError: error.message,
      });
      return { error };
    }

    const rows = await decryptUserRows(data ?? []);

    set({
      rejectedUsers: rows,
      rejectedLoading: false,
      rejectedError: null,
    });

    return { error: null, data: rows };
  },

  approveUser: async (userId) => {
    set({ actionBusyId: userId, actionError: null });

    const { error } = await supabase
      .from("profiles")
      .update({ approvalStatus_id: APPROVED_ID })
      .eq("user_id", userId);

    if (error) {
      set({ actionBusyId: null, actionError: error.message });
      return { error };
    }

    set((s) => {
      const fromPending = (s.pendingUsers ?? []).find(
        (u) => u.user_id === userId,
      );
      const fromRejected = (s.rejectedUsers ?? []).find(
        (u) => u.user_id === userId,
      );
      const moved = fromPending || fromRejected;

      return {
        pendingUsers: (s.pendingUsers ?? []).filter(
          (u) => u.user_id !== userId,
        ),
        rejectedUsers: (s.rejectedUsers ?? []).filter(
          (u) => u.user_id !== userId,
        ),
        approvedUsers: moved
          ? [
              { ...moved, approvalStatus_id: APPROVED_ID },
              ...(s.approvedUsers ?? []),
            ]
          : (s.approvedUsers ?? []),
        actionBusyId: null,
        actionError: null,
      };
    });

    const latestAt = maxCreatedAt(get().pendingUsers);
    const seenAt = get().pendingSeenCreatedAt || "";
    const hasNew = latestAt && (!seenAt || latestAt > seenAt);
    set({ pendingLatestCreatedAt: latestAt, pendingHasNew: !!hasNew });

    return { error: null };
  },

  rejectUser: async (userId) => {
    set({ actionBusyId: userId, actionError: null });

    const { error } = await supabase
      .from("profiles")
      .update({ approvalStatus_id: REJECTED_ID })
      .eq("user_id", userId);

    if (error) {
      set({ actionBusyId: null, actionError: error.message });
      return { error };
    }

    set((s) => {
      const fromPending = (s.pendingUsers ?? []).find(
        (u) => u.user_id === userId,
      );
      const moved = fromPending;

      return {
        pendingUsers: (s.pendingUsers ?? []).filter(
          (u) => u.user_id !== userId,
        ),
        approvedUsers: (s.approvedUsers ?? []).filter(
          (u) => u.user_id !== userId,
        ),
        rejectedUsers: moved
          ? [
              { ...moved, approvalStatus_id: REJECTED_ID },
              ...(s.rejectedUsers ?? []),
            ]
          : (s.rejectedUsers ?? []),
        actionBusyId: null,
        actionError: null,
      };
    });

    const latestAt = maxCreatedAt(get().pendingUsers);
    const seenAt = get().pendingSeenCreatedAt || "";
    const hasNew = latestAt && (!seenAt || latestAt > seenAt);
    set({ pendingLatestCreatedAt: latestAt, pendingHasNew: !!hasNew });

    return { error: null };
  },

  subscribePendingApprovals: () => {
    const existing = get()._pendingChannel;
    // if (existing) {
    //   get().fetchPendingApprovals();
    //   return () => {};
    // }
    if (existing) {
      if ((get().pendingUsers?.length ?? 0) === 0) {
        get().fetchPendingApprovals();
      }
      return () => {};
    }

    if (get()._pendingSubscribing) return () => {};
    set({ _pendingSubscribing: true });

    const channel = supabase
      .channel("users-approval-pending")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        async () => {
          await get().fetchPendingApprovals();

          if (get().pendingOpen) {
            await get().markPendingSeen();
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _pendingChannel: channel, _pendingSubscribing: false });
          get().fetchPendingApprovals();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _pendingChannel: null,
            _pendingSubscribing: false,
            pendingError:
              "Realtime connection failed. Enable replication for public.profiles in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribePendingApprovals();
  },

  unsubscribePendingApprovals: async () => {
    const channel = get()._pendingChannel;
    if (!channel) return;

    set({ _pendingChannel: null });

    try {
      await supabase.removeChannel(channel);
    } catch {}
  },

  subscribeRejectedApprovals: () => {
    const existing = get()._rejectedChannel;
    // if (existing) {
    //   get().fetchRejectedApprovals();
    //   return () => {};
    // }
    if (existing) {
      if ((get().rejectedUsers?.length ?? 0) === 0) {
        get().fetchRejectedApprovals();
      }
      return () => {};
    }

    if (get()._rejectedSubscribing) return () => {};
    set({ _rejectedSubscribing: true });

    const channel = supabase
      .channel("users-approval-rejected")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          get().fetchRejectedApprovals();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _rejectedChannel: channel, _rejectedSubscribing: false });
          get().fetchRejectedApprovals();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _rejectedChannel: null,
            _rejectedSubscribing: false,
            rejectedError:
              "Realtime connection failed. Enable replication for public.profiles in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeRejectedApprovals();
  },

  unsubscribeRejectedApprovals: async () => {
    const channel = get()._rejectedChannel;
    if (!channel) return;

    set({ _rejectedChannel: null });

    try {
      await supabase.removeChannel(channel);
    } catch {}
  },

  fetchYearLevels: async () => {
    const { data, error } = await supabase
      .from("year_level")
      .select("*")
      .order("yearLevel_id", { ascending: true });

    if (error) return { error };

    set({ yearLevels: data || [] });
  },

  fetchDepartments: async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("department_id, code, department")
      .order("code", { ascending: true });

    if (error) return { error };
    set({ departments: data ?? [] });
    return { error: null, data: data ?? [] };
  },

  fetchProgramsByDepartment: async (departmentId) => {
    if (!departmentId) {
      set({ programs: [] });
      return { error: null, data: [] };
    }

    const { data, error } = await supabase
      .from("programs")
      .select("program_id, department_id, program")
      .eq("department_id", departmentId)
      .order("program", { ascending: true });

    if (error) return { error };
    set({ programs: data ?? [] });
    return { error: null, data: data ?? [] };
  },

  fetchSchedules: async () => {
    set({ schedulesLoading: true, schedulesError: null });

    const { data, error } = await supabase
      .from("survey_schedule")
      .select(
        `
        schedule_id,
        program_id,
        yearLevel_id,
        start_at,
        end_at,
        is_active,
        created_at,
        program:programs (
          program_id,
          program,
          department:departments (
            department_id,
            code
          )
        ),
        year:year_level (
          yearLevel_id,
          year_level
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      set({
        schedules: [],
        schedulesLoading: false,
        schedulesError: error.message,
      });
      return { error };
    }

    set({
      schedules: data ?? [],
      schedulesLoading: false,
      schedulesError: null,
    });

    return { error: null, data: data ?? [] };
  },

  createSchedules: async ({
    programId,
    yearLevelIds,
    startAtISO,
    endAtISO,
    isActive,
  }) => {
    set({ schedulesError: null });

    if (
      !programId ||
      !Array.isArray(yearLevelIds) ||
      yearLevelIds.length === 0
    ) {
      const error = new Error("Missing program or year levels");
      set({ schedulesError: error.message });
      return { error };
    }

    if (!startAtISO) {
      const error = new Error("Missing start date");
      set({ schedulesError: error.message });
      return { error };
    }

    if (endAtISO && new Date(endAtISO) <= new Date(startAtISO)) {
      const error = new Error("End date must be after start date");
      set({ schedulesError: error.message });
      return { error };
    }

    const years = [...new Set(yearLevelIds.map((x) => Number(x)))];

    if (isActive) {
      const { error: disableErr } = await supabase
        .from("survey_schedule")
        .update({ is_active: false })
        .eq("program_id", programId)
        .in("yearLevel_id", years)
        .eq("is_active", true);

      if (disableErr) {
        set({ schedulesError: disableErr.message });
        return { error: disableErr };
      }
    }

    const payload = years.map((yid) => ({
      program_id: programId,
      yearLevel_id: yid,
      start_at: startAtISO,
      end_at: endAtISO ?? null,
      is_active: Boolean(isActive),
    }));

    const { data, error } = await supabase
      .from("survey_schedule")
      .insert(payload)
      .select(
        `
        schedule_id,
        program_id,
        yearLevel_id,
        start_at,
        end_at,
        is_active,
        created_at,
        program:programs (
          program_id,
          program,
          department:departments (
            department_id,
            code
          )
        ),
        year:year_level (
          yearLevel_id,
          year_level
        )
      `,
      );

    if (error) {
      set({ schedulesError: error.message });
      return { error };
    }

    set((s) => ({
      schedules: [...(data ?? []), ...(s.schedules ?? [])],
    }));

    return { error: null, data: data ?? [] };
  },

  toggleScheduleActive: async (scheduleId) => {
    set({ schedulesError: null });

    const target = (get().schedules ?? []).find(
      (x) => x.schedule_id === scheduleId,
    );
    if (!target) return { error: null };

    const nextActive = !target.is_active;

    if (nextActive) {
      const { error: disableErr } = await supabase
        .from("survey_schedule")
        .update({ is_active: false })
        .eq("program_id", target.program_id)
        .eq("yearLevel_id", target.yearLevel_id)
        .eq("is_active", true);

      if (disableErr) {
        set({ schedulesError: disableErr.message });
        return { error: disableErr };
      }
    }

    const { data, error } = await supabase
      .from("survey_schedule")
      .update({ is_active: nextActive })
      .eq("schedule_id", scheduleId)
      .select(
        `
        schedule_id,
        program_id,
        yearLevel_id,
        start_at,
        end_at,
        is_active,
        created_at,
        program:programs (
          program_id,
          program,
          department:departments (
            department_id,
            code
          )
        ),
        year:year_level (
          yearLevel_id,
          year_level
        )
      `,
      )
      .single();

    if (error) {
      set({ schedulesError: error.message });
      return { error };
    }

    set((s) => ({
      schedules: (s.schedules ?? []).map((row) =>
        row.schedule_id === scheduleId ? data : row,
      ),
    }));

    return { error: null, data };
  },

  deleteSchedule: async (scheduleId) => {
    set({ schedulesError: null });

    const { error } = await supabase
      .from("survey_schedule")
      .delete()
      .eq("schedule_id", scheduleId);

    if (error) {
      set({ schedulesError: error.message });
      return { error };
    }

    set((s) => ({
      schedules: (s.schedules ?? []).filter(
        (x) => x.schedule_id !== scheduleId,
      ),
    }));

    return { error: null };
  },

  subscribeSchedules: () => {
    const existing = get()._schedulesChannel;
    if (existing) {
      get().fetchSchedules();
      return () => {};
    }

    if (get()._schedulesSubscribing) return () => {};

    set({ _schedulesSubscribing: true });

    const channel = supabase
      .channel("survey-schedule-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "survey_schedule" },
        () => {
          get().fetchSchedules();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _schedulesChannel: channel, _schedulesSubscribing: false });
          get().fetchSchedules();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _schedulesChannel: null,
            _schedulesSubscribing: false,
            schedulesError:
              "Realtime connection failed. Enable replication for public.survey_schedule in Supabase Dashboard.",
          });
        }
      });

    return () => {
      get().unsubscribeSchedules();
    };
  },

  unsubscribeSchedules: async () => {
    const channel = get()._schedulesChannel;
    if (!channel) return;

    set({ _schedulesChannel: null });

    try {
      await supabase.removeChannel(channel);
    } catch {}
  },

  // fetchSchedules: async () => {
  //   set({
  //     schedulesLoading: (get().schedules?.length ?? 0) === 0,
  //     schedulesError: null,
  //   });

  //   const { data, error } = await supabase
  //     .from("survey_schedule")
  //     .select(
  //       `
  //     schedule_id,
  //     program_id,
  //     yearLevel_id,
  //     start_at,
  //     end_at,
  //     is_active,
  //     created_at,
  //     program:programs (
  //       program_id,
  //       program,
  //       department:departments (
  //         department_id,
  //         code
  //       )
  //     ),
  //     year:year_level (
  //       yearLevel_id,
  //       year_level
  //     )
  //   `,
  //     )
  //     .order("created_at", { ascending: false });

  //   if (error) {
  //     set({
  //       schedules: [],
  //       schedulesLoading: false,
  //       schedulesError: error.message,
  //     });
  //     return { error };
  //   }

  //   set({
  //     schedules: data ?? [],
  //     schedulesLoading: false,
  //     schedulesError: null,
  //   });

  //   return { error: null, data: data ?? [] };
  // },
  // // fetchSchedules: async () => {
  // //   // set({ schedulesLoading: true, schedulesError: null });
  // //   set({
  // //     schedulesLoading: (get().schedules?.length ?? 0) === 0,
  // //     schedulesError: null,
  // //   });

  // //   const { data, error } = await supabase
  // //     .from("survey_schedule")
  // //     .select(
  // //       `
  // //       schedule_id,
  // //       program_id,
  // //       yearLevel_id,
  // //       start_at,
  // //       end_at,
  // //       is_active,
  // //       created_at,
  // //       program:programs (
  // //         program_id,
  // //         program,
  // //         department:departments (
  // //           department_id,
  // //           code
  // //         )
  // //       ),
  // //       year:year_level (
  // //         yearLevel_id,
  // //         year_level
  // //       )
  // //     `,
  // //     )
  // //     .order("created_at", { ascending: false });

  // //   if (error) {
  // //     set({
  // //       schedules: [],
  // //       schedulesLoading: false,
  // //       schedulesError: error.message,
  // //     });
  // //     return { error };
  // //   }

  // //   set({
  // //     schedules: data ?? [],
  // //     schedulesLoading: false,
  // //     schedulesError: null,
  // //   });

  // //   return { error: null, data: data ?? [] };
  // // },

  // createSchedules: async ({
  //   programId,
  //   yearLevelIds,
  //   startAtISO,
  //   endAtISO,
  //   isActive,
  // }) => {
  //   set({ schedulesError: null });

  //   if (
  //     !programId ||
  //     !Array.isArray(yearLevelIds) ||
  //     yearLevelIds.length === 0
  //   ) {
  //     const error = new Error("Missing program or year levels");
  //     set({ schedulesError: error.message });
  //     return { error };
  //   }

  //   if (!startAtISO) {
  //     const error = new Error("Missing start date");
  //     set({ schedulesError: error.message });
  //     return { error };
  //   }

  //   if (endAtISO && new Date(endAtISO) <= new Date(startAtISO)) {
  //     const error = new Error("End date must be after start date");
  //     set({ schedulesError: error.message });
  //     return { error };
  //   }

  //   const years = [...new Set(yearLevelIds.map((x) => Number(x)))];

  //   if (isActive) {
  //     const { error: disableErr } = await supabase
  //       .from("survey_schedule")
  //       .update({ is_active: false })
  //       .eq("program_id", programId)
  //       .in("yearLevel_id", years)
  //       .eq("is_active", true);

  //     if (disableErr) {
  //       set({ schedulesError: disableErr.message });
  //       return { error: disableErr };
  //     }
  //   }

  //   const payload = years.map((yid) => ({
  //     program_id: programId,
  //     yearLevel_id: yid,
  //     start_at: startAtISO,
  //     end_at: endAtISO ?? null,
  //     is_active: Boolean(isActive),
  //   }));

  //   const { data, error } = await supabase
  //     .from("survey_schedule")
  //     .insert(payload).select(`
  //     schedule_id,
  //     program_id,
  //     yearLevel_id,
  //     start_at,
  //     end_at,
  //     is_active,
  //     created_at,
  //     program:programs (
  //       program_id,
  //       program,
  //       department:departments (
  //         department_id,
  //         code
  //       )
  //     ),
  //     year:year_level (
  //       yearLevel_id,
  //       year_level
  //     )
  //   `);

  //   if (error) {
  //     set({ schedulesError: error.message });
  //     return { error };
  //   }

  //   set((s) => {
  //     let current = [...(s.schedules ?? [])];

  //     if (isActive) {
  //       current = current.map((row) => {
  //         if (
  //           row.program_id === programId &&
  //           years.includes(Number(row.yearLevel_id))
  //         ) {
  //           return { ...row, is_active: false };
  //         }
  //         return row;
  //       });
  //     }

  //     return {
  //       schedules: [...(data ?? []), ...current],
  //     };
  //   });

  //   return { error: null, data: data ?? [] };
  // },
  // // createSchedules: async ({
  // //   programId,
  // //   yearLevelIds,
  // //   startAtISO,
  // //   endAtISO,
  // //   isActive,
  // // }) => {
  // //   set({ schedulesError: null });

  // //   if (
  // //     !programId ||
  // //     !Array.isArray(yearLevelIds) ||
  // //     yearLevelIds.length === 0
  // //   ) {
  // //     const error = new Error("Missing program or year levels");
  // //     set({ schedulesError: error.message });
  // //     return { error };
  // //   }

  // //   if (!startAtISO) {
  // //     const error = new Error("Missing start date");
  // //     set({ schedulesError: error.message });
  // //     return { error };
  // //   }

  // //   if (endAtISO && new Date(endAtISO) <= new Date(startAtISO)) {
  // //     const error = new Error("End date must be after start date");
  // //     set({ schedulesError: error.message });
  // //     return { error };
  // //   }

  // //   const years = [...new Set(yearLevelIds.map((x) => Number(x)))];

  // //   if (isActive) {
  // //     const { error: disableErr } = await supabase
  // //       .from("survey_schedule")
  // //       .update({ is_active: false })
  // //       .eq("program_id", programId)
  // //       .in("yearLevel_id", years)
  // //       .eq("is_active", true);

  // //     if (disableErr) {
  // //       set({ schedulesError: disableErr.message });
  // //       return { error: disableErr };
  // //     }
  // //   }

  // //   const payload = years.map((yid) => ({
  // //     program_id: programId,
  // //     yearLevel_id: yid,
  // //     start_at: startAtISO,
  // //     end_at: endAtISO ?? null,
  // //     is_active: Boolean(isActive),
  // //   }));

  // //   const { data, error } = await supabase
  // //     .from("survey_schedule")
  // //     .insert(payload).select(`
  // //       schedule_id,
  // //       program_id,
  // //       yearLevel_id,
  // //       start_at,
  // //       end_at,
  // //       is_active,
  // //       created_at,
  // //       program:programs (
  // //         program_id,
  // //         program,
  // //         department:departments (
  // //           department_id,
  // //           code
  // //         )
  // //       ),
  // //       year:year_level (
  // //         yearLevel_id,
  // //         year_level
  // //       )
  // //     `);

  // //   if (error) {
  // //     set({ schedulesError: error.message });
  // //     return { error };
  // //   }

  // //   set((s) => ({
  // //     schedules: [...(data ?? []), ...(s.schedules ?? [])],
  // //   }));

  // //   return { error: null, data: data ?? [] };
  // // },

  // toggleScheduleActive: async (scheduleId) => {
  //   set({ schedulesError: null });

  //   const target = (get().schedules ?? []).find(
  //     (x) => x.schedule_id === scheduleId,
  //   );

  //   if (!target) return { error: null };

  //   const nextActive = !target.is_active;

  //   if (nextActive) {
  //     const { error: disableErr } = await supabase
  //       .from("survey_schedule")
  //       .update({ is_active: false })
  //       .eq("program_id", target.program_id)
  //       .eq("yearLevel_id", target.yearLevel_id)
  //       .eq("is_active", true);

  //     if (disableErr) {
  //       set({ schedulesError: disableErr.message });
  //       return { error: disableErr };
  //     }
  //   }

  //   const { data, error } = await supabase
  //     .from("survey_schedule")
  //     .update({ is_active: nextActive })
  //     .eq("schedule_id", scheduleId)
  //     .select(
  //       `
  //     schedule_id,
  //     program_id,
  //     yearLevel_id,
  //     start_at,
  //     end_at,
  //     is_active,
  //     created_at,
  //     program:programs (
  //       program_id,
  //       program,
  //       department:departments (
  //         department_id,
  //         code
  //       )
  //     ),
  //     year:year_level (
  //       yearLevel_id,
  //       year_level
  //     )
  //   `,
  //     )
  //     .single();

  //   if (error) {
  //     set({ schedulesError: error.message });
  //     return { error };
  //   }

  //   set((s) => ({
  //     schedules: (s.schedules ?? []).map((row) => {
  //       // if turning ON one schedule, turn OFF others with same program/year
  //       if (
  //         nextActive &&
  //         row.program_id === target.program_id &&
  //         row.yearLevel_id === target.yearLevel_id &&
  //         row.schedule_id !== scheduleId
  //       ) {
  //         return { ...row, is_active: false };
  //       }

  //       // replace the toggled one with fresh DB result
  //       if (row.schedule_id === scheduleId) {
  //         return data;
  //       }

  //       return row;
  //     }),
  //   }));

  //   return { error: null, data };
  // },
  // // toggleScheduleActive: async (scheduleId) => {
  // //   set({ schedulesError: null });

  // //   const target = (get().schedules ?? []).find(
  // //     (x) => x.schedule_id === scheduleId,
  // //   );
  // //   if (!target) return { error: null };

  // //   const nextActive = !target.is_active;

  // //   if (nextActive) {
  // //     const { error: disableErr } = await supabase
  // //       .from("survey_schedule")
  // //       .update({ is_active: false })
  // //       .eq("program_id", target.program_id)
  // //       .eq("yearLevel_id", target.yearLevel_id)
  // //       .eq("is_active", true);

  // //     if (disableErr) {
  // //       set({ schedulesError: disableErr.message });
  // //       return { error: disableErr };
  // //     }
  // //   }

  // //   const { data, error } = await supabase
  // //     .from("survey_schedule")
  // //     .update({ is_active: nextActive })
  // //     .eq("schedule_id", scheduleId)
  // //     .select(
  // //       `
  // //       schedule_id,
  // //       program_id,
  // //       yearLevel_id,
  // //       start_at,
  // //       end_at,
  // //       is_active,
  // //       created_at,
  // //       program:programs (
  // //         program_id,
  // //         program,
  // //         department:departments (
  // //           department_id,
  // //           code
  // //         )
  // //       ),
  // //       year:year_level (
  // //         yearLevel_id,
  // //         year_level
  // //       )
  // //     `,
  // //     )
  // //     .single();

  // //   if (error) {
  // //     set({ schedulesError: error.message });
  // //     return { error };
  // //   }

  // //   set((s) => ({
  // //     schedules: (s.schedules ?? []).map((row) =>
  // //       row.schedule_id === scheduleId ? data : row,
  // //     ),
  // //   }));

  // //   return { error: null, data };
  // // },

  // deleteSchedule: async (scheduleId) => {
  //   set({ schedulesError: null });

  //   const { error } = await supabase
  //     .from("survey_schedule")
  //     .delete()
  //     .eq("schedule_id", scheduleId);

  //   if (error) {
  //     set({ schedulesError: error.message });
  //     return { error };
  //   }

  //   set((s) => ({
  //     schedules: (s.schedules ?? []).filter(
  //       (x) => x.schedule_id !== scheduleId,
  //     ),
  //   }));

  //   return { error: null };
  // },

  // subscribeSchedules: () => {
  //   const existing = get()._schedulesChannel;

  //   if (existing) {
  //     if ((get().schedules?.length ?? 0) === 0) {
  //       get().fetchSchedules();
  //     }
  //     return () => {};
  //   }

  //   if (get()._schedulesSubscribing) return () => {};
  //   set({ _schedulesSubscribing: true });

  //   const channel = supabase
  //     .channel("survey-schedule-rt")
  //     .on(
  //       "postgres_changes",
  //       { event: "*", schema: "public", table: "survey_schedule" },
  //       () => {
  //         get().fetchSchedules();
  //       },
  //     )
  //     .subscribe((status) => {
  //       if (status === "SUBSCRIBED") {
  //         set({ _schedulesChannel: channel, _schedulesSubscribing: false });

  //         if ((get().schedules?.length ?? 0) === 0) {
  //           get().fetchSchedules();
  //         }

  //         return;
  //       }

  //       if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
  //         set({
  //           _schedulesChannel: null,
  //           _schedulesSubscribing: false,
  //           schedulesError:
  //             "Realtime connection failed. Enable replication for public.survey_schedule in Supabase Dashboard.",
  //         });
  //       }
  //     });

  //   return () => {
  //     get().unsubscribeSchedules();
  //   };
  // },
  // // subscribeSchedules: () => {
  // //   const existing = get()._schedulesChannel;
  // //   // if (existing) {
  // //   //   get().fetchSchedules();
  // //   //   return () => {};
  // //   // }
  // //   if (existing) {
  // //     if ((get().schedules?.length ?? 0) === 0) {
  // //       get().fetchSchedules();
  // //     }
  // //     return () => {};
  // //   }

  // //   if (get()._schedulesSubscribing) return () => {};
  // //   set({ _schedulesSubscribing: true });

  // //   const channel = supabase
  // //     .channel("survey-schedule-rt")
  // //     .on(
  // //       "postgres_changes",
  // //       { event: "*", schema: "public", table: "survey_schedule" },
  // //       () => {
  // //         get().fetchSchedules();
  // //       },
  // //     )
  // //     .subscribe((status) => {
  // //       if (status === "SUBSCRIBED") {
  // //         set({ _schedulesChannel: channel, _schedulesSubscribing: false });
  // //         get().fetchSchedules();
  // //         return;
  // //       }

  // //       if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
  // //         set({
  // //           _schedulesChannel: null,
  // //           _schedulesSubscribing: false,
  // //           schedulesError:
  // //             "Realtime connection failed. Enable replication for public.survey_schedule in Supabase Dashboard.",
  // //         });
  // //       }
  // //     });

  // //   return () => {
  // //     get().unsubscribeSchedules();
  // //   };
  // // },

  // unsubscribeSchedules: async () => {
  //   const channel = get()._schedulesChannel;
  //   if (!channel) return;

  //   set({ _schedulesChannel: null });

  //   try {
  //     await supabase.removeChannel(channel);
  //   } catch {}
  // },

  fetchRoleCandidates: async () => {
    // set({ roleUsersLoading: true, roleUsersError: null });
    set({
      roleUsersLoading: (get().roleUsers?.length ?? 0) === 0,
      roleUsersError: null,
    });

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        user_id,
        email,
        student_id,
        usertype_id,
        yearLevel_id,
        created_at,
        user_type:user_type!users_usertype_id_fkey (
          usertype_id,
          user_type
        ),
        year:year_level!users_yearLevel_id_fkey (
          yearLevel_id,
          year_level
        )
      `,
      )
      .eq("yearLevel_id", NOT_APPLICABLE_YEARLEVEL_ID)
      .eq("usertype_id", ROLE_STUDENT_ID)
      .order("created_at", { ascending: false });

    if (error) {
      set({
        roleUsers: [],
        roleUsersLoading: false,
        roleUsersError: error.message,
      });
      return { error };
    }

    const rows = await decryptUserRows(data ?? []);
    const latestAt = maxCreatedAt(rows);
    const seenAt = get().roleSeenCreatedAt || "";
    const hasNew = latestAt && (!seenAt || latestAt > seenAt);

    set({
      roleUsers: rows,
      roleUsersLoading: false,
      roleUsersError: null,
      roleLatestCreatedAt: latestAt,
      roleHasNew: !!hasNew,
    });

    return { error: null, data: rows };
  },

  subscribeRoleCandidates: () => {
    const existing = get()._roleChannel;
    // if (existing) {
    //   get().fetchRoleCandidates();
    //   return () => {};
    // }
    if (existing) {
      if ((get().roleUsers?.length ?? 0) === 0) {
        get().fetchRoleCandidates();
      }
      return () => {};
    }

    if (get()._roleSubscribing) return () => {};
    set({ _roleSubscribing: true });

    const ch = supabase
      .channel("role-candidates-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const row = payload?.new;
          if (!row) return;

          const okYear =
            Number(row.yearLevel_id) === NOT_APPLICABLE_YEARLEVEL_ID;
          const okRole = Number(row.usertype_id) === ROLE_STUDENT_ID;
          if (!okYear || !okRole) return;

          const createdAt = row.created_at ? String(row.created_at) : "";
          const seenAt = get().roleSeenCreatedAt || "";

          if (createdAt && (!seenAt || createdAt > seenAt)) {
            if (get().roleOpen) {
              set((s) => ({
                roleHasNew: false,
                roleLatestCreatedAt:
                  s.roleLatestCreatedAt && s.roleLatestCreatedAt > createdAt
                    ? s.roleLatestCreatedAt
                    : createdAt,
                roleSeenCreatedAt:
                  s.roleSeenCreatedAt && s.roleSeenCreatedAt > createdAt
                    ? s.roleSeenCreatedAt
                    : createdAt,
              }));
              writeSeen(SEEN_ROLE_KEY, createdAt);
            } else {
              set((s) => ({
                roleHasNew: true,
                roleLatestCreatedAt:
                  s.roleLatestCreatedAt && s.roleLatestCreatedAt > createdAt
                    ? s.roleLatestCreatedAt
                    : createdAt,
              }));
            }
          }

          get().fetchRoleCandidates();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _roleChannel: ch, _roleSubscribing: false });
          get().fetchRoleCandidates();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _roleChannel: null,
            _roleSubscribing: false,
            roleUsersError:
              "Realtime connection failed. Enable replication for public.profiles in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeRoleCandidates();
  },

  unsubscribeRoleCandidates: async () => {
    const ch = get()._roleChannel;
    if (!ch) return;

    set({ _roleChannel: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },

  updateUserRoleType: async (userId, nextUserTypeId) => {
    set({ roleActionBusyId: userId, roleActionError: null });

    const nextIdNum = Number(nextUserTypeId);

    if (nextIdNum !== ROLE_STAFF_ID && nextIdNum !== ROLE_CHAIRPERSON_ID) {
      const err = new Error("Invalid role id");
      set({ roleActionBusyId: null, roleActionError: err.message });
      return { error: err };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ usertype_id: nextIdNum })
      .eq("user_id", userId)
      .eq("usertype_id", ROLE_STUDENT_ID);

    if (error) {
      set({ roleActionBusyId: null, roleActionError: error.message });
      return { error };
    }

    set((s) => ({
      roleUsers: (s.roleUsers ?? []).filter((u) => u.user_id !== userId),
      roleActionBusyId: null,
      roleActionError: null,
    }));

    const latestAt = maxCreatedAt(get().roleUsers);
    const seenAt = get().roleSeenCreatedAt || "";
    const hasNew = latestAt && (!seenAt || latestAt > seenAt);
    set({ roleLatestCreatedAt: latestAt, roleHasNew: !!hasNew });

    return { error: null };
  },

  pinVerifyLoading: false,
  pinVerifyError: null,

  verifyUserPin: async (userId, pinInput) => {
    set({ pinVerifyLoading: true, pinVerifyError: null });

    const clean = String(pinInput ?? "").trim();
    if (!userId || !clean) {
      set({ pinVerifyLoading: false, pinVerifyError: "Missing user or pin." });
      return { ok: false };
    }

    const { data, error } = await supabase
      .from("lock_screen_pin")
      .select("pin")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      set({ pinVerifyLoading: false, pinVerifyError: error.message });
      return { ok: false };
    }

    const savedPin = data?.pin;

    if (savedPin === null || savedPin === undefined) {
      set({ pinVerifyLoading: false, pinVerifyError: "No PIN set." });
      return { ok: false };
    }

    const ok = String(savedPin) === clean;

    set({ pinVerifyLoading: false, pinVerifyError: ok ? null : "Wrong PIN." });
    return { ok };
  },

  fetchMyPinExists: async () => {
    set({ pinLoading: true, pinError: null });

    const userId = useAuthStore.getState().user?.id || null;
    if (!userId) {
      set({ pinLoading: false, pinError: "Missing user." });
      return { ok: false };
    }

    const { data, error } = await supabase
      .from("lock_screen_pin")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      set({ pinLoading: false, pinError: error.message });
      return { ok: false };
    }

    const exists = !!data?.user_id;
    set({ pinLoading: false, pinError: null, pinExists: exists });
    return { ok: true, exists };
  },

  verifyMyPin: async (pinInput) => {
    set({ pinLoading: true, pinError: null });

    const userId = useAuthStore.getState().user?.id || null;
    const clean = String(pinInput ?? "").trim();

    if (!userId || !clean) {
      set({ pinLoading: false, pinError: "Missing user or pin." });
      return { ok: false };
    }

    const { data, error } = await supabase
      .from("lock_screen_pin")
      .select("pin")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      set({ pinLoading: false, pinError: error.message });
      return { ok: false };
    }

    const saved = data?.pin;
    if (saved === null || saved === undefined || String(saved) === "") {
      set({ pinLoading: false, pinError: "No PIN set." });
      return { ok: false };
    }

    const ok = String(saved) === clean;
    set({ pinLoading: false, pinError: ok ? null : "Wrong PIN." });
    return { ok };
  },

  updateMyPin: async ({ currentPin, newPin }) => {
    set({ pinLoading: true, pinError: null });

    const cur = String(currentPin ?? "").replace(/\s+/g, "");
    const nxt = String(newPin ?? "").replace(/\s+/g, "");

    if (!/^[0-9]{4}$/.test(cur) || !/^[0-9]{4}$/.test(nxt)) {
      set({ pinLoading: false, pinError: "PIN must be 4 digits." });
      return { ok: false };
    }

    if (cur === nxt) {
      set({ pinLoading: false, pinError: "New PIN must be different." });
      return { ok: false };
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    const userId = user?.id;

    if (authErr || !userId) {
      set({ pinLoading: false, pinError: "Not signed in." });
      return { ok: false };
    }

    const { data: row, error: readErr } = await supabase
      .from("lock_screen_pin")
      .select("pin")
      .eq("user_id", userId)
      .maybeSingle();

    if (readErr) {
      set({ pinLoading: false, pinError: readErr.message });
      return { ok: false };
    }

    if (!row) {
      set({ pinLoading: false, pinError: "No PIN set yet." });
      return { ok: false };
    }

    const savedPin = String(row.pin ?? "");
    if (savedPin !== cur) {
      set({ pinLoading: false, pinError: "Wrong PIN." });
      return { ok: false };
    }

    const { error: updErr } = await supabase
      .from("lock_screen_pin")
      .update({ pin: nxt, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (updErr) {
      set({ pinLoading: false, pinError: updErr.message });
      return { ok: false };
    }

    set({ pinLoading: false, pinError: null, pinExists: true });
    return { ok: true };
  },

  setMyPinFirstTime: async (newPin) => {
    set({ pinLoading: true, pinError: null });

    const nxt = String(newPin ?? "").replace(/\s+/g, "");
    if (!/^[0-9]{4}$/.test(nxt)) {
      set({ pinLoading: false, pinError: "PIN must be 4 digits." });
      return { ok: false };
    }

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    const userId = user?.id;

    if (authErr || !userId) {
      set({ pinLoading: false, pinError: "Not signed in." });
      return { ok: false };
    }

    const { data: existing, error: checkErr } = await supabase
      .from("lock_screen_pin")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkErr) {
      set({ pinLoading: false, pinError: checkErr.message });
      return { ok: false };
    }

    if (existing?.user_id) {
      set({ pinLoading: false, pinError: "PIN already set." });
      return { ok: false };
    }

    const { error: insErr } = await supabase.from("lock_screen_pin").insert({
      user_id: userId,
      pin: nxt,
    });

    if (insErr) {
      set({ pinLoading: false, pinError: insErr.message });
      return { ok: false };
    }

    set({ pinLoading: false, pinError: null, pinExists: true });
    return { ok: true };
  },

  fetchApprovedApprovals: async () => {
    // set({ approvedLoading: true, approvedError: null });
    set({
      approvedLoading: (get().approvedUsers?.length ?? 0) === 0,
      approvedError: null,
    });

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        user_id,
        email,
        student_id,
        approvalStatus_id,
        created_at,
        approval_status:approval_status!users_approvalStatus_id_fkey (
          approval_status
        ),
        program:programs (
          program_id,
          program,
          department:departments (
            department_id,
            code
          )
        ),
        year:year_level (
          yearLevel_id,
          year_level
        )
      `,
      )
      .eq("approvalStatus_id", APPROVED_ID)
      .order("created_at", { ascending: false });

    if (error) {
      set({
        approvedUsers: [],
        approvedLoading: false,
        approvedError: error.message,
      });
      return { error };
    }

    const rows = await decryptUserRows(data ?? []);

    set({
      approvedUsers: rows,
      approvedLoading: false,
      approvedError: null,
    });

    return { error: null, data: rows };
  },

  subscribeApprovedApprovals: () => {
    const existing = get()._approvedChannel;
    // if (existing) {
    //   get().fetchApprovedApprovals();
    //   return () => {};
    // }
    if (existing) {
      if ((get().approvedUsers?.length ?? 0) === 0) {
        get().fetchApprovedApprovals();
      }
      return () => {};
    }

    if (get()._approvedSubscribing) return () => {};
    set({ _approvedSubscribing: true });

    const channel = supabase
      .channel("users-approval-approved")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          get().fetchApprovedApprovals();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _approvedChannel: channel, _approvedSubscribing: false });
          get().fetchApprovedApprovals();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _approvedChannel: null,
            _approvedSubscribing: false,
            approvedError:
              "Realtime connection failed. Enable replication for public.profiles in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeApprovedApprovals();
  },

  unsubscribeApprovedApprovals: async () => {
    const channel = get()._approvedChannel;
    if (!channel) return;

    set({ _approvedChannel: null });

    try {
      await supabase.removeChannel(channel);
    } catch {}
  },
}));
