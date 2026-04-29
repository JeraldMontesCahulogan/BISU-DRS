// src/stores/authStore.js

import { create } from "zustand";
import { supabase } from "../lib/supabase.js";
import { encryptText, decryptText } from "@/lib/crypto";

const LS_KEY = "auth_profile_cache_v1";

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readCache() {
  if (typeof window === "undefined") return null;
  return safeJsonParse(window.localStorage.getItem(LS_KEY));
}

function writeCache(payload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
}

function clearCache() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_KEY);
}

function roleRedirect(role) {
  if (role === "admin" || role === "chairperson" || role === "staff") {
    return "/admin-portal";
  }
  if (role === "student") return "/student-portal";
  return "/login";
}

function normalizeRole(v) {
  if (!v) return null;
  const s = String(v).toLowerCase().trim();
  if (s === "admin") return "admin";
  if (s === "chairperson") return "chairperson";
  if (s === "staff") return "staff";
  if (s === "student") return "student";
  return null;
}

async function decryptUserFields(row) {
  if (!row) return row;

  return {
    ...row,
    email: row.email ? await decryptText(row.email) : null,
    student_id: row.student_id ? await decryptText(row.student_id) : null,
    firstname: row.firstname ? await decryptText(row.firstname) : null,
    middlename: row.middlename ? await decryptText(row.middlename) : null,
    lastname: row.lastname ? await decryptText(row.lastname) : null,
  };
}

export const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  role: null,
  loadingAuth: true,
  loadingProfile: true,
  authError: null,
  _authSub: null,

  initAuthListener: async () => {
    const cached = readCache();

    if (cached?.profile && cached?.role) {
      set({
        profile: cached.profile,
        role: cached.role,
        loadingProfile: false,
      });
    }

    const { data: s1, error: s1Err } = await supabase.auth.getSession();

    if (s1Err) {
      set({
        session: null,
        user: null,
        loadingAuth: false,
        loadingProfile: false,
      });
      clearCache();
      return;
    }

    const session = s1?.session ?? null;

    set({
      session,
      user: session?.user ?? null,
      loadingAuth: false,
    });

    if (session?.user?.id) {
      await get().fetchProfile(session.user.id);
    } else {
      set({ loadingProfile: false });
      clearCache();
    }

    if (get()._authSub) return;

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const nextSession = newSession ?? null;

        set({
          session: nextSession,
          user: nextSession?.user ?? null,
          loadingAuth: false,
        });

        if (!nextSession?.user?.id) {
          set({
            profile: null,
            role: null,
            loadingProfile: false,
          });
          clearCache();
          return;
        }

        // await get().fetchProfile(nextSession.user.id);
        const currentProfile = get().profile;
        if (currentProfile?.user_id !== nextSession.user.id) {
          await get().fetchProfile(nextSession.user.id);
        }
      },
    );

    set({ _authSub: sub?.subscription ?? null });
  },

  fetchProfile: async (userId) => {
    if (!userId) {
      set({ profile: null, role: null, loadingProfile: false });
      clearCache();
      return { error: null };
    }

    const cached = readCache();

    const hasExistingProfile = !!get().profile;

    if (cached?.userId === userId && cached?.profile && cached?.role) {
      set({
        profile: cached.profile,
        role: cached.role,
        loadingProfile: false,
      });
    } else {
      set({ loadingProfile: !hasExistingProfile });
    }

    const { data: row, error } = await supabase
      .from("profiles")
      .select(
        `
        user_id,
        email,
        student_id,
        firstname,
        middlename,
        lastname,
        usertype_id,
        approvalStatus_id, 
        gender,
        age,
        yearLevel_id,
        program_id,
        profileImageURL
      `,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      set({ loadingProfile: false });
      return { error };
    }

    if (!row) {
      set({ profile: null, role: null, loadingProfile: false });
      clearCache();
      return { error: null, profile: null, role: null };
    }

    let decryptedRow = row;

    try {
      decryptedRow = await decryptUserFields(row);
    } catch (decryptErr) {
      console.error("PROFILE DECRYPT ERROR:", decryptErr);
      set({ loadingProfile: false });
      return { error: decryptErr };
    }

    const role = normalizeRole(
      decryptedRow?.usertype_id === 1
        ? "admin"
        : decryptedRow?.usertype_id === 3
          ? "staff"
          : decryptedRow?.usertype_id === 4
            ? "chairperson"
            : decryptedRow?.usertype_id === 2
              ? "student"
              : null,
    );

    set({
      profile: decryptedRow,
      role,
      loadingProfile: false,
    });

    writeCache({
      userId,
      profile: decryptedRow,
      role,
      cachedAt: Date.now(),
    });

    return { error: null, profile: decryptedRow, role };
  },

  signup: async (
    email,
    password,
    studentId,
    firstname,
    middlename,
    lastname,
    gender,
    age,
    department,
    program,
    yearLevel_id,
    profileImage,
  ) => {
    try {
      set({ loadingAuth: true, authError: null });

      const cleanEmail = (email ?? "").trim().toLowerCase();
      const cleanStudentId = (studentId ?? "").trim();
      const cleanFirstname = (firstname ?? "").trim();
      const cleanMiddlename = (middlename ?? "").trim();
      const cleanLastname = (lastname ?? "").trim();
      const cleanGender = (gender ?? "").trim();

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

      if (signUpError) {
        set({ loadingAuth: false, authError: signUpError });
        return { error: signUpError };
      }

      const authUserId = signUpData?.user?.id;
      if (!authUserId) {
        set({ loadingAuth: false });
        return { error: new Error("No user id returned.") };
      }

      console.log("Signup successful. User ID:", authUserId);

      const sessionFromSignup = signUpData?.session ?? null;

      if (!sessionFromSignup?.user?.id) {
        set({ loadingAuth: false });
        return {
          error: null,
          redirectTo: "/login",
          message:
            "Account created. Please verify your email before logging in.",
        };
      }

      const uploadImage = async (file) => {
        const ext = file.name.split(".").pop() || "png";
        const filePath = `${authUserId}/avatar-${Date.now()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("profile-images")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type || "image/*",
          });

        if (upErr) {
          console.error("Image upload error:", upErr);
          return null;
        }

        return filePath;
      };

      let imagePath = null;
      if (profileImage) {
        imagePath = await uploadImage(profileImage);
      }

      const encryptedEmail = await encryptText(cleanEmail);
      const encryptedStudentId = await encryptText(cleanStudentId);
      const encryptedFirstname = await encryptText(cleanFirstname);
      const encryptedMiddlename = cleanMiddlename
        ? await encryptText(cleanMiddlename)
        : null;
      const encryptedLastname = await encryptText(cleanLastname);

      const payload = {
        user_id: authUserId,
        email: encryptedEmail,
        student_id: encryptedStudentId,
        usertype_id: 2,
        approvalStatus_id: 1,
        firstname: encryptedFirstname,
        middlename: encryptedMiddlename,
        lastname: encryptedLastname,
        gender: cleanGender,
        age: Number(age),
        yearLevel_id: Number(yearLevel_id),
        program_id: Number(program),
        profileImageURL: imagePath,
      };

      const { error: insertError } = await supabase
        .from("profiles")
        .insert(payload);

      if (insertError) {
        console.error("PROFILES INSERT ERROR:", insertError);
        set({ loadingAuth: false });
        return { error: insertError };
      }

      if (payload.yearLevel_id === 5) {
        const { error: pinErr } = await supabase
          .from("lock_screen_pin")
          .insert({
            user_id: authUserId,
            pin: "0000",
          });

        if (pinErr) {
          console.error("PIN INSERT ERROR:", pinErr);
          set({ loadingAuth: false });
          return { error: pinErr };
        }
      }

      set({
        session: sessionFromSignup,
        user: sessionFromSignup.user,
        loadingAuth: false,
      });

      const retryFetch = async (tries = 5) => {
        let lastErr = null;

        for (let i = 0; i < tries; i++) {
          const { error: fe } = await get().fetchProfile(authUserId);
          if (!fe) return { error: null };
          lastErr = fe;
          await new Promise((r) => setTimeout(r, 250));
        }

        return { error: lastErr || new Error("Profile not found") };
      };

      const { error: profileErr } = await retryFetch(6);

      if (profileErr) {
        console.error("PROFILE FETCH AFTER SIGNUP FAILED:", profileErr);
        set({ loadingAuth: false });
        return { error: profileErr };
      }

      set({ loadingAuth: false });
      return { error: null, redirectTo: roleRedirect(get().role) };
    } catch (e) {
      console.error("SIGNUP CATCH ERROR:", e);
      set({ loadingAuth: false });
      return { error: e };
    }
  },

  login: async (email, password) => {
    try {
      set({ loadingAuth: true, authError: null });

      const cleanEmail = (email ?? "").trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        console.error("LOGIN ERROR:", {
          status: error.status,
          name: error.name,
          message: error.message,
        });

        set({ loadingAuth: false });
        return { error };
      }

      const session = data?.session ?? null;

      if (!session?.user?.id) {
        console.warn("LOGIN WARNING: No session returned.");
        set({ loadingAuth: false });
        return { error: new Error("Login failed. No session returned.") };
      }

      set({
        session,
        user: session.user,
      });

      const { error: profileError } = await get().fetchProfile(session.user.id);

      if (profileError) {
        console.error("PROFILE FETCH ERROR AFTER LOGIN:", profileError);
        set({ loadingAuth: false });
        return { error: profileError };
      }

      set({ loadingAuth: false });

      return { error: null, redirectTo: roleRedirect(get().role) };
    } catch (err) {
      console.error("LOGIN CATCH ERROR:", err);
      set({ loadingAuth: false });
      return { error: err };
    }
  },

  logout: async () => {
    set({ loadingAuth: true });

    const { error } = await supabase.auth.signOut();

    set({
      session: null,
      user: null,
      profile: null,
      role: null,
      loadingAuth: false,
      loadingProfile: false,
      authError: null,
    });

    clearCache();
    return { error };
  },
}));
