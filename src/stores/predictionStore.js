// src/stores/predictionStore.js
/* eslint-disable no-empty */
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
import { decryptUserRow } from "@/lib/userCrypto";

const SEEN_ADMIN_SURVEY_KEY = "admin_seen_survey_created_at";

function readSeenSurvey() {
  try {
    return localStorage.getItem(SEEN_ADMIN_SURVEY_KEY) || "";
  } catch {
    return "";
  }
}

function writeSeenSurvey(value) {
  try {
    localStorage.setItem(SEEN_ADMIN_SURVEY_KEY, value || "");
  } catch {}
}

function mapPayloadToSurveyRow(payload) {
  return {
    gender: payload.gender ?? null,
    age: payload.age ?? null,
    course: payload.course ?? null,

    year_level: payload.year_level ?? null,
    working_student: payload.working_student ?? null,

    pwd: payload.pwd ?? null,

    living_arrangement: payload.living_arrangement ?? null,

    indigenous_group: payload.indigenous_group ?? null,

    bmi: payload.bmi ?? null,

    sleep_duration: payload.sleep_duration ?? null,
    breakfast_habit: payload.breakfast_habit ?? null,
    exercise_frequency: payload.exercise_frequency ?? null,

    smoking_status: payload.smoking_status ?? null,

    alcohol_consumption: payload.alcohol_consumption ?? null,

    academic_pressure: payload.academic_pressure ?? null,

    academic_dissatisfaction: payload.academic_dissatisfaction ?? null,

    schoolwork_spent_daily: payload.schoolwork_spent_daily ?? null,

    academic_workload: payload.academic_workload ?? null,

    social_support: payload.social_support ?? null,

    bullied: payload.bullied ?? null,

    romantic_personal_relationship_stress:
      payload.romantic_personal_relationship_stress ?? null,

    financial_stress: payload.financial_stress ?? null,
  };
}

function normalizeShapItems(x) {
  if (!Array.isArray(x)) return [];
  return x
    .map((it) => {
      const feature = it?.feature ?? it?.name ?? null;
      const shapValue = Number(it?.shap_value ?? it?.shap ?? 0);
      return {
        feature,
        value: it?.value ?? null,
        shap_value: Number.isFinite(shapValue) ? shapValue : 0,
      };
    })
    .filter((it) => it.feature);
}

function pickOnePredictionRow(sr) {
  const pr = sr?.prediction_result;
  if (!pr) return null;
  if (Array.isArray(pr)) return pr[0] || null;
  return pr;
}

function maxSurveyCreatedAt(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  let max = "";
  for (const r of rows) {
    const v = r?.survey?.created_at ? String(r.survey.created_at) : "";
    if (v && (!max || v > max)) max = v;
  }
  return max;
}

function safeText(v, fallback = "Unknown") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

function isAtRiskLabel(label) {
  const s = String(label ?? "")
    .trim()
    .toLowerCase();

  // supports imported CSV YES/NO
  if (s === "yes") return true;
  if (s === "no") return false;

  // supports app labels
  return s.includes("at-risk") || s.includes("at risk") || s.includes("risky");
}

function buildStackedDistribution({
  rows,
  fieldKey,
  outKeyName,
  sort = "desc",
  limit = null,
}) {
  const map = new Map();

  for (const r of rows) {
    const group = safeText(r?.survey?.[fieldKey]);
    const atRisk = isAtRiskLabel(r?.result?.depression_risk_result);

    if (!map.has(group)) {
      map.set(group, { group, atRisk: 0, notAtRisk: 0, count: 0 });
    }

    const item = map.get(group);
    item.count += 1;
    if (atRisk) item.atRisk += 1;
    else item.notAtRisk += 1;
  }

  let arr = Array.from(map.values()).map((x) => ({
    [outKeyName]: x.group,
    atRisk: x.atRisk,
    notAtRisk: x.notAtRisk,
    count: x.count,
  }));

  if (sort === "desc") {
    arr.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  } else if (sort === "asc") {
    arr.sort((a, b) => (a.count ?? 0) - (b.count ?? 0));
  }

  if (Number.isFinite(limit) && limit > 0) {
    arr = arr.slice(0, limit);
  }

  return arr;
}

function buildAgeDistribution(rows) {
  // If age is already grouped strings (like "18", "19", "22+"), keep it.
  // If age is number, bucket it.
  const map = new Map();

  for (const r of rows) {
    const raw = r?.survey?.age;
    let label = safeText(raw);

    const num = Number(raw);
    if (Number.isFinite(num)) {
      if (num >= 22) label = "22+";
      else label = String(num);
    }

    const atRisk = isAtRiskLabel(r?.result?.depression_risk_result);

    if (!map.has(label))
      map.set(label, { age: label, atRisk: 0, notAtRisk: 0, count: 0 });
    const it = map.get(label);
    it.count += 1;
    if (atRisk) it.atRisk += 1;
    else it.notAtRisk += 1;
  }

  const arr = Array.from(map.values());

  // Sort ages numerically where possible; keep "22+" last
  arr.sort((a, b) => {
    const ax = a.age === "22+" ? 999 : Number(a.age);
    const bx = b.age === "22+" ? 999 : Number(b.age);
    const an = Number.isFinite(ax) ? ax : 999;
    const bn = Number.isFinite(bx) ? bx : 999;
    return an - bn;
  });

  return arr.map((x) => ({
    age: x.age,
    atRisk: x.atRisk,
    notAtRisk: x.notAtRisk,
    count: x.count,
  }));
}

function buildBullyingDistribution(rows) {
  // Your chart expects: { name: "Bullied"|"Not Bullied", atRisk, notAtRisk }
  // We'll normalize common yes/no values, but still fallback to original text.
  const normalize = (v) => {
    const s = String(v ?? "")
      .trim()
      .toLowerCase();
    if (!s) return "Unknown";
    if (["yes", "y", "1", "true", "bullied"].includes(s)) return "Bullied";
    if (["no", "n", "0", "false", "not bullied", "not_bullied"].includes(s))
      return "Not Bullied";
    return safeText(v);
  };

  const map = new Map();

  for (const r of rows) {
    const label = normalize(r?.survey?.bullied);
    const atRisk = isAtRiskLabel(r?.result?.depression_risk_result);

    if (!map.has(label))
      map.set(label, { name: label, atRisk: 0, notAtRisk: 0, count: 0 });
    const it = map.get(label);
    it.count += 1;
    if (atRisk) it.atRisk += 1;
    else it.notAtRisk += 1;
  }

  // Prefer showing Bullied / Not Bullied first if present
  const arr = Array.from(map.values());
  const order = { Bullied: 1, "Not Bullied": 2, Unknown: 99 };

  arr.sort((a, b) => {
    const ao = order[a.name] ?? 50;
    const bo = order[b.name] ?? 50;
    if (ao !== bo) return ao - bo;
    return (b.count ?? 0) - (a.count ?? 0);
  });

  return arr.map((x) => ({
    name: x.name,
    atRisk: x.atRisk,
    notAtRisk: x.notAtRisk,
    count: x.count,
  }));
}

function canFetchAllByUserType(usertypeId) {
  const id = Number(usertypeId);
  return id === 1 || id === 3;
}

function isChairpersonUserType(usertypeId) {
  return Number(usertypeId) === 4;
}

/**
 * Role-based survey query:
 * - usertype_id 1 or 3 => fetch all
 * - usertype_id 4 => fetch only rows whose user.program_id matches the chairperson's program_id
 */

async function fetchSurveyResponsePagesByRole({
  profile,
  pageSize = 1000,
  selectClause,
  orderBy = "created_at",
  ascending = false,
}) {
  const usertypeId = Number(profile?.usertype_id ?? 0);

  // ✅ IMPORTANT: program is now TEXT (e.g., "BSCS")
  const chairProgramName = profile?.program?.program ?? null;

  let from = 0;
  let all = [];

  while (true) {
    const to = from + pageSize - 1;

    let query = supabase
      .from("survey_response")
      .select(selectClause)
      .order(orderBy, { ascending })
      .range(from, to);

    // ✅ ADMIN / STAFF → ALL DATA
    if (canFetchAllByUserType(usertypeId)) {
      // no filter
    }

    // ✅ CHAIRPERSON → FILTER BY COURSE TEXT
    else if (isChairpersonUserType(usertypeId)) {
      if (!chairProgramName) {
        throw new Error("Chairperson has no program.program value.");
      }

      // 🔥 THIS IS THE KEY CHANGE
      query = query.eq("course", chairProgramName);
    } else {
      throw new Error("Unauthorized role for dashboard/admin survey access.");
    }

    const { data, error } = await query;

    if (error) throw error;

    const batch = data || [];
    all = all.concat(batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

let _resultTimer = null;

export const usePredictionStore = create((set, get) => ({
  loading: false,
  success: false,
  error: null,

  prediction: null,
  label: null,
  probability: null,

  shapExpectedValue: null,
  shapItems: [],

  history: [],
  historyLoading: false,
  historyError: null,

  adminRows: [],
  adminLoading: false,
  adminError: null,

  _adminRealtimeChannel: null,
  _adminSubscribing: false,

  adminSurveyLatestCreatedAt: "",
  adminSurveyHasNew: false,
  adminSurveySeenCreatedAt: readSeenSurvey(),

  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,

  filteredResponses: [],
  filteredLoading: false,
  filteredError: null,

  _filteredRealtimeChannel: null,
  _filteredSubscribing: false,

  filteredAddBusyKey: "",
  filteredRemoveBusyKey: "",

  adminSurveyOpen: false,
  setAdminSurveyOpen: (open) => set({ adminSurveyOpen: !!open }),

  markAdminSurveySeen: async () => {
    // ensure latest exists (so we don't save "" and badge comes back)
    if (!get().adminSurveyLatestCreatedAt) {
      await get().fetchAllResponsesWithResults();
    }

    const latest = get().adminSurveyLatestCreatedAt || "";
    set({ adminSurveyHasNew: false, adminSurveySeenCreatedAt: latest });
    writeSeenSurvey(latest);
  },

  // markAdminSurveySeen: () => {
  //   const latest = get().adminSurveyLatestCreatedAt || "";
  //   set({ adminSurveyHasNew: false, adminSurveySeenCreatedAt: latest });
  //   writeSeenSurvey(latest);
  // },

  resultPopup: {
    open: false,
    type: "success",
    title: "",
    message: "",
  },

  showResultPopup: ({ type, title, message }) => {
    if (_resultTimer) clearTimeout(_resultTimer);

    set({
      resultPopup: {
        open: true,
        type: type || "success",
        title: title || (type === "error" ? "Submission failed" : "Submitted"),
        message: message || "",
      },
    });

    _resultTimer = setTimeout(() => {
      set((s) => ({ resultPopup: { ...s.resultPopup, open: false } }));
      _resultTimer = null;
    }, 5000);
  },

  closeResultPopup: () => {
    if (_resultTimer) clearTimeout(_resultTimer);
    _resultTimer = null;
    set((s) => ({ resultPopup: { ...s.resultPopup, open: false } }));
  },

  createPrediction: async (payload, opts = {}) => {
    const { saveToDb = true } = opts;

    const userId = useAuthStore.getState().user?.id || null;

    if (saveToDb && !userId) {
      set({ loading: false, success: false, error: "No authenticated user." });
      get().showResultPopup({
        type: "error",
        title: "Submission failed",
        message: "No authenticated user.",
      });
      return { error: new Error("No authenticated user."), data: null };
    }

    set({ loading: true, success: false, error: null });

    try {
      const API = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
      const res = await fetch(`${API}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status}. ${text}`);
      }

      const out = await res.json();

      const expected = out?.shap_local?.expected_value ?? null;
      const items = normalizeShapItems(out?.shap_local?.items);

      const riskText =
        typeof out?.label === "string"
          ? out.label
          : out?.prediction === 1
            ? "at-risk"
            : "low-risk";

      const probNum = Number(out?.probability);
      const prob = Number.isFinite(probNum) ? probNum : 0;

      set({
        prediction: out?.prediction ?? null,
        label: out?.label ?? null,
        probability: out?.probability ?? null,
        shapExpectedValue: expected,
        shapItems: items,
      });

      let surveyresponseId = null;

      if (saveToDb) {
        const surveyRow = {
          user_id: userId,
          ...mapPayloadToSurveyRow(payload),
        };

        const { data: sr, error: srErr } = await supabase
          .from("survey_response")
          .insert([surveyRow])
          .select("surveyresponse_id, created_at")
          .single();

        if (srErr) throw srErr;

        surveyresponseId = sr?.surveyresponse_id || null;

        const prRow = {
          surveyresponse_id: surveyresponseId,
          depression_risk_result: riskText,
          depression_risk_result_probability: prob,
          shap_expected_value: expected,
          shap_items: items,
        };

        const { error: prErr } = await supabase
          .from("prediction_result")
          .insert([prRow]);

        if (prErr) throw prErr;

        if (typeof get().fetchHistory === "function") get().fetchHistory();
      }

      set({ loading: false, success: true });

      get().showResultPopup({
        type: "success",
        title: "Survey submitted",
        message: "Your response was saved.",
      });

      return {
        error: null,
        data: {
          prediction: out?.prediction ?? null,
          label: out?.label ?? null,
          probability: out?.probability ?? null,
          shapExpectedValue: expected,
          shapItems: items,
          surveyresponseId,
        },
      };
    } catch (e) {
      const msg = e?.message || "Prediction failed";
      set({ loading: false, success: false, error: msg });

      get().showResultPopup({
        type: "error",
        title: "Submission failed",
        message: msg,
      });

      return { error: e, data: null };
    }
  },

  fetchHistory: async () => {
    const userId = useAuthStore.getState().user?.id || null;

    if (!userId) {
      set({ history: [], historyLoading: false, historyError: null });
      return;
    }

    set({ historyLoading: true, historyError: null });

    const { data, error } = await supabase
      .from("survey_response")
      .select(
        `
        surveyresponse_id,
        user_id,
        created_at,
        gender,
        age,
        course,
        year_level,
        working_student,
        pwd,
        living_arrangement,
        indigenous_group,
        bmi,
        sleep_duration,
        breakfast_habit,
        exercise_frequency,
        smoking_status,
        alcohol_consumption,
        schoolwork_spent_daily,
        social_support,
        romantic_personal_relationship_stress,
        bullied,
        academic_pressure,
        academic_dissatisfaction,
        academic_workload,
        financial_stress,
        prediction_result (
          result_id,
          surveyresponse_id,
          depression_risk_result,
          depression_risk_result_probability,
          shap_expected_value,
          shap_items,
          created_at
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      set({ history: [], historyLoading: false, historyError: error.message });
      return;
    }

    const rows = (data || []).map((sr) => {
      const pr = pickOnePredictionRow(sr);
      return { survey: sr, result: pr };
    });

    set({ history: rows, historyLoading: false, historyError: null });
  },

  fetchDashboardData: async () => {
    set({
      dashboardLoading: !get().dashboardData,
      dashboardError: null,
    });

    try {
      const profile = useUserStore.getState().profile;

      if (!profile) {
        throw new Error("User profile is not loaded yet.");
      }

      const all = await fetchSurveyResponsePagesByRole({
        profile,
        pageSize: 1000,
        selectClause: `
        surveyresponse_id,
        user_id,
        created_at,
        gender,
        age,
        course,
        year_level,
        working_student,
        pwd,
        living_arrangement,
        indigenous_group,
        bmi,
        sleep_duration,
        breakfast_habit,
        exercise_frequency,
        smoking_status,
        alcohol_consumption,
        schoolwork_spent_daily,
        academic_pressure,
        academic_dissatisfaction,
        academic_workload,
        financial_stress,
        social_support,
        bullied,
        romantic_personal_relationship_stress,
        prediction_result!inner (
          result_id,
          surveyresponse_id,
          depression_risk_result,
          depression_risk_result_probability,
          created_at
        )
      `,
        orderBy: "created_at",
        ascending: false,
      });

      const rows = (all || []).map((sr) => ({
        survey: sr,
        result: pickOnePredictionRow(sr),
      }));

      const totalStudents = rows.length;
      const depressionCases = rows.reduce((acc, r) => {
        return acc + (isAtRiskLabel(r?.result?.depression_risk_result) ? 1 : 0);
      }, 0);

      const depressionPercentage =
        totalStudents > 0
          ? Number(((depressionCases / totalStudents) * 100).toFixed(1))
          : 0;

      const trendChange = 23;

      const gender_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "gender",
        outKeyName: "gender",
        sort: "desc",
      }).map((x) => ({
        ...x,
        gender:
          x.gender === "1" || x.gender === 1
            ? "Male"
            : x.gender === "0" || x.gender === 0
              ? "Female"
              : x.gender,
      }));

      const age_riskDistribution = buildAgeDistribution(rows);

      const livingArrangement_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "living_arrangement",
        outKeyName: "arrangement",
        sort: "desc",
      });

      const workingStatus_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "working_student",
        outKeyName: "status",
        sort: "desc",
      }).map((x) => {
        const s = String(x.status ?? "")
          .trim()
          .toLowerCase();
        const label =
          s === "1" || s === "true" || s === "yes"
            ? "Working"
            : s === "0" || s === "false" || s === "no"
              ? "Not Working"
              : safeText(x.status);
        return { ...x, status: label };
      });

      const pwd_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "pwd",
        outKeyName: "name",
        sort: "desc",
      }).map((x) => {
        const s = String(x.name ?? "")
          .trim()
          .toLowerCase();
        const label =
          s === "1" || s === "true" || s === "yes"
            ? "Yes"
            : s === "0" || s === "false" || s === "no"
              ? "No"
              : safeText(x.name);
        return { ...x, name: label };
      });

      const indigenous_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "indigenous_group",
        outKeyName: "name",
        sort: "desc",
      }).map((x) => {
        const s = String(x.name ?? "")
          .trim()
          .toLowerCase();
        const label =
          s === "1" || s === "true" || s === "yes"
            ? "Yes"
            : s === "0" || s === "false" || s === "no"
              ? "No"
              : safeText(x.name);
        return { ...x, name: label };
      });

      const bmi_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "bmi",
        outKeyName: "category",
        sort: "desc",
      });

      const sleepDuration_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "sleep_duration",
        outKeyName: "duration",
        sort: "desc",
      });

      const breakfastHabit_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "breakfast_habit",
        outKeyName: "habit",
        sort: "desc",
      });

      const exerciseFrequency_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "exercise_frequency",
        outKeyName: "type",
        sort: "desc",
      });

      const smokingStatus_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "smoking_status",
        outKeyName: "status",
        sort: "desc",
      });

      const alcoholConsumption_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "alcohol_consumption",
        outKeyName: "frequency",
        sort: "desc",
      });

      const dailySchoolwork_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "schoolwork_spent_daily",
        outKeyName: "hours",
        sort: "desc",
      });

      const academicPressure_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "academic_pressure",
        outKeyName: "level",
        sort: "desc",
      });

      const academicDissatisfaction_riskDistribution = buildStackedDistribution(
        {
          rows,
          fieldKey: "academic_dissatisfaction",
          outKeyName: "level",
          sort: "desc",
        },
      );

      const academicWorkload_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "academic_workload",
        outKeyName: "level",
        sort: "desc",
      });

      const financialStress_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "financial_stress",
        outKeyName: "level",
        sort: "desc",
      });

      const socialSupport_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "social_support",
        outKeyName: "level",
        sort: "desc",
      });

      const bullying_riskDistribution = buildBullyingDistribution(rows);

      const relationshipStress_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "romantic_personal_relationship_stress",
        outKeyName: "level",
        sort: "desc",
      });

      const course_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "course",
        outKeyName: "course",
        sort: "desc",
        limit: 10,
      });

      const yearLevel_riskDistribution = buildStackedDistribution({
        rows,
        fieldKey: "year_level",
        outKeyName: "year",
        sort: "desc",
      });

      const depression = [
        { name: "At Risk", value: depressionCases, fill: "#ef4444" },
        {
          name: "Not At Risk",
          value: totalStudents - depressionCases,
          fill: "#10b981",
        },
      ];

      const dashboardData = {
        totalStudents,
        depressionCases,
        depressionPercentage,
        trendChange,

        gender_riskDistribution,
        age_riskDistribution,
        livingArrangement_riskDistribution,
        workingStatus_riskDistribution,
        pwd_riskDistribution,
        indigenous_riskDistribution,

        bmi_riskDistribution,
        sleepDuration_riskDistribution,
        breakfastHabit_riskDistribution,
        exerciseFrequency_riskDistribution,
        smokingStatus_riskDistribution,
        alcoholConsumption_riskDistribution,

        dailySchoolwork_riskDistribution,
        academicPressure_riskDistribution,
        academicDissatisfaction_riskDistribution,
        academicWorkload_riskDistribution,
        financialStress_riskDistribution,

        socialSupport_riskDistribution,
        bullying_riskDistribution,
        relationshipStress_riskDistribution,

        depression,
        course_riskDistribution,
        yearLevel_riskDistribution,
      };

      set({
        dashboardData,
        dashboardLoading: false,
        dashboardError: null,
      });
    } catch (e) {
      set({
        dashboardData: null,
        dashboardLoading: false,
        dashboardError: e?.message || "Failed to load dashboard data",
      });
    }
  },

  fetchAllResponsesWithResults: async () => {
    set({ adminLoading: true, adminError: null });

    try {
      const profile = useUserStore.getState().profile;

      if (!profile) {
        throw new Error("User profile is not loaded yet.");
      }

      const all = await fetchSurveyResponsePagesByRole({
        profile,
        pageSize: 1000,
        selectClause: `
        surveyresponse_id,
        user_id,
        created_at,
        gender,
        age,
        course,
        year_level,
        working_student,
        pwd,
        living_arrangement,
        indigenous_group,
        bmi,
        sleep_duration,
        breakfast_habit,
        exercise_frequency,
        smoking_status,
        alcohol_consumption,
        schoolwork_spent_daily,
        social_support,
        romantic_personal_relationship_stress,
        bullied,
        academic_pressure,
        academic_dissatisfaction,
        academic_workload,
        financial_stress,
        prediction_result!inner (
          result_id,
          surveyresponse_id,
          depression_risk_result,
          depression_risk_result_probability,
          shap_expected_value,
          shap_items,
          created_at
        ),
        user:profiles!survey_response_user_id_fkey (
          user_id,
          student_id,
          firstname,
          lastname,
          email,
          program_id
        )
      `,
        orderBy: "created_at",
        ascending: false,
      });

      const rows = await Promise.all(
        all.map(async (sr) => {
          const pr = pickOnePredictionRow(sr);

          let u = sr.user || null;

          if (u) {
            try {
              u = await decryptUserRow(u);
            } catch {
              u = sr.user || null;
            }
          }

          return {
            survey: sr,
            result: pr,
            user: u,
          };
        }),
      );

      const latestAt = maxSurveyCreatedAt(rows);
      const seenAt = get().adminSurveySeenCreatedAt || "";
      const hasNew = latestAt && (!seenAt || latestAt > seenAt);

      set({
        adminRows: rows,
        adminLoading: false,
        adminError: null,
        adminSurveyLatestCreatedAt: latestAt,
        adminSurveyHasNew: !!hasNew,
      });
    } catch (e) {
      set({
        adminRows: [],
        adminLoading: false,
        adminError: e?.message || "Failed to load responses",
      });
    }
  },

  subscribeAllResponsesRealtime: () => {
    if (get()._adminRealtimeChannel) return () => {};
    if (get()._adminSubscribing) return () => {};

    set({ _adminSubscribing: true });

    const ch = supabase
      .channel("admin-survey-results")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "survey_response" },
        (payload) => {
          const row = payload?.new;
          if (!row) return;

          const createdAt = row.created_at ? String(row.created_at) : "";
          const seenAt = get().adminSurveySeenCreatedAt || "";

          // ✅ NEW: if Survey Responses page is open, auto-mark seen (no indicator)
          if (createdAt && (!seenAt || createdAt > seenAt)) {
            if (get().adminSurveyOpen) {
              set((s) => ({
                adminSurveyHasNew: false,
                adminSurveyLatestCreatedAt:
                  s.adminSurveyLatestCreatedAt &&
                  s.adminSurveyLatestCreatedAt > createdAt
                    ? s.adminSurveyLatestCreatedAt
                    : createdAt,
                adminSurveySeenCreatedAt:
                  s.adminSurveySeenCreatedAt &&
                  s.adminSurveySeenCreatedAt > createdAt
                    ? s.adminSurveySeenCreatedAt
                    : createdAt,
              }));
              writeSeenSurvey(createdAt);
            } else {
              set((s) => ({
                adminSurveyHasNew: true,
                adminSurveyLatestCreatedAt:
                  s.adminSurveyLatestCreatedAt &&
                  s.adminSurveyLatestCreatedAt > createdAt
                    ? s.adminSurveyLatestCreatedAt
                    : createdAt,
              }));
            }
          }

          // keep your refreshes
          get().fetchAllResponsesWithResults();
          get().fetchDashboardData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prediction_result" },
        () => {
          get().fetchAllResponsesWithResults();
          get().fetchDashboardData();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _adminRealtimeChannel: ch, _adminSubscribing: false });
          get().fetchAllResponsesWithResults();
          get().fetchDashboardData();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _adminRealtimeChannel: null,
            _adminSubscribing: false,
            adminError:
              "Realtime connection failed. Enable replication for public.survey_response and public.prediction_result in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeAllResponsesRealtime();
  },

  unsubscribeAllResponsesRealtime: async () => {
    const ch = get()._adminRealtimeChannel;
    if (!ch) return;

    set({ _adminRealtimeChannel: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },

  fetchFilteredResponses: async () => {
    // set({ filteredLoading: true, filteredError: null });
    set({
      filteredLoading: (get().filteredResponses?.length ?? 0) === 0,
      filteredError: null,
    });

    const { data, error } = await supabase
      .from("filtered_response")
      .select(
        `
        filteredResponse_id,
        surveyresponse_id,
        result_id,
        created_at,
        course,
        survey:survey_response (
          surveyresponse_id,
          user_id,
          created_at,
          gender,
          age,
          course,
          year_level,
          working_student,
          pwd,
          living_arrangement,
          indigenous_group,
          bmi,
          sleep_duration,
          breakfast_habit,
          exercise_frequency,
          smoking_status,
          alcohol_consumption,
          schoolwork_spent_daily,
          social_support,
          romantic_personal_relationship_stress,
          bullied,
          academic_pressure,
          academic_dissatisfaction,
          academic_workload,
          financial_stress
        ),
        result:prediction_result (
          result_id,
          surveyresponse_id,
          depression_risk_result,
          depression_risk_result_probability,
          shap_expected_value,
          shap_items,
          created_at
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      set({
        filteredResponses: [],
        filteredLoading: false,
        filteredError: error.message,
      });
      return;
    }

    set({
      filteredResponses: data || [],
      filteredLoading: false,
      filteredError: null,
    });
  },

  fetchFilteredResponsesByCourse: async ({ course }) => {
    const selectedCourse = String(course || "").trim();

    if (!selectedCourse) {
      set({
        filteredResponses: [],
        filteredLoading: false,
        filteredError: "Course is required",
        currentFilteredCourse: null,
      });
      return;
    }

    set({
      filteredLoading:
        (get().filteredResponses?.length ?? 0) === 0 ||
        get().currentFilteredCourse !== selectedCourse,
      filteredError: null,
      currentFilteredCourse: selectedCourse,
    });

    const { data, error } = await supabase
      .from("filtered_response")
      .select(
        `
      filteredResponse_id,
      surveyresponse_id,
      result_id,
      created_at,
      course,
      survey:survey_response (
        surveyresponse_id,
        user_id,
        created_at,
        gender,
        age,
        course,
        year_level,
        working_student,
        pwd,
        living_arrangement,
        indigenous_group,
        bmi,
        sleep_duration,
        breakfast_habit,
        exercise_frequency,
        smoking_status,
        alcohol_consumption,
        schoolwork_spent_daily,
        social_support,
        romantic_personal_relationship_stress,
        bullied,
        academic_pressure,
        academic_dissatisfaction,
        academic_workload,
        financial_stress
      ),
      result:prediction_result (
        result_id,
        surveyresponse_id,
        depression_risk_result,
        depression_risk_result_probability,
        shap_expected_value,
        shap_items,
        created_at
      )
    `,
      )
      .eq("course", selectedCourse)
      .order("created_at", { ascending: false });

    if (error) {
      set({
        filteredResponses: [],
        filteredLoading: false,
        filteredError: error.message,
      });
      return;
    }

    set({
      filteredResponses: data || [],
      filteredLoading: false,
      filteredError: null,
    });
  },

  addFilteredResponse: async ({ surveyresponseId, resultId, course }) => {
    const sid = String(surveyresponseId || "").trim();
    if (!sid)
      return { error: new Error("Missing surveyresponseId"), data: null };

    set({ filteredAddBusyKey: sid });

    try {
      let finalCourse = String(course || "").trim();

      if (!finalCourse) {
        const { data: sr, error: srErr } = await supabase
          .from("survey_response")
          .select("course")
          .eq("surveyresponse_id", sid)
          .single();

        if (srErr) throw srErr;
        finalCourse = String(sr?.course || "").trim();
      }

      const { data: existing, error: exErr } = await supabase
        .from("filtered_response")
        .select("filteredResponse_id, surveyresponse_id")
        .eq("surveyresponse_id", sid)
        .limit(1);

      if (exErr) throw exErr;

      if (Array.isArray(existing) && existing.length > 0) {
        set({ filteredAddBusyKey: "" });
        await get().fetchFilteredResponses();
        return { error: null, data: existing[0] };
      }

      const insertRow = {
        surveyresponse_id: sid,
        result_id: resultId || null,
        course: finalCourse || null,
      };

      const { data, error } = await supabase
        .from("filtered_response")
        .insert([insertRow])
        .select(
          "filteredResponse_id, surveyresponse_id, result_id, created_at, course",
        )
        .single();

      if (error) throw error;

      set({ filteredAddBusyKey: "" });
      await get().fetchFilteredResponses();

      return { error: null, data };
    } catch (e) {
      set({
        filteredAddBusyKey: "",
        filteredError: e?.message || "Insert failed",
      });
      return { error: e, data: null };
    }
  },

  removeFilteredResponse: async ({ filteredResponseId }) => {
    const fid = String(filteredResponseId || "").trim();
    if (!fid)
      return { error: new Error("Missing filteredResponseId"), data: null };

    set({ filteredRemoveBusyKey: fid });

    try {
      const { error } = await supabase
        .from("filtered_response")
        .delete()
        .eq("filteredResponse_id", fid);

      if (error) throw error;

      set({ filteredRemoveBusyKey: "" });
      await get().fetchFilteredResponses();
      return { error: null, data: true };
    } catch (e) {
      set({
        filteredRemoveBusyKey: "",
        filteredError: e?.message || "Delete failed",
      });
      return { error: e, data: null };
    }
  },

  subscribeFilteredResponsesRealtime: () => {
    if (get()._filteredRealtimeChannel) return () => {};
    if (get()._filteredSubscribing) return () => {};

    set({ _filteredSubscribing: true });

    const ch = supabase
      .channel("admin-filtered-response")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "filtered_response" },
        () => {
          const currentCourse = get().currentFilteredCourse;

          if (currentCourse) {
            get().fetchFilteredResponsesByCourse({ course: currentCourse });
          } else {
            get().fetchFilteredResponses();
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          set({ _filteredRealtimeChannel: ch, _filteredSubscribing: false });
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          set({
            _filteredRealtimeChannel: null,
            _filteredSubscribing: false,
            filteredError:
              "Realtime connection failed. Enable replication for public.filtered_response in Supabase Dashboard.",
          });
        }
      });

    return () => get().unsubscribeFilteredResponsesRealtime();
  },

  unsubscribeFilteredResponsesRealtime: async () => {
    const ch = get()._filteredRealtimeChannel;
    if (!ch) return;

    set({ _filteredRealtimeChannel: null });

    try {
      await supabase.removeChannel(ch);
    } catch {}
  },

  resetPrediction: () =>
    set({
      loading: false,
      error: null,
      prediction: null,
      label: null,
      probability: null,
      shapExpectedValue: null,
      shapItems: [],
    }),
}));
