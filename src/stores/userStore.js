// src/stores/userStore.js
/* eslint-disable no-empty */
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "./authStore";
import { decryptUserRow, encryptUserUpdateFields } from "@/lib/userCrypto";

export const useUserStore = create((set, get) => ({
  profile: null,
  profileLoading: false,
  profileError: null,

  programs: [],
  programsLoading: false,
  programsError: null,

  yearLevels: [],
  yearLevelsLoading: false,
  yearLevelsError: null,

  schedule: null,
  scheduleLoading: false,
  scheduleError: null,
  scheduleFetched: false,

  _profileChannel: null,
  _subscribing: false,
  _subscribedUserId: null,

  _scheduleChannel: null,
  _scheduleSubscribing: false,
  _subscribedScheduleKey: null,

  fetchPrograms: async () => {
    set({ programsLoading: true, programsError: null });

    const { data, error } = await supabase
      .from("programs")
      .select("program_id, program")
      .order("program", { ascending: true });

    if (error) {
      set({
        programs: [],
        programsLoading: false,
        programsError: error.message,
      });
      return { error, data: null };
    }

    set({
      programs: data || [],
      programsLoading: false,
      programsError: null,
    });

    return { error: null, data: data || [] };
  },

  fetchYearLevels: async () => {
    set({ yearLevelsLoading: true, yearLevelsError: null });

    const { data, error } = await supabase
      .from("year_level")
      .select("yearLevel_id, year_level")
      .order("yearLevel_id", { ascending: true });

    if (error) {
      set({
        yearLevels: [],
        yearLevelsLoading: false,
        yearLevelsError: error.message,
      });
      return { error, data: null };
    }

    set({
      yearLevels: data || [],
      yearLevelsLoading: false,
      yearLevelsError: null,
    });

    return { error: null, data: data || [] };
  },

  fetchUserProfile: async (userIdArg) => {
    const authUser = useAuthStore.getState().user;
    const userId = userIdArg || authUser?.id || null;

    if (!userId) {
      set({
        profile: null,
        profileLoading: false,
        profileError: null,
        schedule: null,
        scheduleLoading: false,
        scheduleError: null,
        scheduleFetched: false,
      });
      return { error: null, data: null };
    }

    // set({ profileLoading: true, profileError: null });
    set({
      profileLoading: !get().profile,
      profileError: null,
    });

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        user_id,
        email,
        firstname,
        middlename,
        lastname,
        gender,
        age,
        student_id,
        usertype_id,
        user_type:user_type!users_usertype_id_fkey (
          user_type
        ),
        approvalStatus_id,
        approval_status:approval_status!users_approvalStatus_id_fkey (
          approval_status
        ),
        program_id,
        yearLevel_id,
        program:programs (
          program_id,
          program,
          department:departments (
            department_id,
            code,
            department
          )
        ),
        year:year_level (
          yearLevel_id,
          year_level
        ),
        profileImageURL,
        created_at,
        updated_at
      `,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      set({
        profile: null,
        profileLoading: false,
        profileError: error.message,
      });
      return { error, data: null };
    }

    if (!data) {
      const err = new Error("Profile row not found.");
      set({
        profile: null,
        profileLoading: false,
        profileError: err.message,
      });
      return { error: err, data: null };
    }

    let decryptedProfile = data;

    try {
      decryptedProfile = await decryptUserRow(data);
    } catch (decryptError) {
      set({
        profile: null,
        profileLoading: false,
        profileError: decryptError.message || "Failed to decrypt profile.",
      });
      return { error: decryptError, data: null };
    }

    set({
      profile: decryptedProfile,
      profileLoading: false,
      profileError: null,
      scheduleError: null,
      scheduleFetched: false,
    });

    await get().fetchMySurveySchedule();
    get().subscribeMySurveySchedule();

    return { error: null, data: decryptedProfile };
  },

  updateMyProfile: async (updates) => {
    const userId = useAuthStore.getState().user?.id || null;

    if (!userId) {
      const err = new Error("No authenticated user.");
      set({ profileError: err.message });
      return { error: err, data: null };
    }

    const allowed = [
      "firstname",
      "middlename",
      "lastname",
      "gender",
      "age",
      "profileImageURL",
      "program_id",
      "yearLevel_id",
    ];

    const rawPayload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(updates || {}, k)) {
        rawPayload[k] = updates[k];
      }
    }

    if (!Object.keys(rawPayload).length) {
      return { error: null, data: null };
    }

    let payload = rawPayload;

    try {
      payload = await encryptUserUpdateFields(rawPayload);
    } catch (encryptError) {
      set({
        profileLoading: false,
        profileError:
          encryptError.message || "Failed to encrypt profile update.",
      });
      return { error: encryptError, data: null };
    }

    set({ profileLoading: true, profileError: null });

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", userId)
      .select(
        `
        user_id,
        email,
        firstname,
        middlename,
        lastname,
        gender,
        age,
        student_id,
        usertype_id,
        approvalStatus_id,
        program_id,
        yearLevel_id,
        profileImageURL,
        program:programs ( program_id, program ),
        year:year_level ( yearLevel_id, year_level ),
        updated_at
      `,
      )
      .maybeSingle();

    if (error) {
      set({ profileLoading: false, profileError: error.message });
      return { error, data: null };
    }

    let decryptedUpdated = data;

    try {
      if (data) {
        decryptedUpdated = await decryptUserRow(data);
      }
    } catch (decryptError) {
      set({
        profileLoading: false,
        profileError:
          decryptError.message || "Failed to decrypt updated profile.",
      });
      return { error: decryptError, data: null };
    }

    set((s) => ({
      profile: s.profile
        ? { ...s.profile, ...(decryptedUpdated || rawPayload) }
        : decryptedUpdated || null,
      profileLoading: false,
      profileError: null,
    }));

    await get().fetchMySurveySchedule();
    get().subscribeMySurveySchedule();

    return { error: null, data: decryptedUpdated || rawPayload };
  },

  uploadMyProfileImage: async (file) => {
    const userId = useAuthStore.getState().user?.id || null;

    if (!userId) {
      const err = new Error("No authenticated user.");
      set({ profileError: err.message });
      return { error: err, data: null };
    }

    if (!file) return { error: null, data: null };

    const ext = (file.name || "").split(".").pop() || "png";
    const safeExt =
      String(ext)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "png";

    const path = `${userId}/${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}.${safeExt}`;

    set({ profileLoading: true, profileError: null });

    const { error: upErr } = await supabase.storage
      .from("profile-images")
      .upload(path, file, { upsert: true });

    if (upErr) {
      set({ profileLoading: false, profileError: upErr.message });
      return { error: upErr, data: null };
    }

    const res = await get().updateMyProfile({ profileImageURL: path });
    set({ profileLoading: false });
    return { error: res.error, data: path };
  },

  fetchMySurveySchedule: async () => {
    const p = get().profile;
    const programId = p?.program_id ?? null;
    const yearLevelId = p?.yearLevel_id ?? null;

    if (!programId || !yearLevelId) {
      set({
        schedule: null,
        scheduleLoading: false,
        scheduleError: null,
        scheduleFetched: false,
      });
      return { error: null, data: null };
    }

    // set({
    //   scheduleLoading: true,
    //   scheduleError: null,
    //   scheduleFetched: false,
    // });
    set({
      scheduleLoading: !get().schedule,
      scheduleError: null,
      scheduleFetched: false,
    });

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
        updated_at
      `,
      )
      .eq("program_id", programId)
      .eq("yearLevel_id", yearLevelId)
      .eq("is_active", true)
      .order("start_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      set({
        scheduleLoading: false,
        scheduleError: error.message,
        scheduleFetched: true,
      });
      return { error, data: null };
    }

    set({
      schedule: data ?? null,
      scheduleLoading: false,
      scheduleError: null,
      scheduleFetched: true,
    });

    return { error: null, data: data ?? null };
  },

  subscribeUserProfile: () => {
    const userId = useAuthStore.getState().user?.id || null;

    if (!userId) {
      get().unsubscribeUserProfile();
      get().unsubscribeMySurveySchedule();
      set({
        profile: null,
        profileLoading: false,
        profileError: null,
        schedule: null,
        scheduleLoading: false,
        scheduleError: null,
        scheduleFetched: false,
      });
      return () => {};
    }

    // if (get()._profileChannel && get()._subscribedUserId === userId) {
    //   get().fetchUserProfile(userId);
    //   return () => {};
    // }
    if (get()._profileChannel && get()._subscribedUserId === userId) {
      if (!get().profile) {
        get().fetchUserProfile(userId);
      }
      return () => {};
    }

    if (get()._subscribing) return () => {};

    set({ _subscribing: true });

    get().unsubscribeUserProfile();

    const channel = supabase
      .channel(`user-profile-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await get().fetchUserProfile(userId);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({
            _profileChannel: channel,
            _subscribing: false,
            _subscribedUserId: userId,
          });
          get().fetchUserProfile(userId);
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _profileChannel: null,
            _subscribing: false,
            _subscribedUserId: null,
            profileError:
              "Realtime connection failed. Enable replication for public.profiles in Supabase Dashboard.",
          });
        }
      });

    return () => {
      get().unsubscribeUserProfile();
    };
  },

  unsubscribeUserProfile: async () => {
    const ch = get()._profileChannel;
    if (!ch) return;

    set({ _profileChannel: null, _subscribedUserId: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },

  subscribeMySurveySchedule: () => {
    const p = get().profile;
    const programId = p?.program_id ?? null;
    const yearLevelId = p?.yearLevel_id ?? null;

    if (!programId || !yearLevelId) {
      get().unsubscribeMySurveySchedule();
      return () => {};
    }

    const key = `${programId}__${yearLevelId}`;

    // if (get()._scheduleChannel && get()._subscribedScheduleKey === key) {
    //   get().fetchMySurveySchedule();
    //   return () => {};
    // }

    if (get()._scheduleChannel && get()._subscribedScheduleKey === key) {
      if (!get().scheduleFetched) {
        get().fetchMySurveySchedule();
      }
      return () => {};
    }

    if (get()._scheduleSubscribing) return () => {};

    set({ _scheduleSubscribing: true });

    get().unsubscribeMySurveySchedule();

    const channel = supabase
      .channel(`survey-schedule-${key}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "survey_schedule",
          filter: `program_id=eq.${programId}`,
        },
        async () => {
          await get().fetchMySurveySchedule();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({
            _scheduleChannel: channel,
            _scheduleSubscribing: false,
            _subscribedScheduleKey: key,
          });
          get().fetchMySurveySchedule();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _scheduleChannel: null,
            _scheduleSubscribing: false,
            _subscribedScheduleKey: null,
            scheduleError:
              "Realtime connection failed. Enable replication for public.survey_schedule in Supabase Dashboard.",
          });
        }
      });

    return () => {
      get().unsubscribeMySurveySchedule();
    };
  },

  unsubscribeMySurveySchedule: async () => {
    const ch = get()._scheduleChannel;
    if (!ch) return;

    set({ _scheduleChannel: null, _subscribedScheduleKey: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },

  clearUserProfile: () => {
    get().unsubscribeUserProfile();
    get().unsubscribeMySurveySchedule();
    set({
      profile: null,
      profileLoading: false,
      profileError: null,
      schedule: null,
      scheduleLoading: false,
      scheduleError: null,
      scheduleFetched: false,
      _subscribedUserId: null,
      _subscribedScheduleKey: null,
    });
  },
}));
