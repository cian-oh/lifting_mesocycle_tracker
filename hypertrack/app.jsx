const { useState, useEffect, useCallback } = React;

const STORAGE_KEY = "hypertrack_cian_v1";
const SUPABASE_CONFIG_KEY = "hypertrack_cian_supabase_v1";
const SUPABASE_TABLE = "hypertrack_mesos";
const SUPPORT_FUNCTION_NAME = "create-support-checkout-session";
const SUPPORT_PRESET_AMOUNTS = [5, 10, 20];
const DEFAULT_SUPPORT_AMOUNT = 10;
const MIN_SUPPORT_AMOUNT_EUR = 1;
const MAX_SUPPORT_AMOUNT_EUR = 500;
const DEFAULT_INCREMENT = 2.5;
const DEFAULT_UNIT = "kg";
const BODYWEIGHT_METADATA_KEY = "hyperphases_profile";
const DEPLOY_CONFIG = window.__HYPERTRACK_CONFIG__ || {};
const MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Rear Delts",
];
const LEG_MUSCLES = ["Quads", "Hamstrings", "Glutes", "Calves"];
const UPPER_MUSCLES = ["Chest", "Back", "Shoulders", "Biceps", "Triceps"];
const ARM_MUSCLES = ["Biceps", "Triceps", "Rear Delts"];
const DEFAULT_DAY_SLOTS = [
  { label: "Upper", muscles: UPPER_MUSCLES },
  { label: "Lower", muscles: LEG_MUSCLES },
  { label: "Push", muscles: ["Chest", "Shoulders", "Triceps"] },
  { label: "Pull", muscles: ["Back", "Biceps", "Rear Delts"] },
];
const SPLIT_PRESETS = [
  {
    key: "upper_lower_push_pull",
    name: "Upper / Lower / Push / Pull",
    description: "Four-day structure with both upper/lower coverage and focused push/pull work.",
    daySlots: DEFAULT_DAY_SLOTS,
  },
  {
    key: "upper_lower_4",
    name: "Upper / Lower 4 Day",
    description: "Classic repeating upper/lower split with A and B days across the week.",
    daySlots: [
      { label: "Upper A", muscles: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"] },
      { label: "Lower A", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      { label: "Upper B", muscles: ["Chest", "Back", "Shoulders", "Biceps", "Rear Delts"] },
      { label: "Lower B", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
    ],
  },
  {
    key: "ppl_6",
    name: "Push / Pull / Legs 6 Day",
    description: "High-frequency six-day split with two passes through push, pull, and legs.",
    daySlots: [
      { label: "Push A", muscles: ["Chest", "Shoulders", "Triceps"] },
      { label: "Pull A", muscles: ["Back", "Biceps", "Rear Delts"] },
      { label: "Legs A", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      { label: "Push B", muscles: ["Chest", "Shoulders", "Triceps"] },
      { label: "Pull B", muscles: ["Back", "Biceps", "Rear Delts"] },
      { label: "Legs B", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
    ],
  },
  {
    key: "arnold_6",
    name: "Arnold Split",
    description: "Bodybuilding-style rotation with chest/back, shoulders/arms, and legs repeated twice.",
    daySlots: [
      { label: "Chest & Back A", muscles: ["Chest", "Back"] },
      { label: "Shoulders & Arms A", muscles: ["Shoulders", "Biceps", "Triceps", "Rear Delts"] },
      { label: "Legs A", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
      { label: "Chest & Back B", muscles: ["Chest", "Back"] },
      { label: "Shoulders & Arms B", muscles: ["Shoulders", "Biceps", "Triceps", "Rear Delts"] },
      { label: "Legs B", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
    ],
  },
  {
    key: "bro_5",
    name: "Bro Split",
    description: "Five focused days with one primary emphasis area per session.",
    daySlots: [
      { label: "Chest", muscles: ["Chest"] },
      { label: "Back", muscles: ["Back", "Rear Delts"] },
      { label: "Shoulders", muscles: ["Shoulders"] },
      { label: "Arms", muscles: ARM_MUSCLES },
      { label: "Legs", muscles: LEG_MUSCLES },
    ],
  },
  {
    key: "full_body_3",
    name: "Full Body 3 Day",
    description: "Three total-body sessions with broad coverage each week.",
    daySlots: [
      { label: "Full Body A", muscles: ["Chest", "Back", "Shoulders", "Quads", "Hamstrings"] },
      { label: "Full Body B", muscles: ["Chest", "Back", "Biceps", "Triceps", "Glutes", "Calves"] },
      { label: "Full Body C", muscles: ["Chest", "Back", "Shoulders", "Quads", "Hamstrings", "Rear Delts"] },
    ],
  },
];
const MEV_MRV = {
  Chest: [6, 20],
  Back: [8, 25],
  Shoulders: [6, 20],
  Biceps: [4, 20],
  Triceps: [4, 18],
  Quads: [8, 22],
  Hamstrings: [4, 16],
  Glutes: [4, 16],
  Calves: [4, 16],
  "Rear Delts": [4, 18],
};
const BIG_MUSCLES = new Set(["Quads", "Hamstrings", "Glutes", "Back", "Chest"]);
const EQUIPMENT_OPTIONS = [
  "Barbell & rack",
  "Dumbbells",
  "Cable machine",
  "Machines",
  "Smith machine",
  "Bodyweight only",
];
const DEFAULT_EQUIPMENT = [
  "Barbell & rack",
  "Dumbbells",
  "Cable machine",
  "Machines",
];
const UNIT_OPTIONS = ["kg", "lb"];
const FEEDBACK_OPTIONS = {
  pump: [
    { value: 0, label: "😴 None" },
    { value: 1, label: "😐 Weak" },
    { value: 2, label: "👍 Good" },
    { value: 3, label: "🔥 Excellent" },
  ],
  soreness: [
    { value: 0, label: "✅ None" },
    { value: 1, label: "😌 Mild" },
    { value: 2, label: "😬 Moderate" },
    { value: 3, label: "🤕 Severe" },
  ],
  performance: [
    { value: 0, label: "📉 Worse" },
    { value: 1, label: "➡️ Same" },
    { value: 2, label: "📈 Better" },
    { value: 3, label: "🚀 Best Ever" },
  ],
};
const STEP_LABELS = {
  fresh: [0, 1, 2],
  resume: [0, 1, 2, 3],
};
const BODYWEIGHT_EXERCISES = new Set(["Pull-Up", "Dip"]);
const PUBLIC_FEATURES = [
  {
    eyebrow: "Split",
    title: "Build your own phase",
    copy: "Use popular templates or tune the split yourself.",
    stat: "Custom splits",
  },
  {
    eyebrow: "Progression",
    title: "Progress from real effort",
    copy: "Weekly RIR targets and prior logs shape the next load.",
    stat: "RIR-led",
  },
  {
    eyebrow: "History",
    title: "Keep every block connected",
    copy: "History, trends, and archived mesocycles stay with your account.",
    stat: "Archive built in",
  },
];
const PUBLIC_EVIDENCE = [
  {
    source: "Refalo et al. · Sports Medicine · 2023",
    title: "Near-failure is highly effective",
    copy: "Always going to absolute failure does not appear necessary for hypertrophy.",
  },
  {
    source: "Grgic et al. · Journal of Sport and Health Science · 2022",
    title: "RIR helps manage fatigue",
    copy: "Stopping short of failure can still work very well when effort is prescribed well.",
  },
];

function loadSupabaseConfig() {
  const deployed = {
    url: DEPLOY_CONFIG.supabaseUrl || "",
    anonKey: DEPLOY_CONFIG.supabaseAnonKey || "",
  };
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (!raw) return deployed;
    const parsed = JSON.parse(raw);
    return {
      url: parsed?.url || deployed.url,
      anonKey: parsed?.anonKey || deployed.anonKey,
    };
  } catch (error) {
    console.error(error);
    return deployed;
  }
}

function saveSupabaseConfig(config) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
}

const EQUIPMENT_EXERCISES = {
  Chest: {
    "Barbell & rack": ["Bench Press", "Incline Bench Press", "Paused Bench Press", "Spoto Press", "Floor Press"],
    Dumbbells: ["DB Flat Press", "DB Incline Press", "DB Fly", "Neutral-Grip DB Press", "Decline DB Press"],
    "Cable machine": ["Cable Fly", "High-to-Low Crossover", "Single-Arm Press", "Low-to-High Cable Fly", "Cable Press"],
    Machines: ["Chest Press", "Pec Deck", "Incline Press Machine", "Plate-Loaded Chest Press", "Iso-Lateral Chest Press"],
    "Smith machine": ["Smith Incline Press", "Smith Flat Press", "Smith Close-Grip Incline Press"],
    "Bodyweight only": ["Dip", "Push-Up", "Deficit Push-Up", "Feet-Elevated Push-Up", "Ring Push-Up", "Tempo Push-Up"],
  },
  Back: {
    "Barbell & rack": ["Barbell Row", "Pendlay Row", "Rack Pull", "Landmine Row", "Seal Row"],
    Dumbbells: ["DB Row", "Chest-Supported DB Row", "Meadows Row", "Incline Bench DB Row", "Kroc Row"],
    "Cable machine": ["Lat Pulldown", "Seated Cable Row", "Straight-Arm Pulldown", "Single-Arm Cable Row", "Neutral-Grip Pulldown"],
    Machines: ["Machine Row", "Hammer Row", "High Row Machine", "T-Bar Row", "Chest-Supported T-Bar Row", "Assisted Pull-Up"],
    "Smith machine": ["Smith Row"],
    "Bodyweight only": ["Inverted Row", "Towel Row", "Pull-Up", "Chin-Up", "Table Row"],
  },
  Shoulders: {
    "Barbell & rack": ["Barbell OHP", "Push Press", "Behind-the-Neck Press"],
    Dumbbells: ["DB Lateral Raise", "Arnold Press", "Seated DB Press", "Lean-Away Lateral Raise", "DB Front Raise"],
    "Cable machine": ["Cable Lateral Raise", "Face Pull", "Cable Y-Raise", "Dual Cable Lateral Raise", "Cable Front Raise"],
    Machines: ["Shoulder Press Machine", "Lateral Raise Machine", "Machine OHP"],
    "Smith machine": ["Smith High Incline Press"],
    "Bodyweight only": ["Pike Push-Up", "Handstand Push-Up Progression"],
  },
  Biceps: {
    "Barbell & rack": ["Barbell Curl", "EZ-Bar Curl", "Drag Curl"],
    Dumbbells: ["Alternating DB Curl", "Hammer Curl", "Incline DB Curl", "Spider Curl", "Cross-Body Hammer Curl"],
    "Cable machine": ["Cable Curl", "Bayesian Curl", "Rope Hammer Curl", "High Cable Curl", "Single-Arm Cable Curl"],
    Machines: ["Preacher Curl Machine", "Biceps Curl Machine", "Machine Preacher Curl"],
    "Smith machine": ["Smith Drag Curl"],
    "Bodyweight only": ["Towel Curl Iso", "Chin-Up Negative"],
  },
  Triceps: {
    "Barbell & rack": ["Close-Grip Bench Press", "Skull Crusher", "JM Press"],
    Dumbbells: ["DB Skull Crusher", "Overhead DB Extension", "Tate Press", "Rolling DB Extension"],
    "Cable machine": ["Rope Pushdown", "Overhead Cable Extension", "Straight-Bar Pushdown", "Single-Arm Pushdown", "Cross-Body Cable Extension"],
    Machines: ["Dip Machine", "Triceps Extension Machine", "Assisted Dip"],
    "Smith machine": ["Smith Close-Grip Bench"],
    "Bodyweight only": ["Bench Dip", "Diamond Push-Up", "Bodyweight Triceps Extension"],
  },
  Quads: {
    "Barbell & rack": ["Back Squat", "Front Squat", "High-Bar Squat", "Paused Squat", "Zercher Squat"],
    Dumbbells: ["Goblet Squat", "Bulgarian Split Squat", "DB Reverse Lunge", "DB Step-Up", "Heel-Elevated Goblet Squat"],
    "Cable machine": ["Cable Squat", "Cable Split Squat", "Cable Reverse Lunge"],
    Machines: ["Leg Press", "Leg Extension", "Hack Squat", "Pendulum Squat", "Belt Squat"],
    "Smith machine": ["Smith Squat", "Smith Split Squat", "Smith Cyclist Squat"],
    "Bodyweight only": ["Walking Lunge", "Sissy Squat", "Tempo Squat", "Split Squat", "Step-Up"],
  },
  Hamstrings: {
    "Barbell & rack": ["Romanian Deadlift", "Good Morning", "Stiff-Leg Deadlift", "Snatch-Grip RDL"],
    Dumbbells: ["DB Romanian Deadlift", "Single-Leg RDL", "DB Good Morning"],
    "Cable machine": ["Cable Leg Curl", "Cable Pull-Through", "Single-Leg Cable Curl"],
    Machines: ["Lying Leg Curl", "Seated Leg Curl", "Nordic Curl Machine", "Glute Ham Raise"],
    "Smith machine": ["Smith Romanian Deadlift"],
    "Bodyweight only": ["Nordic Curl", "Sliding Leg Curl", "Single-Leg Sliding Curl"],
  },
  Glutes: {
    "Barbell & rack": ["Barbell Hip Thrust", "Barbell Lunge", "Barbell Glute Bridge", "Deficit Reverse Lunge"],
    Dumbbells: ["DB Hip Thrust", "DB Step-Up", "DB Walking Lunge", "DB Bulgarian Split Squat"],
    "Cable machine": ["Cable Kickback", "Cable Pull-Through", "Cable Abduction", "Cable Reverse Lunge"],
    Machines: ["Hip Thrust Machine", "Glute Drive", "Abduction Machine", "45-Degree Back Extension"],
    "Smith machine": ["Smith Hip Thrust", "Smith Reverse Lunge", "Smith Split Squat"],
    "Bodyweight only": ["Single-Leg Glute Bridge", "Frog Pump", "Step-Up", "Skater Squat"],
  },
  Calves: {
    "Barbell & rack": ["Standing Calf Raise", "Donkey Calf Raise", "Seated Barbell Calf Raise"],
    Dumbbells: ["Single-Leg DB Calf Raise", "Seated DB Calf Raise", "Farmer Calf Raise"],
    "Cable machine": ["Cable Calf Raise"],
    Machines: ["Standing Calf Machine", "Seated Calf Machine", "Leg Press Calf Raise", "Donkey Calf Machine"],
    "Smith machine": ["Smith Standing Calf Raise"],
    "Bodyweight only": ["Single-Leg Calf Raise", "Tempo Calf Raise", "Bent-Knee Calf Raise"],
  },
  "Rear Delts": {
    "Barbell & rack": ["Rear Delt Row", "Wide-Grip Row", "Snatch-Grip High Pull"],
    Dumbbells: ["Reverse Fly", "Chest-Supported Rear Delt Raise", "Incline Rear Delt Swing"],
    "Cable machine": ["Face Pull", "Cable Rear Delt Fly", "Cable Y-Raise", "Cross-Body Rear Delt Fly"],
    Machines: ["Reverse Pec Deck", "Rear Delt Machine", "Chest-Supported Reverse Fly"],
    "Smith machine": ["Smith High Row"],
    "Bodyweight only": ["Prone Y-Raise", "Wall Rear Delt Raise", "Reverse Snow Angel"],
  },
};

function createSlotId(prefix = "slot") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function scrollToSection(id) {
  try {
    window.document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch (error) {
    console.error(error);
  }
}

function instantiatePreset(presetKey) {
  const preset = SPLIT_PRESETS.find((item) => item.key === presetKey) || SPLIT_PRESETS[0];
  return {
    splitName: preset.name,
    presetKey: preset.key,
    daySlots: preset.daySlots.map((slot, idx) => ({
      id: createSlotId(`${preset.key}_${idx + 1}`),
      label: slot.label,
      muscles: [...slot.muscles],
    })),
  };
}

function normalizeDaySlots(daySlots) {
  const filtered = (daySlots || [])
    .map((slot, idx) => ({
      id: slot.id || createSlotId(`custom_${idx + 1}`),
      label: (slot.label || "").trim() || `Day ${idx + 1}`,
      muscles: Array.from(new Set((slot.muscles || []).filter((muscle) => MUSCLES.includes(muscle)))),
    }))
    .filter((slot) => slot.muscles.length > 0);

  return filtered.length
    ? filtered
    : DEFAULT_DAY_SLOTS.map((slot, idx) => ({
        id: createSlotId(`default_${idx + 1}`),
        label: slot.label,
        muscles: [...slot.muscles],
      }));
}

function getMesoDaySlots(meso) {
  if (meso?.split?.daySlots?.length) {
    return normalizeDaySlots(meso.split.daySlots);
  }
  return DEFAULT_DAY_SLOTS.map((slot, idx) => ({
    id: slot.label,
    label: slot.label,
    muscles: [...slot.muscles],
    index: idx,
  }));
}

function getActiveMusclesFromSlots(daySlots) {
  return MUSCLES.filter((muscle) => daySlots.some((slot) => slot.muscles.includes(muscle)));
}

function getSlotById(meso, slotId) {
  return getMesoDaySlots(meso).find((slot) => slot.id === slotId) || null;
}

function getSlotForSession(meso, session) {
  if (session.daySlotId) {
    return getSlotById(meso, session.daySlotId);
  }
  const fallbackLabel = session.dayLabel || session.dayType;
  return getMesoDaySlots(meso).find((slot) => slot.label === fallbackLabel) || null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundToStep(value, step = 0.5) {
  return Math.round(value / step) * step;
}

function formatKg(value) {
  if (value === "" || value == null || Number.isNaN(Number(value))) {
    return "";
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? `${parsed}` : parsed.toFixed(1);
}

function getUnitLabel(unit) {
  return unit === "lb" ? "lb" : "kg";
}

function getUnitStep(unit) {
  return unit === "lb" ? 1 : 0.5;
}

function normalizeBodyweightValue(value) {
  if (value === "" || value == null) return "";
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return "";
  return roundToStep(parsed, 0.5);
}

function convertWeightUnit(value, fromUnit, toUnit) {
  if (value === "" || value == null || Number.isNaN(Number(value))) return "";
  if (fromUnit === toUnit) return roundToStep(Number(value), getUnitStep(toUnit));
  const kgValue = fromUnit === "lb" ? Number(value) / 2.2046226218 : Number(value);
  const converted = toUnit === "lb" ? kgValue * 2.2046226218 : kgValue;
  return roundToStep(converted, getUnitStep(toUnit));
}

function getBodyweightProfile(user) {
  const profile = user?.user_metadata?.[BODYWEIGHT_METADATA_KEY] || {};
  const value = normalizeBodyweightValue(profile.currentBodyweight);
  const unit = UNIT_OPTIONS.includes(profile.bodyweightUnit) ? profile.bodyweightUnit : DEFAULT_UNIT;
  return {
    currentBodyweight: value,
    bodyweightUnit: unit,
  };
}

function getCurrentBodyweightForUnit(user, unit) {
  const profile = getBodyweightProfile(user);
  if (profile.currentBodyweight === "") return "";
  return formatKg(convertWeightUnit(profile.currentBodyweight, profile.bodyweightUnit, unit));
}

function isBodyweightExercise(exerciseName) {
  return BODYWEIGHT_EXERCISES.has(exerciseName);
}

function getExerciseTracking(meso, exerciseName) {
  const tracking = meso?.exerciseTracking?.[exerciseName] || {};
  return {
    bodyweight: tracking.bodyweight === true || (tracking.bodyweight == null && isBodyweightExercise(exerciseName)),
  };
}

function isBodyweightBlock(meso, blockOrExercise) {
  if (!blockOrExercise) return false;
  if (typeof blockOrExercise === "string") {
    return getExerciseTracking(meso, blockOrExercise).bodyweight;
  }
  if (blockOrExercise.bodyweightMode != null) {
    return Boolean(blockOrExercise.bodyweightMode);
  }
  return getExerciseTracking(meso, blockOrExercise.exercise).bodyweight;
}

function targetRIRForWeek(week) {
  if (week <= 1) return 3;
  if (week <= 3) return 2;
  if (week <= 5) return 1;
  return 0;
}

function snapToIncrement(weight, increment) {
  const inc = Number(increment) > 0 ? Number(increment) : DEFAULT_INCREMENT;
  return roundToStep(Math.round(weight / inc) * inc, 0.5);
}

function calcVolumeForWeek(week, totalWeeks) {
  const ratio = totalWeeks <= 1 ? 0 : (week - 1) / (totalWeeks - 1);
  return Object.fromEntries(
    MUSCLES.map((muscle) => {
      const [mev, mrv] = MEV_MRV[muscle];
      return [muscle, Math.round(mev + ratio * (mrv - mev) * 0.6)];
    })
  );
}

function getAvailableExercises(muscle, equipment) {
  const seen = new Set();
  const list = [];
  Array.from(new Set([...(equipment || []), "Bodyweight only"])).forEach((item) => {
    (EQUIPMENT_EXERCISES[muscle]?.[item] || []).forEach((exercise) => {
      if (!seen.has(exercise)) {
        seen.add(exercise);
        list.push(exercise);
      }
    });
  });
  if (!list.length) {
    list.push(...Object.values(EQUIPMENT_EXERCISES[muscle] || {}).flat().slice(0, 3));
  }
  return list;
}

function getAllExerciseOptions(muscle) {
  return Array.from(
    new Set(Object.values(EQUIPMENT_EXERCISES[muscle] || {}).flat())
  ).sort((a, b) => a.localeCompare(b));
}

function normalizeExerciseName(name) {
  return (name || "").replace(/\s+/g, " ").trim();
}

function getRecommendedExercisePlan(equipment) {
  return Object.fromEntries(
    MUSCLES.map((muscle) => [muscle, getAvailableExercises(muscle, equipment).slice(0, 2)])
  );
}

function createStorageAdapter() {
  const external = window.storage;
  if (external && typeof external.get === "function" && typeof external.set === "function") {
    return {
      async get() {
        const data = await external.get(STORAGE_KEY);
        return data?.meso || null;
      },
      async set(meso) {
        await external.set(STORAGE_KEY, { meso });
      },
      async clear() {
        await external.set(STORAGE_KEY, { meso: null });
      },
    };
  }
  return {
    async get() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.meso || null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    async set(meso) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ meso }));
    },
    async clear() {
      localStorage.removeItem(STORAGE_KEY);
    },
  };
}

const storage = createStorageAdapter();

function createSupabaseClient(config) {
  if (!config?.url || !config?.anonKey || !window.supabase?.createClient) {
    return null;
  }
  try {
    return window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

function formatAuthError(error, fallback) {
  const message = String(error?.message || "").trim();
  if (!message) return fallback;
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Check your email and confirm your address before signing in.";
  }
  if (lower.includes("user already registered")) {
    return "That email already has an account. Use Sign In instead.";
  }
  if (lower.includes("password should be at least")) {
    return message.replace("should be", "must be");
  }

  return message;
}

function withUpdatedAt(meso) {
  return {
    ...meso,
    updatedAt: new Date().toISOString(),
  };
}

function buildMesoName(meso) {
  return (
    meso?.name ||
    meso?.splitName ||
    meso?.split?.name ||
    "Untitled Mesocycle"
  );
}

function hydrateRemoteMeso(row) {
  if (!row?.meso_json) return null;
  const payload = row.meso_json;
  return {
    ...payload,
    remoteId: row.id,
    status: row.status || payload.status || "active",
    name: row.name || payload.name || buildMesoName(payload),
    startedAt: row.started_at || payload.startedAt || payload.started || null,
    completedAt: row.completed_at || payload.completedAt || null,
    updatedAt: row.updated_at || payload.updatedAt || payload.started || null,
  };
}

function buildRemoteMesoRecord(userId, meso, status = "active") {
  const payload = withUpdatedAt({
    ...meso,
    ownerUserId: userId,
    status,
    name: buildMesoName(meso),
  });
  return {
    user_id: userId,
    status,
    name: buildMesoName(payload),
    started_at: payload.startedAt || payload.started || payload.updatedAt,
    completed_at:
      status === "archived" ? payload.completedAt || payload.archivedAt || payload.updatedAt : null,
    updated_at: payload.updatedAt,
    meso_json: payload,
  };
}

async function fetchRemoteMeso(client, userId, status = "active") {
  const { data, error } = await client
    .from(SUPABASE_TABLE)
    .select("id, status, name, started_at, completed_at, updated_at, meso_json")
    .eq("user_id", userId)
    .eq("status", status)
    .maybeSingle();
  if (error) throw error;
  return hydrateRemoteMeso(data);
}

async function fetchArchivedMesos(client, userId) {
  const { data, error } = await client
    .from(SUPABASE_TABLE)
    .select("id, status, name, started_at, completed_at, updated_at, meso_json")
    .eq("user_id", userId)
    .eq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(hydrateRemoteMeso).filter(Boolean);
}

async function pushRemoteMeso(client, userId, meso, status = "active") {
  const record = buildRemoteMesoRecord(userId, meso, status);
  let query = client.from(SUPABASE_TABLE);
  let data;
  let error;
  if (meso?.remoteId) {
    ({ data, error } = await query
      .update(record)
      .eq("id", meso.remoteId)
      .eq("user_id", userId)
      .select("id, status, name, started_at, completed_at, updated_at, meso_json")
      .single());
  } else {
    ({ data, error } = await query
      .insert(record)
      .select("id, status, name, started_at, completed_at, updated_at, meso_json")
      .single());
  }
  if (error) throw error;
  return hydrateRemoteMeso(data);
}

async function archiveRemoteMeso(client, userId, meso) {
  if (!meso?.remoteId) return null;
  return pushRemoteMeso(client, userId, {
    ...meso,
    archivedAt: new Date().toISOString(),
    completedAt:
      meso.completedAt || (meso.week > meso.totalWeeks ? new Date().toISOString() : null),
  }, "archived");
}

function getLastPerformance(sessions, muscle, exerciseName) {
  for (let idx = sessions.length - 1; idx >= 0; idx -= 1) {
    const session = sessions[idx];
    const blocks = session?.log?.[muscle] || [];
    for (const block of blocks) {
      if (block.exercise !== exerciseName) continue;
      for (let setIdx = block.sets.length - 1; setIdx >= 0; setIdx -= 1) {
        const set = block.sets[setIdx];
        if (!set.done) continue;
        return {
          weight: set.weight === "" ? "" : Number(set.weight),
          reps: Number(set.reps) || 10,
          rir: Number(set.rir),
          bodyweightMode: Boolean(block.bodyweightMode) || isBodyweightExercise(block.exercise),
        };
      }
    }
  }
  return null;
}

function calcNextWeight({ sessions, muscle, exerciseName, increment, week }) {
  const previous = getLastPerformance(sessions, muscle, exerciseName);
  if (!previous || previous.weight === "" || Number.isNaN(Number(previous.weight))) {
    return "";
  }
  const targetRIR = targetRIRForWeek(week);
  const actualRIR = Number(previous.rir);
  if (Number.isNaN(actualRIR)) {
    return formatKg(previous.weight);
  }
  const pct = BIG_MUSCLES.has(muscle) ? 0.025 : 0.015;
  let nextWeight = previous.weight;
  if (actualRIR > targetRIR) {
    nextWeight = previous.weight * (1 + pct);
  } else if (actualRIR < targetRIR) {
    nextWeight = previous.weight * (1 - pct * 0.5);
  }
  return formatKg(snapToIncrement(nextWeight, increment));
}

function buildSeedSession(exercises, prevWeights, increments) {
  const log = {};
  MUSCLES.forEach((muscle) => {
    log[muscle] = (exercises[muscle] || []).map((exercise) => {
      const prev = prevWeights?.[muscle]?.[exercise] || {};
      return {
        exercise,
        increment: increments?.[exercise] || DEFAULT_INCREMENT,
        bodyweightMode: isBodyweightExercise(exercise),
        notes: "",
        sets: [
          {
            id: Date.now() + Math.random(),
            weight: prev.weight || "",
            reps: Number(prev.reps) || 10,
            rir: prev.rir === "" ? "" : Number(prev.rir),
            done: Boolean(prev.weight || prev.reps || prev.rir !== ""),
          },
        ],
      };
    });
  });
  return {
    dayType: "__seed__",
    week: 0,
    date: new Date().toISOString(),
    synthetic: true,
    log,
    feedback: {},
    notes: "",
  };
}

function createSyntheticSession(daySlot, week) {
  return {
    daySlotId: daySlot.id,
    dayLabel: daySlot.label,
    dayType: daySlot.label,
    week,
    date: new Date().toISOString(),
    synthetic: true,
    log: {},
    feedback: {},
    notes: "",
  };
}

function buildSessionState(meso, daySlotId, cloudUser) {
  const daySlot = getSlotById(meso, daySlotId);
  if (!daySlot) return null;
  const muscles = daySlot.muscles;
  const log = {};
  const targetRIR = targetRIRForWeek(meso.week);
  const currentBodyweight = getCurrentBodyweightForUnit(cloudUser, meso.unit || DEFAULT_UNIT);
  muscles.forEach((muscle) => {
    const selected = meso.exercises[muscle] || [];
    if (!selected.length) return;
    const setsPerExercise = Math.max(2, Math.round((meso.weeklyVolume[muscle] || MEV_MRV[muscle][0]) / Math.max(1, selected.length)));
    log[muscle] = selected.map((exercise) => {
      const increment = meso.increments[exercise] || DEFAULT_INCREMENT;
      const bodyweightMode = getExerciseTracking(meso, exercise).bodyweight;
      const suggestedWeight = calcNextWeight({
        sessions: meso.sessions,
        muscle,
        exerciseName: exercise,
        increment,
        week: meso.week,
      });
      const previous = getLastPerformance(meso.sessions, muscle, exercise);
      return {
        exercise,
        increment,
        bodyweightMode,
        notes: "",
        sets: Array.from({ length: setsPerExercise }).map((_, idx) => ({
          id: Date.now() + Math.random() + idx,
          weight: idx === 0 && suggestedWeight !== "" ? suggestedWeight : "",
          reps: previous?.reps || 10,
          rir: targetRIR,
          done: false,
        })),
      };
    });
  });
  if (!Object.keys(log).length) return null;
  return {
    daySlotId: daySlot.id,
    dayLabel: daySlot.label,
    dayType: daySlot.label,
    week: meso.week,
    started: new Date().toISOString(),
    log,
    feedback: {},
    notes: "",
  };
}

function isMuscleDone(sessionState, muscle) {
  const blocks = sessionState?.log?.[muscle] || [];
  return blocks.length > 0 && blocks.every((block) => block.sets.some((set) => set.done));
}

function isMuscleRated(sessionState, muscle) {
  const item = sessionState?.feedback?.[muscle];
  return (
    item &&
    item.pump !== undefined &&
    item.soreness !== undefined &&
    item.performance !== undefined
  );
}

function getWeekDoneDaySlotIds(meso, week) {
  const slots = getMesoDaySlots(meso);
  return slots
    .filter((slot) =>
      meso.sessions.some(
        (session) =>
          session.week === week &&
          (session.daySlotId === slot.id ||
            session.dayLabel === slot.label ||
            session.dayType === slot.label)
      )
    )
    .map((slot) => slot.id);
}

function getNextOpenDaySlot(meso) {
  const doneSlotIds = getWeekDoneDaySlotIds(meso, meso.week);
  return getMesoDaySlots(meso).find((slot) => !doneSlotIds.includes(slot.id)) || null;
}

function advanceWeekIfNeeded(meso) {
  const doneThisWeek = getWeekDoneDaySlotIds(meso, meso.week);
  if (doneThisWeek.length === getMesoDaySlots(meso).length) {
    return { ...meso, week: Math.min(meso.week + 1, meso.totalWeeks + 1) };
  }
  return meso;
}

function applyVolumeProgression(meso, sessionState) {
  const nextVolume = { ...meso.weeklyVolume };
  Object.keys(sessionState.log || {}).forEach((muscle) => {
    const feedback = sessionState.feedback[muscle] || {};
    let delta = 2;
    if ((feedback.pump ?? 0) <= 1) delta = 3;
    if ((feedback.soreness ?? 0) >= 3) delta = -2;
    else if ((feedback.soreness ?? 0) >= 2) delta = Math.min(delta, 0);
    const [mev, mrv] = MEV_MRV[muscle];
    nextVolume[muscle] = clamp((nextVolume[muscle] || mev) + delta, mev, mrv);
  });
  return nextVolume;
}

function normalizeExercisesAndIncrements(exercises, increments) {
  const normalizedExercises = {};
  const normalizedIncrements = { ...increments };
  MUSCLES.forEach((muscle) => {
    normalizedExercises[muscle] = (exercises[muscle] || []).slice(0, 3);
    normalizedExercises[muscle].forEach((exercise) => {
      if (!normalizedIncrements[exercise]) {
        normalizedIncrements[exercise] = DEFAULT_INCREMENT;
      }
    });
  });
  return { normalizedExercises, normalizedIncrements };
}

function getCompletedSetRowsForExercise(sessions, muscle, exerciseName) {
  const rows = [];
  (sessions || []).forEach((session) => {
    const blocks = session?.log?.[muscle] || [];
    blocks.forEach((block) => {
      if (block.exercise !== exerciseName) return;
      const bodyweightMode = Boolean(block.bodyweightMode) || isBodyweightExercise(block.exercise);
      const completedSets = (block.sets || []).filter(
        (set) =>
          set.done &&
          (bodyweightMode || (set.weight !== "" && !Number.isNaN(Number(set.weight))))
      );
      if (!completedSets.length) return;
      rows.push({
        week: session.week,
        date: session.date,
        synthetic: Boolean(session.synthetic),
        bodyweightMode,
        notes: block.notes || "",
        sessionNotes: session.notes || "",
        sets: completedSets.map((set) => ({
          weight: set.weight === "" ? "" : Number(set.weight),
          reps: Number(set.reps) || 0,
          rir: set.rir === "" ? "" : Number(set.rir),
        })),
      });
    });
  });
  return rows;
}

function getExerciseHistoryRows(sessions, muscle, exerciseName) {
  return getCompletedSetRowsForExercise(sessions, muscle, exerciseName).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

function getExerciseTrendRows(meso, options = {}) {
  const includeSynthetic = options.includeSynthetic === true;
  const trends = [];
  const seen = new Set();
  (meso?.sessions || []).forEach((session) => {
    if (!includeSynthetic && session.synthetic) return;
    Object.entries(session.log || {}).forEach(([muscle, blocks]) => {
      (blocks || []).forEach((block) => {
        const key = `${muscle}::${block.exercise}`;
        if (seen.has(key)) return;
        seen.add(key);
        const history = getCompletedSetRowsForExercise(
          meso.sessions.filter((item) => includeSynthetic || !item.synthetic),
          muscle,
          block.exercise
        );
        if (history.length < 1) return;
        const chronological = [...history].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        const first = chronological[0]?.sets?.find((set) => set.weight !== "" && !Number.isNaN(Number(set.weight)));
        const latest = [...(chronological[chronological.length - 1]?.sets || [])]
          .reverse()
          .find((set) => set.weight !== "" && !Number.isNaN(Number(set.weight)));
        if (!first || !latest) return;
        trends.push({
          key,
          muscle,
          exercise: block.exercise,
          firstWeight: first.weight,
          latestWeight: latest.weight,
          delta: latest.weight - first.weight,
          entries: chronological.length,
        });
      });
    });
  });
  return trends.sort((a, b) => b.delta - a.delta);
}

function getMesoSummaryStats(meso) {
  const daySlots = getMesoDaySlots(meso);
  const doneThisWeek = getWeekDoneDaySlotIds(meso, Math.min(meso.week, meso.totalWeeks)).length;
  const totalDays = daySlots.length || 1;
  const trends = getExerciseTrendRows(meso);
  const upward = trends.filter((item) => item.delta > 0);
  return {
    completionPct: clamp((doneThisWeek / totalDays) * 100, 0, 100),
    mesoPct: clamp((((Math.min(meso.week, meso.totalWeeks) - 1) + doneThisWeek / totalDays) / Math.max(1, meso.totalWeeks)) * 100, 0, 100),
    daysLeft: Math.max(0, totalDays - doneThisWeek),
    upwardCount: upward.length,
    topMovers: trends.slice(0, 3),
    strongest: upward[0] || trends[0] || null,
  };
}

function getPhaseGuide(meso) {
  if (!meso) return null;
  const currentWeek = Math.min(meso.week, meso.totalWeeks);
  const ratio = meso.totalWeeks <= 1 ? 1 : (currentWeek - 1) / Math.max(1, meso.totalWeeks - 1);
  if (meso.week > meso.totalWeeks) {
    return {
      label: "Review",
      title: "Block Complete",
      copy: "Deload, review what progressed best, and carry the strongest structure into the next phase.",
      focus: "Use the archive to keep what worked and trim what did not.",
      tone: "good",
    };
  }
  if (currentWeek <= 1) {
    return {
      label: "Foundation",
      title: "Establish stable baselines",
      copy: "Week 1 is about matching the target RIR cleanly so later progression is built on reliable performance.",
      focus: "Keep exercise selection stable and log honest RIR.",
      tone: "neutral",
    };
  }
  if (currentWeek === meso.totalWeeks) {
    return {
      label: "Peak",
      title: "Final hard week",
      copy: "This is the sharpest phase of the block. Push only where performance supports it and expect fatigue to rise.",
      focus: "Finish the week, then deload or restart from the archive.",
      tone: "warn",
    };
  }
  if (ratio < 0.5) {
    return {
      label: "Build",
      title: "Accumulate productive work",
      copy: "Performance should climb while recovery stays manageable. Let volume move up only when the feedback justifies it.",
      focus: "Own the target RIR before chasing extra load.",
      tone: "good",
    };
  }
  return {
    label: "Push",
    title: "Drive progression with discipline",
    copy: "Work is heavy enough now that fatigue matters. Keep the structure stable and earn progression from repeatable effort.",
    focus: "Push load when the last completed work was easier than target.",
    tone: "warn",
  };
}

function getLatestFeedbackForMuscle(meso, muscle) {
  for (let idx = (meso?.sessions || []).length - 1; idx >= 0; idx -= 1) {
    const session = meso.sessions[idx];
    if (session.synthetic) continue;
    const feedback = session?.feedback?.[muscle];
    if (!feedback) continue;
    return {
      week: session.week,
      date: session.date,
      feedback,
    };
  }
  return null;
}

function getRecoveryStatusForMuscle(meso, muscle) {
  const latest = getLatestFeedbackForMuscle(meso, muscle);
  if (!latest) {
    return {
      tone: "neutral",
      label: "Awaiting feedback",
      detail: "Log and rate this muscle once to unlock recovery guidance.",
    };
  }
  const { pump = 0, soreness = 0, performance = 1 } = latest.feedback;
  if (soreness >= 3 || performance === 0) {
    return {
      tone: "warn",
      label: "Recover",
      detail: "Recent fatigue is high. Hold back on extra work and prioritize quality execution.",
    };
  }
  if (soreness >= 2 || performance === 1) {
    return {
      tone: "neutral",
      label: "Hold",
      detail: "Recovery is mixed. Keep volume steady until performance improves.",
    };
  }
  if (pump >= 2 && performance >= 2 && soreness <= 1) {
    return {
      tone: "good",
      label: "Ready",
      detail: "Recovery looks good. This muscle can keep pushing the plan.",
    };
  }
  if (pump <= 1 && soreness <= 1) {
    return {
      tone: "good",
      label: "Ready",
      detail: "Fatigue is controlled. Stay on plan and let progression come from execution.",
    };
  }
  return {
    tone: "neutral",
    label: "Hold",
    detail: "Keep the current dose of work until feedback gets clearer.",
  };
}

function getRecoveryOverview(meso, muscles) {
  const items = (muscles || []).map((muscle) => ({
    muscle,
    ...getRecoveryStatusForMuscle(meso, muscle),
  }));
  return {
    items,
    ready: items.filter((item) => item.label === "Ready").length,
    hold: items.filter((item) => item.label === "Hold").length,
    recover: items.filter((item) => item.label === "Recover").length,
  };
}

function getProgressionGuide(meso, muscle, exerciseName, bodyweightModeOverride) {
  const previous = getLastPerformance(meso?.sessions || [], muscle, exerciseName);
  const target = targetRIRForWeek(meso?.week || 1);
  const unitLabel = getUnitLabel(meso?.unit);
  const bodyweightMode =
    bodyweightModeOverride != null
      ? bodyweightModeOverride
      : previous?.bodyweightMode || getExerciseTracking(meso, exerciseName).bodyweight;
  if (!previous || (!bodyweightMode && (previous.weight === "" || Number.isNaN(Number(previous.weight))))) {
    return {
      tone: "neutral",
      label: "Establish baseline",
      detail: "Log one completed set for this movement to unlock progression guidance.",
    };
  }
  const actual = Number(previous.rir);
  if (bodyweightMode) {
    if (Number.isNaN(actual)) {
      return {
        tone: "neutral",
        label: "Repeat and log RIR",
        detail:
          previous.weight === "" || Number(previous.weight) === 0
            ? `Last completed set was ${previous.reps} reps at bodyweight. Add RIR to refine the next recommendation.`
            : `Last completed set was BW + ${formatKg(previous.weight)} ${unitLabel} for ${previous.reps} reps. Add RIR to refine the next recommendation.`,
      };
    }
    if (actual > target) {
      return {
        tone: "good",
        label: "Add reps or load",
        detail:
          previous.weight === "" || Number(previous.weight) === 0
            ? `Last set was easier than target at ${actual} RIR vs ${target}. Beat reps or add external load if available.`
            : `Last set was easier than target at ${actual} RIR vs ${target}. Stay with BW + ${formatKg(previous.weight)} ${unitLabel} and beat reps, or add more load.`,
      };
    }
    if (actual < target) {
      return {
        tone: "warn",
        label: "Keep bodyweight steady",
        detail: `Last set was harder than target at ${actual} RIR vs ${target}. Clean up execution before pushing more.`,
      };
    }
    return {
      tone: "neutral",
      label: "Repeat and beat reps",
      detail: `Last set matched the ${target} RIR target. Stay at bodyweight and improve reps or execution.`,
    };
  }
  const nextWeight = calcNextWeight({
    sessions: meso?.sessions || [],
    muscle,
    exerciseName,
    increment: meso?.increments?.[exerciseName] || DEFAULT_INCREMENT,
    week: meso?.week || 1,
  });
  if (Number.isNaN(actual)) {
    return {
      tone: "neutral",
      label: "Use last load as baseline",
      detail: `Last completed set was ${formatKg(previous.weight)} ${unitLabel} for ${previous.reps} reps. Add RIR to sharpen the next recommendation.`,
    };
  }
  if (actual > target) {
    return {
      tone: "good",
      label: "Increase load",
      detail: `Last set was easier than target at ${actual} RIR vs ${target}. Aim for ${nextWeight} ${unitLabel} next time.`,
    };
  }
  if (actual < target) {
    return {
      tone: "warn",
      label: "Reduce slightly",
      detail: `Last set was harder than target at ${actual} RIR vs ${target}. Aim for ${nextWeight} ${unitLabel} next time.`,
    };
  }
  return {
    tone: "neutral",
    label: "Hold and beat reps",
    detail: `Last set matched the ${target} RIR target. Repeat ${nextWeight} ${unitLabel} and improve reps or execution.`,
  };
}

function getCoachToneStyles(tone) {
  if (tone === "good") {
    return {
      borderColor: "rgba(24, 166, 111, 0.22)",
      background: "rgba(24, 166, 111, 0.08)",
      color: "var(--ok)",
    };
  }
  if (tone === "warn") {
    return {
      borderColor: "rgba(232, 122, 0, 0.24)",
      background: "rgba(232, 122, 0, 0.08)",
      color: "var(--warn)",
    };
  }
  return {
    borderColor: "rgba(38, 112, 255, 0.18)",
    background: "rgba(38, 112, 255, 0.08)",
    color: "var(--accent)",
  };
}

function formatEuro(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return "";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
  }).format(Number(amount));
}

function normalizeSupportAmount(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) return null;
  const rounded = Math.round(value * 100) / 100;
  if (rounded < MIN_SUPPORT_AMOUNT_EUR || rounded > MAX_SUPPORT_AMOUNT_EUR) return null;
  return rounded;
}

async function getStripeClient() {
  const key = DEPLOY_CONFIG.stripePublishableKey || "";
  if (!key || !window.Stripe) return null;
  return window.Stripe(key);
}

async function createSupportCheckoutSession({ supabaseClient, amount, email }) {
  const normalized = normalizeSupportAmount(amount);
  if (!normalized) {
    throw new Error("Enter a valid support amount.");
  }
  const payload = {
    amount: normalized,
    currency: "eur",
    email,
    returnUrl: `${window.location.origin}${window.location.pathname}?support=success`,
  };
  if (supabaseClient?.functions?.invoke) {
    const { data, error } = await supabaseClient.functions.invoke(SUPPORT_FUNCTION_NAME, {
      body: payload,
    });
    if (error) {
      throw new Error(error.message || "Unable to start checkout.");
    }
    return data;
  }
  const baseUrl = DEPLOY_CONFIG.supabaseUrl || "";
  const anonKey = DEPLOY_CONFIG.supabaseAnonKey || "";
  if (!baseUrl || !anonKey) {
    throw new Error("Supabase configuration is incomplete.");
  }
  const headers = {
    "content-type": "application/json",
    apikey: anonKey,
  };
  try {
    const session = await supabaseClient?.auth?.getSession?.();
    const accessToken = session?.data?.session?.access_token;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    } else {
      headers.Authorization = `Bearer ${anonKey}`;
    }
  } catch (error) {
    console.error(error);
    headers.Authorization = `Bearer ${anonKey}`;
  }
  const response = await fetch(`${baseUrl}/functions/v1/${SUPPORT_FUNCTION_NAME}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(responsePayload?.error || responsePayload?.message || "Unable to start checkout.");
  }
  return responsePayload;
}

function App() {
  const [screen, setScreen] = useState("loading");
  const [meso, setMeso] = useState(null);
  const [archivedMesos, setArchivedMesos] = useState([]);
  const [toast, setToast] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const [incrementTarget, setIncrementTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveDetail, setArchiveDetail] = useState(null);
  const [setupTemplate, setSetupTemplate] = useState(null);
  const [manageExercisesOpen, setManageExercisesOpen] = useState(false);
  const [cloudConfig, setCloudConfig] = useState(() => loadSupabaseConfig());
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [cloudUser, setCloudUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("support") === "success";
    } catch (error) {
      console.error(error);
      return false;
    }
  });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!supportSuccess) return undefined;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("support") === "success") {
        url.searchParams.delete("support");
        window.history.replaceState({}, "", url.toString());
      }
    } catch (error) {
      console.error(error);
    }
    return undefined;
  }, [supportSuccess]);

  useEffect(() => {
    setAuthReady(false);
    const client = createSupabaseClient(cloudConfig);
    setSupabaseClient(client);
    if (!client) {
      setCloudUser(null);
      setAuthReady(true);
      setScreen("auth");
      setCloudStatus(
        cloudConfig.url || cloudConfig.anonKey
          ? "Connection details are incomplete."
          : ""
      );
      return undefined;
    }
    let active = true;
    client.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error(error);
        setCloudStatus("Account services are unavailable right now.");
        setAuthReady(true);
        return;
      }
      setCloudUser(data.user || null);
      setCloudStatus(data.user ? `You are now signed in as ${data.user.email}` : "");
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setCloudUser(session?.user || null);
      setCloudStatus(session?.user ? `You are now signed in as ${session.user.email}` : "");
      setAuthReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [cloudConfig]);

  const loadUserMesos = useCallback(async () => {
    if (!supabaseClient || !cloudUser) return;
    try {
      setCloudBusy(true);
      const [activeMeso, archived] = await Promise.all([
        fetchRemoteMeso(supabaseClient, cloudUser.id, "active"),
        fetchArchivedMesos(supabaseClient, cloudUser.id),
      ]);
      setMeso(activeMeso);
      setArchivedMesos(archived);
      setCloudStatus(
        activeMeso
          ? `You are now signed in as ${cloudUser.email}`
          : `You are now signed in as ${cloudUser.email}. Start your first mesocycle.`
      );
      setScreen((current) => {
        if (current === "setup" || current === "session") return current;
        if (supportSuccess) return "support";
        return activeMeso ? "home" : "welcome";
      });
    } catch (error) {
      console.error(error);
      setCloudStatus("Cloud load failed.");
      setScreen("auth");
    } finally {
      setCloudBusy(false);
    }
  }, [cloudUser, supabaseClient, supportSuccess]);

  useEffect(() => {
    if (!authReady) return;
    if (!cloudUser) {
      setMeso(null);
      setArchivedMesos([]);
      setSessionState(null);
      setScreen("auth");
      return;
    }
    loadUserMesos();
  }, [authReady, cloudUser, loadUserMesos]);

  const persistMeso = useCallback(
    async (nextMeso, status = "active") => {
      if (!supabaseClient || !cloudUser) return nextMeso;
      try {
        setCloudBusy(true);
        const payload = await pushRemoteMeso(supabaseClient, cloudUser.id, nextMeso, status);
        if (status === "active") {
          setMeso(payload);
        }
        setCloudStatus(`Cloud updated ${new Date(payload.updatedAt).toLocaleString()}`);
        return payload;
      } catch (error) {
        console.error(error);
        setCloudStatus("Cloud save failed.");
        throw error;
      } finally {
        setCloudBusy(false);
      }
    },
    [cloudUser, supabaseClient]
  );

  const createNewActiveMeso = useCallback(
    async (nextMeso) => {
      let archivedCopy = null;
      if (meso?.remoteId && meso.status !== "archived") {
        archivedCopy = await archiveRemoteMeso(supabaseClient, cloudUser.id, {
          ...meso,
          archivedAt: new Date().toISOString(),
          completedAt:
            meso.completedAt || (meso.week > meso.totalWeeks ? new Date().toISOString() : null),
        });
      }
      const created = await persistMeso(
        {
          ...nextMeso,
          remoteId: null,
          ownerUserId: cloudUser.id,
          status: "active",
        },
        "active"
      );
      if (archivedCopy) {
        setArchivedMesos((current) => [archivedCopy, ...current.filter((item) => item.remoteId !== archivedCopy.remoteId)]);
      }
      return created;
    },
    [cloudUser, meso, persistMeso, supabaseClient]
  );

  const handleSaveCloudConfig = useCallback((config) => {
    saveSupabaseConfig(config);
    setCloudConfig(config);
    setToast("Connection saved");
  }, []);

  const handleSignUp = useCallback(
    async (email, password) => {
      const client = createSupabaseClient(cloudConfig);
      if (!client) {
        setCloudStatus("Connection is not configured yet.");
        return;
      }
      if (!email || !password) {
        setCloudStatus("Enter email and password");
        return;
      }
      try {
        setCloudBusy(true);
        const { data, error } = await client.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data?.user && data?.session) {
          setCloudStatus(`You are now signed in as ${email}`);
          setToast("Account created");
        } else {
          setCloudStatus("Account created. Check email confirmation if required.");
          setToast("Sign-up submitted");
        }
      } catch (error) {
        console.error(error);
        setCloudStatus(formatAuthError(error, "Sign-up failed."));
      } finally {
        setCloudBusy(false);
      }
    },
    [cloudConfig]
  );

  const handleSignIn = useCallback(
    async (email, password) => {
      const client = createSupabaseClient(cloudConfig);
      if (!client) {
        setCloudStatus("Connection is not configured yet.");
        return;
      }
      if (!email || !password) {
        setCloudStatus("Enter email and password");
        return;
      }
      try {
        setCloudBusy(true);
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setCloudStatus(`You are now signed in as ${email}`);
        setToast("Signed in");
      } catch (error) {
        console.error(error);
        setCloudStatus(formatAuthError(error, "Sign-in failed."));
      } finally {
        setCloudBusy(false);
      }
    },
    [cloudConfig]
  );

  const handleForgotPassword = useCallback(
    async (email) => {
      const client = createSupabaseClient(cloudConfig);
      if (!client) {
        setCloudStatus("Connection is not configured yet.");
        return;
      }
      if (!email) {
        setCloudStatus("Enter your email address to reset your password");
        return;
      }
      try {
        setCloudBusy(true);
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setCloudStatus(`If that account exists, a password reset email has been sent to ${email}.`);
        setToast("Password reset email sent");
      } catch (error) {
        console.error(error);
        setCloudStatus(formatAuthError(error, "Password reset request failed."));
      } finally {
        setCloudBusy(false);
      }
    },
    [cloudConfig]
  );

  const handleSignOut = useCallback(async () => {
    if (!supabaseClient) return;
    try {
      setCloudBusy(true);
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      setSessionState(null);
      setMeso(null);
      setArchivedMesos([]);
      setCloudUser(null);
      setCloudStatus("You have been signed out.");
      setScreen("auth");
    } catch (error) {
      console.error(error);
      setCloudStatus("Sign-out failed");
    } finally {
      setCloudBusy(false);
    }
  }, [supabaseClient]);

  const handleNewMeso = useCallback(async () => {
    const confirmed = window.confirm("Start building a new mesocycle? Your current block will move to the archive when you save the new one.");
    if (!confirmed) return;
    setSessionState(null);
    setSetupTemplate(null);
    setScreen("setup");
  }, []);

  const handleStartFromArchivedTemplate = useCallback((templateMeso) => {
    setArchiveDetail(null);
    setArchiveOpen(false);
    setSessionState(null);
    setSetupTemplate(templateMeso);
    setScreen("setup");
  }, []);

  const handleSaveBodyweight = useCallback(
    async (currentBodyweight, bodyweightUnit) => {
      if (!supabaseClient || !cloudUser) return;
      const normalizedValue = normalizeBodyweightValue(currentBodyweight);
      const nextUnit = UNIT_OPTIONS.includes(bodyweightUnit) ? bodyweightUnit : DEFAULT_UNIT;
      try {
        setCloudBusy(true);
        const metadata = {
          ...(cloudUser.user_metadata || {}),
          [BODYWEIGHT_METADATA_KEY]: {
            currentBodyweight: normalizedValue === "" ? "" : normalizedValue,
            bodyweightUnit: nextUnit,
          },
        };
        const { data, error } = await supabaseClient.auth.updateUser({
          data: metadata,
        });
        if (error) throw error;
        if (data?.user) {
          setCloudUser(data.user);
        }
        setCloudStatus(
          normalizedValue === ""
            ? "Bodyweight profile cleared."
            : `Current bodyweight saved at ${formatKg(normalizedValue)} ${nextUnit}.`
        );
        setToast("Bodyweight updated");
      } catch (error) {
        console.error(error);
        setCloudStatus("Bodyweight update failed");
      } finally {
        setCloudBusy(false);
      }
    },
    [cloudUser, supabaseClient]
  );

  const openSupportScreen = useCallback(() => {
    setAccountOpen(false);
    setScreen("support");
  }, []);

  const openContactScreen = useCallback(() => {
    setAccountOpen(false);
    setScreen("contact");
  }, []);

  const closeSupportScreen = useCallback(() => {
    setSupportSuccess(false);
    setScreen(meso ? "home" : "welcome");
  }, [meso]);

  const startSession = useCallback(
    (daySlotId) => {
      if (!meso) return;
      const done = getWeekDoneDaySlotIds(meso, meso.week);
      if (done.includes(daySlotId)) return;
      const nextState = buildSessionState(meso, daySlotId, cloudUser);
      if (!nextState) return;
      setSessionState(nextState);
      setScreen("session");
    },
    [cloudUser, meso]
  );

  const saveSession = useCallback(async () => {
    if (!meso || !sessionState) return;
    const sessionRecord = {
      daySlotId: sessionState.daySlotId,
      dayLabel: sessionState.dayLabel,
      dayType: sessionState.dayLabel,
      week: meso.week,
      date: new Date().toISOString(),
      log: sessionState.log,
      feedback: sessionState.feedback,
      notes: sessionState.notes || "",
    };
    let nextMeso = {
      ...meso,
      sessions: [...meso.sessions, sessionRecord],
      weeklyVolume: applyVolumeProgression(meso, sessionState),
    };
    nextMeso = advanceWeekIfNeeded(nextMeso);
    if (nextMeso.week > nextMeso.totalWeeks && !nextMeso.completedAt) {
      nextMeso = { ...nextMeso, completedAt: new Date().toISOString() };
    }
    await persistMeso(nextMeso);
    setSessionState(null);
    setScreen("home");
    setToast("Session saved");
  }, [meso, persistMeso, sessionState]);

  const handleSwap = useCallback(
    async (nextExercise) => {
      if (!meso || !sessionState || !swapTarget) return;
      const { muscle, exIdx } = swapTarget;
      const currentExercise = sessionState.log[muscle][exIdx].exercise;
      const increment = meso.increments[nextExercise] || DEFAULT_INCREMENT;
      const bodyweightMode = getExerciseTracking(meso, nextExercise).bodyweight;
      const nextSession = {
        ...sessionState,
        log: {
          ...sessionState.log,
          [muscle]: sessionState.log[muscle].map((block, idx) =>
            idx === exIdx
              ? {
                  exercise: nextExercise,
                  increment,
                  bodyweightMode,
                  sets: block.sets.map((set) => ({
                    ...set,
                    weight: "",
                    done: false,
                  })),
                }
              : block
          ),
        },
      };
      const nextExercises = {
        ...meso.exercises,
        [muscle]: meso.exercises[muscle].map((exercise, idx) => (idx === exIdx ? nextExercise : exercise)),
      };
      const nextMeso = {
        ...meso,
        exercises: nextExercises,
        increments: {
          ...meso.increments,
          [nextExercise]: increment,
          [currentExercise]: meso.increments[currentExercise] || DEFAULT_INCREMENT,
        },
        exerciseTracking: {
          ...(meso.exerciseTracking || {}),
          [nextExercise]: meso.exerciseTracking?.[nextExercise] || {
            bodyweight: bodyweightMode,
          },
        },
      };
      setSessionState(nextSession);
      await persistMeso(nextMeso);
      setSwapTarget(null);
      setToast("Exercise swapped");
    },
    [meso, persistMeso, sessionState, swapTarget]
  );

  const handleExerciseTrackingUpdate = useCallback(
    async (muscle, exIdx, exerciseName, bodyweightMode) => {
      if (!meso || !sessionState) return;
      const currentBodyweight = getCurrentBodyweightForUnit(cloudUser, meso.unit || DEFAULT_UNIT);
      const nextSession = {
        ...sessionState,
        log: {
          ...sessionState.log,
          [muscle]: sessionState.log[muscle].map((block, idx) => {
            if (idx !== exIdx) return block;
            const shouldClearWeights =
              bodyweightMode &&
              block.sets.every(
                (set) =>
                  set.weight === "" ||
                  (currentBodyweight !== "" && String(set.weight) === String(currentBodyweight))
              );
            return {
              ...block,
              bodyweightMode,
              sets: shouldClearWeights
                ? block.sets.map((set) => ({ ...set, weight: "" }))
                : block.sets,
            };
          }),
        },
      };
      const nextMeso = {
        ...meso,
        exerciseTracking: {
          ...(meso.exerciseTracking || {}),
          [exerciseName]: {
            ...(meso.exerciseTracking?.[exerciseName] || {}),
            bodyweight: bodyweightMode,
          },
        },
      };
      setSessionState(nextSession);
      await persistMeso(nextMeso);
      setToast(bodyweightMode ? "Bodyweight mode enabled" : "Bodyweight mode disabled");
    },
    [cloudUser, meso, persistMeso, sessionState]
  );

  const handleIncrementSave = useCallback(
    async (exerciseName, increment, muscle, exIdx) => {
      if (!meso) return;
      const nextMeso = {
        ...meso,
        increments: {
          ...meso.increments,
          [exerciseName]: increment,
        },
      };
      if (sessionState && muscle != null && exIdx != null) {
        setSessionState({
          ...sessionState,
          log: {
            ...sessionState.log,
            [muscle]: sessionState.log[muscle].map((block, idx) =>
              idx === exIdx ? { ...block, increment } : block
            ),
          },
        });
      }
      await persistMeso(nextMeso);
      setIncrementTarget(null);
      setToast("Increment updated");
    },
    [meso, persistMeso, sessionState]
  );

  const handleRemoveExercise = useCallback(
    async (muscle, exerciseName) => {
      if (!meso) return;
      const nextMeso = {
        ...meso,
        exercises: {
          ...meso.exercises,
          [muscle]: (meso.exercises[muscle] || []).filter((item) => item !== exerciseName),
        },
      };
      await persistMeso(nextMeso);
      setToast("Exercise removed from future sessions");
    },
    [meso, persistMeso]
  );

  const handleAddExercise = useCallback(
    async (muscle, exerciseName) => {
      if (!meso) return false;
      const normalized = normalizeExerciseName(exerciseName);
      if (!normalized) return false;
      const existing = meso.exercises[muscle] || [];
      if (existing.length >= 3) {
        setToast("Exercise cap reached");
        return false;
      }
      const canonical =
        getAllExerciseOptions(muscle).find((item) => item.toLowerCase() === normalized.toLowerCase()) ||
        normalized;
      if (existing.some((item) => item.toLowerCase() === canonical.toLowerCase())) {
        setToast("Exercise already in plan");
        return false;
      }
      const nextMeso = {
        ...meso,
        exercises: {
          ...meso.exercises,
          [muscle]: [...existing, canonical],
        },
        increments: {
          ...meso.increments,
          [canonical]: meso.increments[canonical] || DEFAULT_INCREMENT,
        },
        exerciseTracking: {
          ...(meso.exerciseTracking || {}),
          [canonical]: meso.exerciseTracking?.[canonical] || {
            bodyweight: isBodyweightExercise(canonical),
          },
        },
      };
      await persistMeso(nextMeso);
      setToast("Exercise added to future sessions");
      return true;
    },
    [meso, persistMeso]
  );

  return (
    <div className="app-shell">
      {screen === "loading" && <LoadingScreen />}
      {screen === "auth" && (
        <AuthScreen
          initialConfig={cloudConfig}
          cloudUser={cloudUser}
          cloudStatus={cloudStatus}
          cloudBusy={cloudBusy}
          onSaveCloudConfig={handleSaveCloudConfig}
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
          onForgotPassword={handleForgotPassword}
          onOpenSupport={openSupportScreen}
          onOpenContact={openContactScreen}
        />
      )}
      {screen === "welcome" && (
        <WelcomeScreen
          onStart={() => setScreen("setup")}
          hasMeso={Boolean(meso)}
          cloudUser={cloudUser}
          onOpenAccount={() => setAccountOpen(true)}
          onOpenSupport={openSupportScreen}
          onOpenContact={openContactScreen}
        />
      )}
      {screen === "setup" && (
        <SetupScreen
          initialTemplate={setupTemplate}
          onComplete={async (nextMeso, message) => {
            setSetupTemplate(null);
            await createNewActiveMeso(nextMeso);
            setToast(message);
            setScreen("home");
          }}
          onCancel={() => {
            setSetupTemplate(null);
            setScreen(meso ? "home" : "welcome");
          }}
        />
      )}
      {screen === "home" && meso && (
        <HomeScreen
          meso={meso}
          archivedMesos={archivedMesos}
          onNewMeso={handleNewMeso}
          onStartSession={startSession}
          onGoHome={() => setScreen("home")}
          onOpenAccount={() => setAccountOpen(true)}
          onOpenArchive={() => setArchiveOpen(true)}
          onManageExercises={() => setManageExercisesOpen(true)}
          onOpenSupport={openSupportScreen}
          onOpenContact={openContactScreen}
        />
      )}
      {screen === "support" && cloudUser && (
        <SupportCheckoutScreen
          cloudUser={cloudUser}
          supabaseClient={supabaseClient}
          initialSuccess={supportSuccess}
          onClearSuccess={() => setSupportSuccess(false)}
          onBack={closeSupportScreen}
          onOpenContact={openContactScreen}
        />
      )}
      {screen === "contact" && cloudUser && (
        <ContactFeedbackScreen
          onBack={() => setScreen(meso ? "home" : "welcome")}
          onOpenSupport={openSupportScreen}
        />
      )}
      {screen === "session" && meso && sessionState && (
        <SessionScreen
          meso={meso}
          currentBodyweight={getCurrentBodyweightForUnit(cloudUser, meso.unit || DEFAULT_UNIT)}
          sessionState={sessionState}
          setSessionState={setSessionState}
          onBack={() => {
            setSessionState(null);
            setScreen("home");
          }}
          onSave={saveSession}
          onSwap={(muscle, exIdx) => setSwapTarget({ muscle, exIdx })}
          onEditIncrement={(muscle, exIdx, currentInc, exerciseName) =>
            setIncrementTarget({ muscle, exIdx, currentInc, exerciseName })
          }
          onOpenHistory={(muscle, exerciseName) => setHistoryTarget({ muscle, exerciseName })}
          onToggleBodyweight={handleExerciseTrackingUpdate}
        />
      )}
      {swapTarget && meso && sessionState && (
        <SwapModal
          meso={meso}
          muscle={swapTarget.muscle}
          current={sessionState.log[swapTarget.muscle][swapTarget.exIdx].exercise}
          onClose={() => setSwapTarget(null)}
          onSwap={handleSwap}
        />
      )}
      {incrementTarget && (
        <IncrementModal
          current={incrementTarget.currentInc}
          exerciseName={incrementTarget.exerciseName}
          unit={meso?.unit || DEFAULT_UNIT}
          onClose={() => setIncrementTarget(null)}
          onSave={(value) =>
            handleIncrementSave(
              incrementTarget.exerciseName,
              value,
              incrementTarget.muscle,
              incrementTarget.exIdx
            )
          }
        />
      )}
      {historyTarget && meso && (
        <ExerciseHistoryModal
          meso={meso}
          muscle={historyTarget.muscle}
          exerciseName={historyTarget.exerciseName}
          onClose={() => setHistoryTarget(null)}
        />
      )}
      {manageExercisesOpen && meso && (
        <ManageExercisesSheet
          meso={meso}
          onClose={() => setManageExercisesOpen(false)}
          onAdd={handleAddExercise}
          onRemove={handleRemoveExercise}
        />
      )}
      {archiveOpen && (
        <ArchiveSheet
          mesos={archivedMesos}
          onClose={() => setArchiveOpen(false)}
          onOpenDetail={(item) => {
            setArchiveDetail(item);
            setArchiveOpen(false);
          }}
        />
      )}
      {archiveDetail && (
        <ArchivedMesoDetailSheet
          meso={archiveDetail}
          onUseAsTemplate={handleStartFromArchivedTemplate}
          onClose={() => setArchiveDetail(null)}
        />
      )}
      {accountOpen && (
        <AccountSheet
          hasMeso={Boolean(meso)}
          initialConfig={cloudConfig}
          cloudUser={cloudUser}
          bodyweightProfile={getBodyweightProfile(cloudUser)}
          preferredUnit={meso?.unit || DEFAULT_UNIT}
          cloudStatus={cloudStatus}
          cloudBusy={cloudBusy}
          archivedCount={archivedMesos.length}
          onClose={() => setAccountOpen(false)}
          onSaveCloudConfig={handleSaveCloudConfig}
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
          onForgotPassword={handleForgotPassword}
          onSignOut={handleSignOut}
          onRefresh={loadUserMesos}
          onSaveBodyweight={handleSaveBodyweight}
          onOpenSupport={openSupportScreen}
          onOpenContact={openContactScreen}
          onOpenArchive={() => {
            setAccountOpen(false);
            setArchiveOpen(true);
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="centered">
      <div className="card stack">
        <div className="eyebrow">// loading</div>
        <div className="display" style={{ fontSize: 54, lineHeight: 0.9 }}>
          Hyper<span className="accent">Phases</span>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({
  onStart,
  hasMeso,
  cloudUser,
  onOpenAccount,
  onOpenSupport,
  onOpenContact,
}) {
  const introSteps = [
    {
      title: "Build your mesocycle",
      copy: "Choose equipment, lock in your core movements, and set the starting volume that matches your recovery.",
    },
    {
      title: "Log with intent",
      copy: "Track load, reps, and RIR in a layout that stays fast enough to use during the workout itself.",
    },
    {
      title: "Progress with feedback",
      copy: "Use pump, soreness, and performance to steer the weekly volume ramp while load suggestions stay anchored to prior output.",
    },
  ];

  return (
    <div className="centered stack" style={{ gap: 18 }}>
      <div className="card hero-card hero-panel stack">
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />
        <div className="eyebrow">Adaptive Hypertrophy Tracking</div>
        <div className="hero-title-block">
          <div className="display" style={{ fontSize: 104, lineHeight: 0.82 }}>
            Hyper
            <br />
            <span className="accent">Phases</span>
          </div>
          <div className="hero-subtitle">
            Build, run, and review a mesocycle with progression driven by effort, recovery, and real logged performance.
          </div>
        </div>
        <div className="hero-metrics">
          <div className="metric-pill">
            <div className="eyebrow">Load</div>
            <div className="display gold" style={{ fontSize: 30, lineHeight: 0.92 }}>RIR-led</div>
          </div>
          <div className="metric-pill">
            <div className="eyebrow">Volume</div>
            <div className="display gold" style={{ fontSize: 30, lineHeight: 0.92 }}>Adaptive</div>
          </div>
          <div className="metric-pill">
            <div className="eyebrow">Flow</div>
            <div className="display gold" style={{ fontSize: 30, lineHeight: 0.92 }}>Mobile</div>
          </div>
        </div>
        <div className="hero-actions">
          <button className="btn-primary" onClick={onStart}>
            Start Mesocycle
          </button>
          <button className="btn-ghost" onClick={onOpenAccount}>
            {cloudUser ? "Account" : "Sign In"}
          </button>
        </div>
      </div>
      <div className="support-note">
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          Flexible Split Builder
        </div>
        <div className="small">
          Start from popular split templates, then adjust day names and muscle coverage so the structure matches how you actually train.
        </div>
      </div>
      <div className="stack">
        <div className="title-row">
          <div>
            <div className="eyebrow">How It Works</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.92 }}>
              Train. Rate. Progress.
            </div>
          </div>
          {hasMeso && (
            <button className="btn-ghost" onClick={onOpenAccount}>
              Current Account
            </button>
          )}
        </div>
        <div className="steps-grid">
          {introSteps.map((step, idx) => (
            <div key={step.title} className="step-card stack">
              <div className="title-row" style={{ alignItems: "center" }}>
                <div className="step-index">0{idx + 1}</div>
                <div className="step-title">{step.title}</div>
              </div>
              <div className="step-copy">{step.copy}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid-2">
        <button className="card action-panel stack" onClick={onOpenSupport}>
          <div className="eyebrow">Support HyperPhases</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 0.94 }}>
            Fund The Platform
          </div>
          <div className="tiny muted">
            Support development, hosting, and future improvements with a one-time contribution.
          </div>
        </button>
        <button className="card action-panel stack" onClick={onOpenContact}>
          <div className="eyebrow">Contact & Feedback</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 0.94 }}>
            Reach The Team
          </div>
          <div className="tiny muted">
            Report bugs, share product ideas, or get help with account and tracking issues.
          </div>
        </button>
      </div>
    </div>
  );
}

function SetupScreen({ initialTemplate, onComplete, onCancel }) {
  const [mode, setMode] = useState("choose");
  const [step, setStep] = useState(0);
  const [equipment, setEquipment] = useState(DEFAULT_EQUIPMENT);
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [weeks, setWeeks] = useState(6);
  const [exercises, setExercises] = useState(() => getRecommendedExercisePlan(DEFAULT_EQUIPMENT));
  const [incrementsSetup, setIncrementsSetup] = useState(() =>
    Object.fromEntries(
      Object.values(getRecommendedExercisePlan(DEFAULT_EQUIPMENT))
        .flat()
        .map((exercise) => [exercise, DEFAULT_INCREMENT])
    )
  );
  const [weeklyVol, setWeeklyVol] = useState(
    Object.fromEntries(MUSCLES.map((muscle) => [muscle, MEV_MRV[muscle][0]]))
  );
  const [resumeWeek, setResumeWeek] = useState(1);
  const [prevWeights, setPrevWeights] = useState({});
  const [weightStep, setWeightStep] = useState(0);
  const [doneWeeks, setDoneWeeks] = useState([]);
  const [selectedPresetKey, setSelectedPresetKey] = useState(SPLIT_PRESETS[0].key);
  const [splitName, setSplitName] = useState(SPLIT_PRESETS[0].name);
  const [splitDays, setSplitDays] = useState(() => instantiatePreset(SPLIT_PRESETS[0].key).daySlots);
  const [exerciseDrafts, setExerciseDrafts] = useState({});
  const normalizedSplitDays = normalizeDaySlots(splitDays);
  const activeMuscles = getActiveMusclesFromSlots(normalizedSplitDays);
  const unitLabel = getUnitLabel(unit);
  const unitStep = getUnitStep(unit);

  const visualStep =
    mode === "fresh"
      ? step === 0
        ? 0
        : step === 2
          ? 1
          : 2
      : step === 0
        ? 0
        : step === 2
          ? 1
          : step === 3
            ? 2
            : 3;

  useEffect(() => {
    setResumeWeek((prev) => clamp(prev, 1, weeks));
  }, [weeks]);

  useEffect(() => {
    setWeightStep((prev) => clamp(prev, 0, Math.max(0, activeMuscles.length - 1)));
  }, [activeMuscles.length]);

  useEffect(() => {
    if (!initialTemplate) return;
    const templateDaySlots = normalizeDaySlots(initialTemplate.split?.daySlots || getMesoDaySlots(initialTemplate));
    const templateExercises = Object.fromEntries(
      MUSCLES.map((muscle) => [muscle, (initialTemplate.exercises?.[muscle] || []).slice(0, 3)])
    );
    const templateIncrements = { ...(initialTemplate.increments || {}) };
    const templateVolumes = Object.fromEntries(
      MUSCLES.map((muscle) => {
        const [mev, mrv] = MEV_MRV[muscle];
        return [muscle, clamp(initialTemplate.weeklyVolume?.[muscle] || mev, mev, mrv)];
      })
    );
    setMode("fresh");
    setStep(0);
    setEquipment(initialTemplate.equipment?.length ? initialTemplate.equipment : DEFAULT_EQUIPMENT);
    setUnit(UNIT_OPTIONS.includes(initialTemplate.unit) ? initialTemplate.unit : DEFAULT_UNIT);
    setWeeks([4, 5, 6, 8].includes(initialTemplate.totalWeeks) ? initialTemplate.totalWeeks : 6);
    setSelectedPresetKey(initialTemplate.split?.presetKey || "custom");
    setSplitName(initialTemplate.splitName || initialTemplate.split?.name || "Custom Split");
    setSplitDays(templateDaySlots);
    setExercises(templateExercises);
    setIncrementsSetup(templateIncrements);
    setWeeklyVol(templateVolumes);
    setResumeWeek(1);
    setPrevWeights({});
    setWeightStep(0);
    setDoneWeeks([]);
    setExerciseDrafts({});
  }, [initialTemplate]);

  const applyPresetSelection = (presetKey) => {
    const preset = instantiatePreset(presetKey);
    setSelectedPresetKey(presetKey);
    setSplitName(preset.splitName);
    setSplitDays(preset.daySlots);
  };

  const updateSplitDay = (slotId, updates) => {
    setSplitDays((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, ...updates } : slot))
    );
  };

  const toggleSplitMuscle = (slotId, muscle) => {
    setSplitDays((current) =>
      current.map((slot) => {
        if (slot.id !== slotId) return slot;
        const hasMuscle = slot.muscles.includes(muscle);
        return {
          ...slot,
          muscles: hasMuscle
            ? slot.muscles.filter((item) => item !== muscle)
            : [...slot.muscles, muscle],
        };
      })
    );
  };

  const addSplitDay = () => {
    setSplitDays((current) => [
      ...current,
      {
        id: createSlotId("custom"),
        label: `Day ${current.length + 1}`,
        muscles: [],
      },
    ]);
  };

  const removeSplitDay = (slotId) => {
    setSplitDays((current) => (current.length <= 1 ? current : current.filter((slot) => slot.id !== slotId)));
  };

  const buildExerciseSelection = () => {
    const sourceExercises =
      initialTemplate && Object.values(exercises).some((list) => (list || []).length)
        ? exercises
        : getRecommendedExercisePlan(equipment);
    const { normalizedExercises, normalizedIncrements } = normalizeExercisesAndIncrements(
      sourceExercises,
      incrementsSetup
    );
    setExercises(normalizedExercises);
    setIncrementsSetup(normalizedIncrements);
    setStep(2);
  };

  const toggleEquipment = (item) => {
    setEquipment((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  };

  const toggleExercise = (muscle, exercise) => {
    const normalizedExercise = normalizeExerciseName(exercise);
    if (!normalizedExercise) return;
    setExercises((current) => {
      const selected = current[muscle] || [];
      const active = selected.includes(normalizedExercise);
      let next = selected;
      if (active) {
        next = selected.filter((item) => item !== normalizedExercise);
      } else if (selected.length < 3) {
        next = [...selected, normalizedExercise];
      }
      return { ...current, [muscle]: next };
    });
    setIncrementsSetup((current) => ({
      ...current,
      [normalizedExercise]: current[normalizedExercise] || DEFAULT_INCREMENT,
    }));
  };

  const addExerciseOption = (muscle) => {
    const draft = normalizeExerciseName(exerciseDrafts[muscle]);
    if (!draft) return;
    const canonical =
      getAllExerciseOptions(muscle).find((item) => item.toLowerCase() === draft.toLowerCase()) || draft;
    toggleExercise(muscle, canonical);
    setExerciseDrafts((current) => ({ ...current, [muscle]: "" }));
  };

  const createFreshMeso = async () => {
    const { normalizedExercises, normalizedIncrements } = normalizeExercisesAndIncrements(
      exercises,
      incrementsSetup
    );
    const daySlots = normalizeDaySlots(splitDays);
    const exerciseTracking = Object.fromEntries(
      Object.values(normalizedExercises)
        .flat()
        .map((exercise) => [
          exercise,
          {
            bodyweight:
              initialTemplate?.exerciseTracking?.[exercise]?.bodyweight ??
              isBodyweightExercise(exercise),
          },
        ])
    );
    const meso = {
      id: Date.now(),
      week: 1,
      totalWeeks: weeks,
      started: new Date().toISOString(),
      sessions: [],
      splitName: splitName.trim() || "Custom Split",
      split: {
        presetKey: selectedPresetKey,
        name: splitName.trim() || "Custom Split",
        daySlots,
      },
      equipment,
      unit,
      exercises: normalizedExercises,
      weeklyVolume: weeklyVol,
      increments: normalizedIncrements,
      exerciseTracking,
      basedOnMesoId: initialTemplate?.remoteId || initialTemplate?.id || null,
      ownerUserId: null,
    };
    await onComplete(meso, "Mesocycle started");
  };

  const createResumeMeso = async () => {
    const { normalizedExercises, normalizedIncrements } = normalizeExercisesAndIncrements(
      exercises,
      incrementsSetup
    );
    const daySlots = normalizeDaySlots(splitDays);
    const seed = buildSeedSession(normalizedExercises, prevWeights, normalizedIncrements);
    const exerciseTracking = Object.fromEntries(
      Object.values(normalizedExercises)
        .flat()
        .map((exercise) => [
          exercise,
          {
            bodyweight:
              initialTemplate?.exerciseTracking?.[exercise]?.bodyweight ??
              isBodyweightExercise(exercise),
          },
        ])
    );
    const meso = {
      id: Date.now(),
      week: resumeWeek,
      totalWeeks: weeks,
      started: new Date().toISOString(),
      sessions: [seed, ...daySlots.filter((slot) => doneWeeks.includes(slot.id)).map((slot) => createSyntheticSession(slot, resumeWeek))],
      splitName: splitName.trim() || "Custom Split",
      split: {
        presetKey: selectedPresetKey,
        name: splitName.trim() || "Custom Split",
        daySlots,
      },
      equipment,
      unit,
      exercises: normalizedExercises,
      weeklyVolume: calcVolumeForWeek(resumeWeek, weeks),
      increments: normalizedIncrements,
      exerciseTracking,
      resumed: true,
      ownerUserId: null,
    };
    await onComplete(meso, "Mesocycle started");
  };

  const renderChooseMode = () => (
    <div className="card stack">
      <div className="title-row">
        <div>
          <div className="eyebrow">// setup</div>
          <div className="display" style={{ fontSize: 48, lineHeight: 0.92 }}>
            Choose <span className="accent">Flow</span>
          </div>
        </div>
        <button className="btn-ghost" onClick={onCancel}>
          Back
        </button>
      </div>
      <button
        className="btn-primary"
        onClick={() => {
          setMode("fresh");
          setStep(0);
        }}
      >
        Fresh Mesocycle
      </button>
      <button
        className="btn-ghost"
        onClick={() => {
          setMode("resume");
          setStep(0);
        }}
      >
        Resume Mid-Meso
      </button>
    </div>
  );

  const renderStepDots = () => (
    <div className="step-dots">
      {STEP_LABELS[mode].map((item, idx) => (
        <div key={item} className={`step-dot ${idx <= visualStep ? "active" : ""}`} />
      ))}
    </div>
  );

  const renderEquipmentWeeks = () => (
    <div className="card stack">
      <div className="title-row">
        <div>
          <div className="eyebrow">// {mode === "fresh" ? "fresh" : "resume"} setup</div>
          <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
            {mode === "fresh" ? "Foundation" : "Resume Setup"}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setMode("choose")}>
          Back
        </button>
      </div>
      {renderStepDots()}
      <div className="stack">
        <div className="label tiny gold">equipment</div>
        <div className="grid-2">
          {EQUIPMENT_OPTIONS.map((item) => (
            <button
              key={item}
              className={`chip ${equipment.includes(item) ? "active" : ""}`}
              onClick={() => toggleEquipment(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="stack">
        <div className="label tiny gold">meso length</div>
        <div className="grid-4">
          {[4, 5, 6, 8].map((option) => (
            <button
              key={option}
              className={`pill-btn gold ${weeks === option ? "active" : ""}`}
              onClick={() => setWeeks(option)}
            >
              <span className="display" style={{ fontSize: 24 }}>
                {option}W
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="stack">
        <div className="label tiny gold">load unit</div>
        <div className="grid-2">
          {UNIT_OPTIONS.map((option) => (
            <button
              key={option}
              className={`pill-btn gold ${unit === option ? "active" : ""}`}
              onClick={() => setUnit(option)}
            >
              <span className="display" style={{ fontSize: 24 }}>
                {option.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="stack">
        <div className="label tiny gold">split preset</div>
        <div className="stack">
          {SPLIT_PRESETS.map((preset) => (
            <button
              key={preset.key}
              className={`chip ${selectedPresetKey === preset.key ? "active" : ""}`}
              onClick={() => applyPresetSelection(preset.key)}
              style={{ textAlign: "left", padding: "14px 16px" }}
            >
              <div className="title-row" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="small" style={{ fontWeight: 700 }}>{preset.name}</div>
                  <div className="tiny muted">{preset.description}</div>
                </div>
                <div className="mono tiny gold">{preset.daySlots.length} days</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="stack">
        <div className="title-row">
          <div className="label tiny gold">customize split</div>
          <button className="btn-ghost" onClick={addSplitDay}>
            + Add Day
          </button>
        </div>
        <input
          type="text"
          value={splitName}
          onChange={(event) => setSplitName(event.target.value)}
          placeholder="Split name"
        />
        {splitDays.map((slot, idx) => (
          <div key={slot.id} className="inset" style={{ padding: 14 }}>
            <div className="title-row" style={{ marginBottom: 10 }}>
              <input
                type="text"
                value={slot.label}
                onChange={(event) => updateSplitDay(slot.id, { label: event.target.value })}
                placeholder={`Day ${idx + 1}`}
              />
              <button className="btn-ghost" onClick={() => removeSplitDay(slot.id)}>
                Remove
              </button>
            </div>
            <div className="grid-2">
              {MUSCLES.map((muscle) => (
                <button
                  key={`${slot.id}-${muscle}`}
                  className={`chip ${slot.muscles.includes(muscle) ? "active" : ""}`}
                  onClick={() => toggleSplitMuscle(slot.id, muscle)}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {mode === "resume" && (
        <div className="stack">
          <div className="label tiny gold">current week</div>
          <div className="grid-4">
            {Array.from({ length: weeks }).map((_, idx) => {
              const value = idx + 1;
              return (
                <button
                  key={value}
                  className={`pill-btn ${resumeWeek === value ? "active" : ""}`}
                  onClick={() => setResumeWeek(value)}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button className="btn-primary" onClick={buildExerciseSelection}>
        {initialTemplate ? "Review Exercise Plan" : "Build Exercise Plan"}
      </button>
    </div>
  );

  const renderExerciseReview = () => (
    <div className="stack">
      <div className="card stack">
        <div className="title-row">
          <div>
            <div className="eyebrow">// exercise plan</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              Review Plan
            </div>
          </div>
          <button className="btn-ghost" onClick={() => setStep(0)}>
            Back
          </button>
        </div>
        {renderStepDots()}
        <div className="tiny muted">
          {mode === "fresh"
            ? "Start from equipment-matched recommendations, then keep up to 3 exercises per muscle group."
            : "Match what you’ve been doing. Start from equipment-matched recommendations, then keep up to 3 exercises per muscle group."}
        </div>
      </div>
      {activeMuscles.map((muscle) => {
        const options = getAvailableExercises(muscle, equipment);
        const allOptions = getAllExerciseOptions(muscle);
        const selected = exercises[muscle] || [];
        const displayOptions = Array.from(new Set([...selected, ...options]));
        return (
          <div key={muscle} className="card stack">
            <div className="title-row">
              <div className="display" style={{ fontSize: 30 }}>
                {muscle}
              </div>
              <div className="mono tiny gold">{selected.length} / 3</div>
            </div>
            <div className="stack">
              {displayOptions.map((exercise) => {
                const active = selected.includes(exercise);
                return (
                  <div key={exercise} className="stack">
                    <button
                      className={`chip ${active ? "active" : ""}`}
                      onClick={() => toggleExercise(muscle, exercise)}
                      style={{ textAlign: "left" }}
                    >
                      {exercise}
                    </button>
                    {active && (
                      <div className="inset" style={{ padding: 12 }}>
                        <div className="title-row" style={{ marginBottom: 8 }}>
                          <div className="label tiny gold">inc</div>
                          <div className="mono tiny">
                            {formatKg(incrementsSetup[exercise] || DEFAULT_INCREMENT)} {unitLabel}
                          </div>
                        </div>
                        <div className="grid-3" style={{ marginBottom: 8 }}>
                          {[1, 2.5, 5, 10, 15, 20].map((value) => (
                            <button
                              key={value}
                              className={`pill-btn gold ${
                                Number(incrementsSetup[exercise]) === value ? "active" : ""
                              }`}
                              onClick={() =>
                                setIncrementsSetup((current) => ({ ...current, [exercise]: value }))
                              }
                            >
                              <span className="display" style={{ fontSize: 22 }}>
                                {value}
                              </span>
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          min="0.5"
                          step={unitStep}
                          value={incrementsSetup[exercise] || ""}
                          onChange={(event) =>
                            setIncrementsSetup((current) => ({
                              ...current,
                              [exercise]: event.target.value === "" ? "" : Number(event.target.value),
                            }))
                          }
                          placeholder={`Custom ${unitLabel} increment`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="inset stack" style={{ padding: 12 }}>
                <div className="label tiny gold">add exercise</div>
                <input
                  list={`exercise-library-${muscle}`}
                  value={exerciseDrafts[muscle] || ""}
                  onChange={(event) =>
                    setExerciseDrafts((current) => ({ ...current, [muscle]: event.target.value }))
                  }
                  placeholder={`Type or choose a ${muscle} exercise`}
                />
                <datalist id={`exercise-library-${muscle}`}>
                  {allOptions.map((exercise) => (
                    <option key={`${muscle}-${exercise}`} value={exercise} />
                  ))}
                </datalist>
                <div className="title-row" style={{ alignItems: "center" }}>
                  <div className="tiny muted">
                    Missing something specific? Add it here and set the increment now or later in-session.
                  </div>
                  <button className="btn-ghost" onClick={() => addExerciseOption(muscle)}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {mode === "fresh" ? (
        <button className="btn-primary" onClick={() => setStep(3)}>
          Confirm Exercises
        </button>
      ) : (
        <button
          className="btn-primary"
          onClick={() => {
            setStep(3);
            setWeightStep(0);
          }}
        >
          Continue
        </button>
      )}
    </div>
  );

  const renderVolumeStep = () => (
    <div className="stack">
      <div className="card stack">
        <div className="title-row">
          <div>
            <div className="eyebrow">// starting volume</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              Sets / Week
            </div>
          </div>
          <button className="btn-ghost" onClick={() => setStep(2)}>
            Back
          </button>
        </div>
        {renderStepDots()}
      </div>
      {activeMuscles.map((muscle) => {
        const [mev, mrv] = MEV_MRV[muscle];
        return (
          <div key={muscle} className="card">
            <div className="title-row" style={{ marginBottom: 10 }}>
              <div>
                <div className="display" style={{ fontSize: 30 }}>
                  {muscle}
                </div>
                <div className="mono tiny muted">
                  MEV {mev} · MRV {mrv}
                </div>
              </div>
              <div className="row">
                <button
                  className="btn-ghost"
                  onClick={() =>
                    setWeeklyVol((current) => ({
                      ...current,
                      [muscle]: clamp(current[muscle] - 2, mev, mrv),
                    }))
                  }
                >
                  -
                </button>
                <div className="display gold" style={{ fontSize: 36, minWidth: 44, textAlign: "center" }}>
                  {weeklyVol[muscle]}
                </div>
                <button
                  className="btn-ghost"
                  onClick={() =>
                    setWeeklyVol((current) => ({
                      ...current,
                      [muscle]: clamp(current[muscle] + 2, mev, mrv),
                    }))
                  }
                >
                  +
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <button className="btn-primary" onClick={createFreshMeso}>
        Start Mesocycle
      </button>
    </div>
  );

  const currentResumeMuscle = activeMuscles[weightStep];

  const renderResumeWeights = () => (
    <div className="stack">
      <div className="card stack">
        <div className="title-row">
          <div>
            <div className="eyebrow">// last performance</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              {currentResumeMuscle}
            </div>
          </div>
          <button className="btn-ghost" onClick={() => setStep(2)}>
            Back
          </button>
        </div>
        {renderStepDots()}
        <div className="mono gold small">
          {weightStep + 1} / {activeMuscles.length}
        </div>
      </div>
      {(exercises[currentResumeMuscle] || []).map((exercise) => {
        const value = prevWeights?.[currentResumeMuscle]?.[exercise] || { weight: "", reps: "", rir: "" };
        return (
          <div key={exercise} className="card stack">
            <div className="display" style={{ fontSize: 28 }}>
              {exercise}
            </div>
            <div className="grid-3">
              <input
                type="number"
                step={unitStep}
                placeholder={unitLabel.toUpperCase()}
                value={value.weight}
                onChange={(event) =>
                  setPrevWeights((current) => ({
                    ...current,
                    [currentResumeMuscle]: {
                      ...(current[currentResumeMuscle] || {}),
                      [exercise]: {
                        ...(current[currentResumeMuscle]?.[exercise] || {}),
                        weight: event.target.value,
                      },
                    },
                  }))
                }
              />
              <input
                type="number"
                placeholder="REPS"
                value={value.reps}
                onChange={(event) =>
                  setPrevWeights((current) => ({
                    ...current,
                    [currentResumeMuscle]: {
                      ...(current[currentResumeMuscle] || {}),
                      [exercise]: {
                        ...(current[currentResumeMuscle]?.[exercise] || {}),
                        reps: event.target.value,
                      },
                    },
                  }))
                }
              />
              <input
                type="number"
                min="0"
                max="5"
                placeholder="RIR"
                value={value.rir}
                onChange={(event) =>
                  setPrevWeights((current) => ({
                    ...current,
                    [currentResumeMuscle]: {
                      ...(current[currentResumeMuscle] || {}),
                      [exercise]: {
                        ...(current[currentResumeMuscle]?.[exercise] || {}),
                        rir: event.target.value,
                      },
                    },
                  }))
                }
              />
            </div>
          </div>
        );
      })}
      <div className="title-row">
        <button
          className="btn-ghost"
          onClick={() => setWeightStep((prev) => clamp(prev - 1, 0, activeMuscles.length - 1))}
          disabled={weightStep === 0}
        >
          Previous
        </button>
        {weightStep < activeMuscles.length - 1 ? (
          <button
            className="btn-sm"
            onClick={() => setWeightStep((prev) => clamp(prev + 1, 0, activeMuscles.length - 1))}
          >
            Next
          </button>
        ) : (
          <button className="btn-sm" onClick={() => setStep(4)}>
            Continue
          </button>
        )}
      </div>
    </div>
  );

  const renderResumeDays = () => (
    <div className="stack">
      <div className="card stack">
        <div className="title-row">
          <div>
            <div className="eyebrow">// days done</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              This Week
            </div>
          </div>
          <button className="btn-ghost" onClick={() => setStep(3)}>
            Back
          </button>
        </div>
        {renderStepDots()}
        <div className="grid-2">
          {normalizedSplitDays.map((slot) => (
            <button
              key={slot.id}
              className={`chip ${doneWeeks.includes(slot.id) ? "active" : ""}`}
              onClick={() =>
                setDoneWeeks((current) =>
                  current.includes(slot.id)
                    ? current.filter((item) => item !== slot.id)
                    : [...current, slot.id]
                )
              }
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card stack">
        <div className="label tiny gold">summary</div>
        <div className="mono small">Week {resumeWeek} of {weeks}</div>
        <div className="mono small">Target RIR {targetRIRForWeek(resumeWeek)}</div>
        <div className="mono small">Days marked done: {doneWeeks.length || 0}</div>
        <div className="mono small">Split days this week: {normalizedSplitDays.length}</div>
      </div>
      <button className="btn-primary" onClick={createResumeMeso}>
        Resume Mesocycle
      </button>
    </div>
  );

  return (
    <div className="stack">
      {mode === "choose" && renderChooseMode()}
      {mode !== "choose" && step === 0 && renderEquipmentWeeks()}
      {mode !== "choose" && step === 2 && renderExerciseReview()}
      {mode === "fresh" && step === 3 && renderVolumeStep()}
      {mode === "resume" && step === 3 && renderResumeWeights()}
      {mode === "resume" && step === 4 && renderResumeDays()}
    </div>
  );
}

function HomeScreen({
  meso,
  archivedMesos,
  onNewMeso,
  onStartSession,
  onGoHome,
  onOpenAccount,
  onOpenArchive,
  onManageExercises,
  onOpenSupport,
  onOpenContact,
}) {
  const daySlots = getMesoDaySlots(meso);
  const activeMuscles = getActiveMusclesFromSlots(daySlots);
  const doneDayTypes = getWeekDoneDaySlotIds(meso, meso.week);
  const nextDaySlot = getNextOpenDaySlot(meso);
  const progress = meso.totalWeeks > 0 ? clamp(((meso.week - 1) / meso.totalWeeks) * 100, 0, 100) : 0;
  const complete = meso.week > meso.totalWeeks;
  const summary = getMesoSummaryStats(meso);
  const phaseGuide = getPhaseGuide(meso);
  const recoveryOverview = getRecoveryOverview(meso, activeMuscles);
  const recoveryPreview = (recoveryOverview.items || []).filter((item) => item.label !== "Awaiting feedback");
  const showRecoveryEmptyState = recoveryPreview.length === 0;
  const unitLabel = getUnitLabel(meso?.unit);
  return (
    <div className="stack">
      <div className="sticky">
        <div className="card header-card">
          <div className="space-between">
            <div>
              <button className="brand-button" onClick={onGoHome} aria-label="Return to home">
                <div className="display" style={{ fontSize: 42, lineHeight: 0.9 }}>
                  Hyper<span className="accent">Phases</span>
                </div>
              </button>
              <div className="mono tiny gold">
                RIR-led progression and adaptive volume for hypertrophy mesocycles
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-ghost" onClick={onOpenSupport}>
                Support
              </button>
              <button className="btn-ghost" onClick={onOpenContact}>
                Contact
              </button>
              <button className="btn-ghost" onClick={onOpenArchive}>
                Archive
              </button>
              <button className="btn-ghost" onClick={onOpenAccount}>
                Account
              </button>
              <button className="btn-ghost" onClick={onNewMeso}>
                New Meso
              </button>
            </div>
          </div>
        </div>
      </div>

      {complete ? (
        <div className="stack">
          <div className="card hero-panel stack" style={{ textAlign: "center" }}>
            <div className="display gold" style={{ fontSize: 80, lineHeight: 0.85 }}>
              🏆
            </div>
            <div className="display" style={{ fontSize: 54, lineHeight: 0.88 }}>
              Meso Complete
            </div>
            <div className="small">
              {phaseGuide?.copy || "Deload, assess fatigue, and start a fresh mesocycle when ready."}
            </div>
            <div className="grid-3">
              <div className="card stack metric-card">
                <div className="eyebrow">Sessions Logged</div>
                <div className="display" style={{ fontSize: 38, lineHeight: 0.88 }}>
                  {(meso.sessions || []).filter((session) => !session.synthetic).length}
                </div>
              </div>
              <div className="card stack metric-card">
                <div className="eyebrow">Top Mover</div>
                <div className="display" style={{ fontSize: 30, lineHeight: 0.92 }}>
                  {summary.strongest ? summary.strongest.exercise : "Waiting"}
                </div>
                <div className="tiny muted">
                  {summary.strongest
                    ? `${summary.strongest.delta > 0 ? "+" : ""}${formatKg(summary.strongest.delta)} ${unitLabel} across the block`
                    : "Not enough logged history yet."}
                </div>
              </div>
              <div className="card stack metric-card">
                <div className="eyebrow">Archive Ready</div>
                <div className="display" style={{ fontSize: 38, lineHeight: 0.88 }}>
                  {archivedMesos.length}
                </div>
                <div className="tiny muted">previous mesocycles available for comparison</div>
              </div>
            </div>
            <button className="btn-primary" onClick={onNewMeso}>
              Start New Meso
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="page-section-head">
            <div className="eyebrow">Current Meso</div>
            <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
              Train The Current Block
            </div>
          </div>
          <div className="card hero-panel dashboard-hero stack">
            <div className="hero-orbit hero-orbit-a" />
            <div className="hero-orbit hero-orbit-b" />
            <div className="hero-topline">
              <div className="eyebrow">Current Block</div>
              <div className="status-cluster">
                <span className="status-chip status-chip-good">{doneDayTypes.length}/{daySlots.length} sessions</span>
                <span className="status-chip">{meso.splitName || meso.split?.name || "Custom split"}</span>
                <span className="status-chip" style={getCoachToneStyles(phaseGuide?.tone)}>
                  {phaseGuide?.label}
                </span>
              </div>
            </div>
            <div className="week-hero">
              <div className="stack" style={{ gap: 10 }}>
                <div className="display" style={{ fontSize: 96, lineHeight: 0.8 }}>
                  Week {meso.week}
                </div>
                <div className="small muted">of {meso.totalWeeks} weeks</div>
                <div className="week-copy">
                  Keep the structure stable, push performance inside the target effort, and use feedback to guide weekly volume.
                </div>
                <div className="dashboard-momentum">
                  {Array.from({ length: meso.totalWeeks }).map((_, idx) => (
                    <div
                      key={`momentum-${idx + 1}`}
                      className={`momentum-node ${
                        idx + 1 < meso.week ? "done" : idx + 1 === meso.week ? "current" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="stack" style={{ gap: 12 }}>
                <div className="hero-stat-card">
                  <div className="display gold" style={{ fontSize: 54, lineHeight: 0.85 }}>
                    {targetRIRForWeek(meso.week)}
                  </div>
                  <div className="label tiny">Target RIR</div>
                </div>
                <div className="hero-stat-card">
                  <div className="eyebrow">Next Session</div>
                  <div className="display" style={{ fontSize: 32, lineHeight: 0.92 }}>
                    {nextDaySlot ? nextDaySlot.label : "Complete"}
                  </div>
                  <div className="tiny muted">
                    {nextDaySlot ? nextDaySlot.muscles.join(" · ") : "This block is ready for a new mesocycle."}
                  </div>
                </div>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => nextDaySlot && onStartSession(nextDaySlot.id)}
                disabled={!nextDaySlot}
              >
                {nextDaySlot ? `Start ${nextDaySlot.label}` : "Block Complete"}
              </button>
              <button className="btn-ghost" onClick={onManageExercises}>
                Manage Plan
              </button>
            </div>
          </div>

          <div className="page-section-head">
            <div className="eyebrow">Coaching</div>
            <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
              Guidance For This Week
            </div>
          </div>

          <div className="home-coaching-grid">
            <div className="card stack section-card coaching-phase-card">
              <div className="title-row">
                <div>
                  <div className="eyebrow">Current Phase</div>
                  <div className="display" style={{ fontSize: 30, lineHeight: 0.96 }}>
                    {phaseGuide?.title}
                  </div>
                </div>
                <div className="status-chip" style={getCoachToneStyles(phaseGuide?.tone)}>
                  {phaseGuide?.label}
                </div>
              </div>
              <div className="small">{phaseGuide?.copy}</div>
              <div className="tiny muted">{phaseGuide?.focus}</div>
            </div>
            <div className="card stack section-card coaching-recovery-card">
              <div className="title-row">
                <div>
                  <div className="eyebrow">Recovery Signals</div>
                  <div className="display" style={{ fontSize: 30, lineHeight: 0.96 }}>
                    Recovery Snapshot
                  </div>
                </div>
                <div className="mono tiny gold">
                  {recoveryOverview.ready} ready · {recoveryOverview.hold} hold · {recoveryOverview.recover} recover
                </div>
              </div>
              {showRecoveryEmptyState ? (
                <div className="notice coaching-empty-state">
                  <div className="small">
                    Recovery guidance unlocks after you log and rate muscle feedback in completed sessions.
                  </div>
                  <div className="tiny muted">
                    Once you have feedback, this section will surface where to push, hold, or recover.
                  </div>
                </div>
              ) : (
                <div className="coaching-recovery-list">
                  {recoveryPreview.slice(0, 4).map((item) => (
                    <div key={`recovery-${item.muscle}`} className="coaching-recovery-row">
                      <div className="small">{item.muscle}</div>
                      <div className="status-chip" style={getCoachToneStyles(item.tone)}>
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="page-section-head">
            <div className="eyebrow">Analytics</div>
            <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
              Progress And Trends
            </div>
          </div>

          <div className="grid-3">
            <div className="card stack metric-card metric-card-focus">
              <div className="eyebrow">This Week</div>
              <div className="display" style={{ fontSize: 46, lineHeight: 0.88 }}>
                {doneDayTypes.length}/{daySlots.length}
              </div>
              <div className="goal-track">
                <div className="goal-fill" style={{ width: `${summary.completionPct}%` }} />
              </div>
              <div className="tiny muted">{summary.daysLeft} sessions left to advance the week</div>
            </div>
            <div className="card stack metric-card">
              <div className="eyebrow">Block Momentum</div>
              <div className="display" style={{ fontSize: 46, lineHeight: 0.88 }}>
                {Math.round(summary.mesoPct)}%
              </div>
              <div className="goal-track">
                <div className="goal-fill" style={{ width: `${summary.mesoPct}%` }} />
              </div>
              <div className="tiny muted">progress through the current mesocycle</div>
            </div>
            <div className="card stack metric-card">
              <div className="eyebrow">Top Trend</div>
              <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
                {summary.strongest ? summary.strongest.exercise : "Waiting"}
              </div>
              <div className="tiny muted">
                {summary.strongest
                  ? `${summary.strongest.delta > 0 ? "+" : ""}${formatKg(summary.strongest.delta)} ${unitLabel} this block`
                  : "Log more completed sets to unlock progression trends."}
              </div>
            </div>
          </div>

          <div className="grid-2">
            {daySlots.map((daySlot) => {
              const muscles = daySlot.muscles;
              const done = doneDayTypes.includes(daySlot.id);
              const hasExercises = muscles.some((muscle) => (meso.exercises[muscle] || []).length > 0);
              return (
                <div
                  key={daySlot.id}
                  className={`card day-tile ${done || !hasExercises ? "done" : ""}`}
                  onClick={() => !done && hasExercises && onStartSession(daySlot.id)}
                >
                  <div className="space-between" style={{ alignItems: "flex-start" }}>
                    <div className="display" style={{ fontSize: 34 }}>
                      {daySlot.label}
                    </div>
                    {done ? <div className="badge">✓</div> : !hasExercises ? <div className="badge">-</div> : null}
                  </div>
                  <div className="mono tiny muted" style={{ marginTop: 8 }}>
                    {hasExercises ? muscles.join(" · ") : "No exercises configured"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card stack section-card">
            <div className="title-row">
              <div>
                <div className="display" style={{ fontSize: 38 }}>
                  Strength Trends
                </div>
                <div className="mono tiny muted">first logged weight vs latest logged weight across the block</div>
              </div>
            </div>
            {(summary.topMovers || []).length ? (
              summary.topMovers.map((item) => (
                <div key={item.key} className="volume-row">
                  <div className="label tiny">{item.exercise}</div>
                  <div className="volume-track">
                    <div
                      className="volume-fill"
                      style={{ width: `${clamp((Math.max(item.delta, 0) / Math.max(summary.topMovers[0]?.delta || 1, 1)) * 100, 8, 100)}%` }}
                    />
                  </div>
                  <div className="mono tiny gold" style={{ textAlign: "right" }}>
                    {item.delta > 0 ? "+" : ""}{formatKg(item.delta)} {unitLabel}
                  </div>
                </div>
              ))
            ) : (
              <div className="small muted">
                Progress cards will populate after you log completed sets across multiple sessions.
              </div>
            )}
          </div>

          <div className="card stack section-card">
            <div className="title-row">
              <div className="display" style={{ fontSize: 38 }}>
                Volume
              </div>
              <div className="mono tiny gold">sets / week</div>
            </div>
            {activeMuscles.map((muscle) => {
              const [mev, mrv] = MEV_MRV[muscle];
              const current = meso.weeklyVolume[muscle];
              const fill = ((current - mev) / Math.max(1, mrv - mev)) * 100;
              return (
                <div key={muscle} className="volume-row">
                  <div className="label tiny">{muscle}</div>
                  <div className="volume-track">
                    <div className="volume-fill" style={{ width: `${clamp(fill, 0, 100)}%` }} />
                  </div>
                  <div className="mono tiny gold" style={{ textAlign: "right" }}>
                    {current}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="section-divider" />

          <div className="page-section-head">
            <div className="eyebrow">Guidance</div>
            <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
              How The Block Works
            </div>
          </div>

          <div className="grid-2">
            <div className="card stack section-card">
              <div className="eyebrow">Why RIR Works</div>
              <div className="display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                Effort With Guardrails
              </div>
              <div className="small">
                RIR keeps load progression tied to real effort so you can push output upward without turning every session into avoidable fatigue.
              </div>
              <div className="tiny muted">
                A mesocycle is a focused 4 to 8 week block where you keep the structure stable and progress load, effort, and volume across the phase.
              </div>
            </div>
            <div className="card stack section-card">
              <div className="eyebrow">Mesocycle Structure</div>
              <div className="display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                Stable Plan, Clear Feedback
              </div>
              <div className="small">
                Keep the split and core exercises stable long enough to judge progression, then use RIR, soreness, and performance to adjust the next week intelligently.
              </div>
              <div className="tiny muted">
                The goal is not to max out every session. The goal is to build repeatable productive weeks across the full phase.
              </div>
            </div>
          </div>

          <div className="section-divider" />

          <div className="page-section-head">
            <div className="eyebrow">Platform</div>
            <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
              Support And Account
            </div>
          </div>

          <button className="card action-panel support-hero stack" onClick={onOpenSupport}>
            <div className="title-row" style={{ alignItems: "flex-start" }}>
              <div>
                <div className="eyebrow">Support HyperPhases</div>
                <div className="display" style={{ fontSize: 40, lineHeight: 0.92 }}>
                  Keep HyperPhases Free
                </div>
              </div>
              <div className="status-chip status-chip-good">One-time support</div>
            </div>
            <div className="small">
              Help fund development, hosting, and the next round of product improvements while keeping the core tracking experience subscription-free.
            </div>
            <div className="support-hero-points">
              <span className="status-chip">Secure checkout</span>
              <span className="status-chip">No subscription</span>
              <span className="status-chip">Directly supports product work</span>
            </div>
            <div className="support-hero-cta">
              <span className="btn-primary">Support The Platform</span>
            </div>
          </button>

          <div className="grid-2">
            <button className="card action-panel platform-secondary-card" onClick={onOpenArchive}>
              <div className="eyebrow">Archive</div>
              <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
                Review Previous Blocks
              </div>
              <div className="small muted">
                {archivedMesos.length} mesocycles saved to your account for comparison and reuse.
              </div>
            </button>
            <button className="card action-panel platform-secondary-card" onClick={onOpenContact}>
              <div className="eyebrow">Contact & Feedback</div>
              <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
                Reach The Team
              </div>
              <div className="small muted">
                Send bug reports, feature ideas, account questions, or training-log issues directly to the team.
              </div>
              <div className="mono tiny gold">feedback@hyperphases.com</div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AccountSheet({
  hasMeso,
  initialConfig,
  cloudUser,
  bodyweightProfile,
  preferredUnit,
  cloudStatus,
  cloudBusy,
  archivedCount,
  onClose,
  onSaveCloudConfig,
  onSignUp,
  onSignIn,
  onForgotPassword,
  onSignOut,
  onRefresh,
  onSaveBodyweight,
  onOpenSupport,
  onOpenContact,
  onOpenArchive,
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <div className="title-row">
            <div>
              <div className="eyebrow">Account</div>
              <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
                Your Account
              </div>
            </div>
            <button className="btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <CloudSyncCard
          hasMeso={hasMeso}
          initialConfig={initialConfig}
          cloudUser={cloudUser}
          bodyweightProfile={bodyweightProfile}
          preferredUnit={preferredUnit}
          cloudStatus={cloudStatus}
          cloudBusy={cloudBusy}
          onSaveCloudConfig={onSaveCloudConfig}
          onSignUp={onSignUp}
          onSignIn={onSignIn}
          onForgotPassword={onForgotPassword}
          onSignOut={onSignOut}
          onRefresh={onRefresh}
          onSaveBodyweight={onSaveBodyweight}
          onOpenArchive={onOpenArchive}
          archivedCount={archivedCount}
        />
        <div className="card stack analytics-card">
          <div className="eyebrow">Help & Support</div>
          <div className="display" style={{ fontSize: 36, lineHeight: 0.92 }}>
            Platform Access
          </div>
          <div className="small">
            Support HyperPhases or contact the team directly without digging through account settings.
          </div>
          <div className="grid-2">
            <button className="btn-primary" onClick={onOpenSupport}>
              Support
            </button>
            <button className="btn-ghost" onClick={onOpenContact}>
              Contact
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({
  initialConfig,
  cloudUser,
  cloudStatus,
  cloudBusy,
  onSaveCloudConfig,
  onSignUp,
  onSignIn,
  onForgotPassword,
  onOpenSupport,
  onOpenContact,
}) {
  const previewTrendBars = [
    { label: "Incline Press", value: 84 },
    { label: "Pull-Up", value: 72 },
    { label: "Hack Squat", value: 91 },
  ];

  return (
    <div className="stack public-page">
      <div className="card hero-card hero-panel stack public-hero">
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />
        <div className="public-hero-grid">
          <div className="stack public-hero-copy">
            <div className="eyebrow">Effort-Led Hypertrophy Tracking</div>
            <div className="hero-title-block">
              <div className="display" style={{ fontSize: 104, lineHeight: 0.82 }}>
                Hyper
                <br />
                <span className="accent">Phases</span>
              </div>
              <div className="hero-subtitle public-hero-subtitle">
                The clean way to run a hypertrophy phase with clear effort targets, fast logging, and real progression history.
              </div>
            </div>
            <div className="public-chip-row">
              <span className="status-chip status-chip-good">Custom splits</span>
              <span className="status-chip">RIR-led progression</span>
              <span className="status-chip">Archive included</span>
            </div>
            <div className="hero-actions public-hero-actions">
              <button className="btn-primary" onClick={() => scrollToSection("public-signup")}>
                Create Free Account
              </button>
              <button className="btn-ghost" onClick={() => scrollToSection("public-evidence")}>
                Why RIR Works
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-section-head">
        <div className="eyebrow">Features</div>
        <div className="display" style={{ fontSize: 38, lineHeight: 0.92 }}>
          Why People Use It
        </div>
      </div>
      <div className="public-feature-grid">
        {PUBLIC_FEATURES.map((feature) => (
          <div key={feature.title} className="card stack section-card public-feature-card">
            <div className="title-row" style={{ alignItems: "flex-start" }}>
              <div>
                <div className="eyebrow">{feature.eyebrow}</div>
                <div className="display" style={{ fontSize: 32, lineHeight: 0.94 }}>
                  {feature.title}
                </div>
              </div>
              <div className="status-chip status-chip-good">{feature.stat}</div>
            </div>
            <div className="small">{feature.copy}</div>
          </div>
        ))}
      </div>

      <div className="card support-note public-callout stack">
        <div className="eyebrow">What A Mesocycle Is</div>
        <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
          One focused 4 to 8 week phase
        </div>
        <div className="small">
          Keep the plan stable, progress it honestly, then build the next block from real data.
        </div>
      </div>

      <div id="public-evidence" className="stack">
        <div className="page-section-head">
          <div className="eyebrow">Why RIR Works</div>
          <div className="display" style={{ fontSize: 38, lineHeight: 0.92 }}>
            Train hard without guessing
          </div>
        </div>
        <div className="card stack section-card public-research-lead">
          <div className="small">
            RIR gives you a practical way to push hard enough for growth without forcing every set to absolute failure.
          </div>
        </div>
        <div className="public-evidence-grid">
          {PUBLIC_EVIDENCE.map((item) => (
            <div key={item.source} className="card stack public-evidence-card">
              <div className="mono tiny gold">{item.source}</div>
              <div className="display" style={{ fontSize: 28, lineHeight: 0.94 }}>
                {item.title}
              </div>
              <div className="small">{item.copy}</div>
            </div>
          ))}
        </div>
      </div>

      <div id="public-signup" className="card hero-panel public-signup-band">
        <div className="public-signup-grid">
          <div className="stack public-signup-copy">
            <div className="eyebrow">Get Started</div>
            <div className="display" style={{ fontSize: 48, lineHeight: 0.9 }}>
              Start Your First Phase
            </div>
            <div className="small">
              Create an account and keep every block tied to your own history.
            </div>
            <div className="public-chip-row">
              <span className="status-chip status-chip-good">Free to start</span>
              <span className="status-chip">Email + password</span>
            </div>
          </div>

          <CloudSyncCard
            hasMeso={false}
            publicMode
            initialConfig={initialConfig}
            cloudUser={cloudUser}
            cloudStatus={cloudStatus}
            cloudBusy={cloudBusy}
            onSaveCloudConfig={onSaveCloudConfig}
            onSignUp={onSignUp}
            onSignIn={onSignIn}
            onForgotPassword={onForgotPassword}
            onSignOut={() => {}}
            onRefresh={() => {}}
            onOpenArchive={() => {}}
            archivedCount={0}
          />
        </div>
      </div>

    </div>
  );
}

function CloudSyncCard({
  hasMeso,
  publicMode = false,
  initialConfig,
  cloudUser,
  bodyweightProfile,
  preferredUnit,
  cloudStatus,
  cloudBusy,
  onSaveCloudConfig,
  onSignUp,
  onSignIn,
  onForgotPassword,
  onSignOut,
  onRefresh,
  onSaveBodyweight,
  onOpenArchive,
  archivedCount,
}) {
  const hasHostedConfig = Boolean(initialConfig?.url && initialConfig?.anonKey);
  const [url, setUrl] = useState(initialConfig?.url || "");
  const [anonKey, setAnonKey] = useState(initialConfig?.anonKey || "");
  const [showConnectionSettings, setShowConnectionSettings] = useState(false);
  const [email, setEmail] = useState(cloudUser?.email || "");
  const [password, setPassword] = useState("");
  const [bodyweight, setBodyweight] = useState(bodyweightProfile?.currentBodyweight || "");
  const [bodyweightUnit, setBodyweightUnit] = useState(bodyweightProfile?.bodyweightUnit || preferredUnit || DEFAULT_UNIT);
  const accountEyebrow = cloudUser ? "Account" : publicMode ? "Email Access" : "Account";
  const accountTitle = cloudUser
    ? `You are now signed in as ${cloudUser.email}`
    : publicMode
      ? "Create your account"
      : "Sign in or create your account";
  const accountSummary = cloudUser
    ? "Your active mesocycle and archive live in your account, so your state stays consistent across devices."
    : publicMode
      ? "Use the same email and password fields for both paths: create a new account or sign back into an existing one."
      : "Use the same email and password fields for both paths: create a new account or sign back into an existing one.";
  const statusTone = /failed|invalid|incorrect|unavailable|unable/i.test(cloudStatus)
    ? "accent"
    : /signed in|updated|sent|created|saved|confirmed/i.test(cloudStatus)
      ? "gold"
      : "muted";
  const showStatus = Boolean(cloudStatus);
  const shouldShowConnectionFields = !hasHostedConfig && (!publicMode || showConnectionSettings);

  useEffect(() => {
    setUrl(initialConfig?.url || "");
    setAnonKey(initialConfig?.anonKey || "");
  }, [initialConfig]);

  useEffect(() => {
    if (hasHostedConfig) {
      setShowConnectionSettings(false);
    }
  }, [hasHostedConfig]);

  useEffect(() => {
    if (cloudUser?.email) {
      setEmail(cloudUser.email);
    }
  }, [cloudUser]);

  useEffect(() => {
    setBodyweight(bodyweightProfile?.currentBodyweight || "");
    setBodyweightUnit(bodyweightProfile?.bodyweightUnit || preferredUnit || DEFAULT_UNIT);
  }, [bodyweightProfile, preferredUnit]);

  return (
    <div className={`card stack ${publicMode ? "public-account-card" : ""}`}>
      <div className="eyebrow">{accountEyebrow}</div>
      <div className="display" style={{ fontSize: 38, lineHeight: 0.92 }}>
        {accountTitle}
      </div>
      <div className="small">{accountSummary}</div>
      {showStatus && (
        <div
          className="inset stack"
          style={{
            gap: 6,
            padding: 14,
            background:
              statusTone === "accent"
                ? "linear-gradient(180deg, rgba(217, 121, 23, 0.08), rgba(255, 255, 255, 0.95))"
                : statusTone === "gold"
                  ? "linear-gradient(180deg, rgba(24, 166, 111, 0.08), rgba(255, 255, 255, 0.95))"
                  : undefined,
          }}
        >
          {!publicMode && <div className="label tiny">Status</div>}
          <div className={`mono small ${statusTone}`}>{cloudStatus}</div>
        </div>
      )}
      {publicMode && !hasHostedConfig && (
        <button
          className="text-action"
          onClick={() => setShowConnectionSettings((current) => !current)}
        >
          {showConnectionSettings ? "Hide connection settings" : "Manual connection settings"}
        </button>
      )}
      {shouldShowConnectionFields && (
        <>
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Project URL"
          />
          <input
            type="text"
            value={anonKey}
            onChange={(event) => setAnonKey(event.target.value)}
            placeholder="Public key"
          />
          <button
            className="btn-ghost"
            onClick={() => onSaveCloudConfig({ url: url.trim(), anonKey: anonKey.trim() })}
          >
            Save Connection
          </button>
        </>
      )}
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
      />
      {!cloudUser && (
        <>
          {publicMode ? (
            <div className="small muted">
              Create a new account or sign back in with the same email and password.
            </div>
          ) : (
            <div className="notice stack" style={{ gap: 12 }}>
              <div className="eyebrow">Email Account Access</div>
              <div className="grid-2">
                <div className="step-card stack" style={{ gap: 8, padding: 14 }}>
                  <div className="label tiny accent">New User</div>
                  <div className="small">
                    Enter your email and password, then tap <span className="mono">Create Account With Email</span>.
                  </div>
                </div>
                <div className="step-card stack" style={{ gap: 8, padding: 14 }}>
                  <div className="label tiny gold">Returning User</div>
                  <div className="small">
                    Use the same fields, then tap <span className="mono">Sign In</span> to load your account data.
                  </div>
                </div>
              </div>
              <div className="small muted">
                Password guidance: use at least 8 characters. Shorter passwords are more likely to fail or be too weak.
              </div>
            </div>
          )}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />
          <div className="title-row" style={{ justifyContent: "flex-end" }}>
            <button
              className="text-action"
              disabled={cloudBusy || !email.trim()}
              onClick={() => onForgotPassword(email.trim())}
            >
              Forgot password?
            </button>
          </div>
          <div className="grid-2">
            <button
              className="btn-ghost"
              disabled={cloudBusy || !email.trim() || !password}
              onClick={() => onSignUp(email.trim(), password)}
            >
              {cloudBusy ? "Working..." : "Create Account With Email"}
            </button>
            <button
              className="btn-sm"
              disabled={cloudBusy || !email.trim() || !password}
              onClick={() => onSignIn(email.trim(), password)}
            >
              {cloudBusy ? "Working..." : "Sign In"}
            </button>
          </div>
          {!publicMode && (
            <div className="tiny muted">
              If email confirmation is enabled, you will receive a verification email before your first full sign-in.
            </div>
          )}
        </>
      )}
      {cloudUser && (
        <>
          <div className="inset stack" style={{ padding: 14 }}>
            <div className="title-row">
              <div>
                <div className="label tiny gold">current bodyweight</div>
                <div className="tiny muted">
                  Pull-ups and dips will prefill with the latest saved bodyweight.
                </div>
              </div>
              <div className="status-chip">
                {bodyweight === "" ? "not set" : `${formatKg(bodyweight)} ${bodyweightUnit}`}
              </div>
            </div>
            <div className="grid-2">
              <input
                type="number"
                min="0"
                step={getUnitStep(bodyweightUnit)}
                value={bodyweight}
                onChange={(event) => setBodyweight(event.target.value)}
                placeholder={`Bodyweight (${bodyweightUnit})`}
              />
              <div className="grid-2">
                {UNIT_OPTIONS.map((option) => (
                  <button
                    key={`bodyweight-${option}`}
                    className={`pill-btn gold ${bodyweightUnit === option ? "active" : ""}`}
                    onClick={() => setBodyweightUnit(option)}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="title-row">
              <button
                className="btn-ghost"
                onClick={() => {
                  setBodyweight("");
                  onSaveBodyweight("", bodyweightUnit);
                }}
                disabled={cloudBusy}
              >
                Clear
              </button>
              <button
                className="btn-sm"
                onClick={() => onSaveBodyweight(bodyweight, bodyweightUnit)}
                disabled={cloudBusy}
              >
                Save Bodyweight
              </button>
            </div>
          </div>
          <div className="grid-3">
            <button className="btn-ghost" onClick={onRefresh}>
              Refresh
            </button>
            <button className="btn-ghost" onClick={onOpenArchive}>
              Archive
            </button>
            <button className="btn-ghost" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        </>
      )}
      <div className="tiny muted">
        {cloudUser
          ? `${archivedCount || 0} archived mesocycles saved to your account.`
          : publicMode
            ? "Your phases and history stay tied to your account."
            : "Once signed in, HyperPhases keeps your training state tied to your account."}
      </div>
    </div>
  );
}

function SupportCheckoutScreen({
  cloudUser,
  supabaseClient,
  initialSuccess,
  onClearSuccess,
  onBack,
  onOpenContact,
}) {
  const [selectedAmount, setSelectedAmount] = useState(DEFAULT_SUPPORT_AMOUNT);
  const [customAmount, setCustomAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [checkoutMode, setCheckoutMode] = useState(initialSuccess ? "success" : "idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialSuccess) return;
    setCheckoutMode("success");
    setClientSecret("");
    setError("");
  }, [initialSuccess]);

  const stripeAvailable = Boolean(DEPLOY_CONFIG.stripePublishableKey && window.Stripe);
  const activeAmountInput = customAmount !== "" ? customAmount : selectedAmount;
  const normalizedAmount = normalizeSupportAmount(activeAmountInput);
  const checkoutLabel = normalizedAmount ? formatEuro(normalizedAmount) : "custom amount";

  useEffect(() => {
    if (checkoutMode !== "checkout" || !clientSecret) return undefined;
    let cancelled = false;
    let checkoutInstance = null;

    (async () => {
      try {
        const stripe = await getStripeClient();
        if (!stripe) {
          throw new Error("Stripe is not configured yet. Add the publishable key in config.js first.");
        }
        checkoutInstance = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => clientSecret,
        });
        if (cancelled) {
          checkoutInstance.destroy?.();
          return;
        }
        const mountTarget = document.getElementById("support-checkout");
        if (!mountTarget) {
          throw new Error("Checkout container could not be created.");
        }
        mountTarget.innerHTML = "";
        checkoutInstance.mount("#support-checkout");
      } catch (mountError) {
        console.error(mountError);
        if (!cancelled) {
          setCheckoutMode("idle");
          setClientSecret("");
          setError(mountError.message || "Unable to load checkout.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (checkoutInstance?.destroy) {
        checkoutInstance.destroy();
      }
      const mountTarget = document.getElementById("support-checkout");
      if (mountTarget) {
        mountTarget.innerHTML = "";
      }
    };
  }, [checkoutMode, clientSecret]);

  const resetCheckout = useCallback(() => {
    setClientSecret("");
    setCheckoutMode("idle");
    setError("");
  }, []);

  const handlePresetSelect = useCallback(
    (amount) => {
      if (initialSuccess) {
        onClearSuccess();
      }
      setSelectedAmount(amount);
      setCustomAmount("");
      resetCheckout();
    },
    [initialSuccess, onClearSuccess, resetCheckout]
  );

  const handleCustomAmountChange = useCallback(
    (value) => {
      if (initialSuccess) {
        onClearSuccess();
      }
      setCustomAmount(value);
      resetCheckout();
    },
    [initialSuccess, onClearSuccess, resetCheckout]
  );

  const handleStartCheckout = useCallback(async () => {
    try {
      setBusy(true);
      setError("");
      if (initialSuccess) {
        onClearSuccess();
      }
      const stripe = await getStripeClient();
      if (!stripe) {
        throw new Error("Stripe is not configured yet. Add the publishable key in config.js first.");
      }
      const payload = await createSupportCheckoutSession({
        supabaseClient,
        amount: activeAmountInput,
        email: cloudUser?.email || "",
      });
      if (!payload?.clientSecret) {
        throw new Error("Checkout session was created without a client secret.");
      }
      setClientSecret(payload.clientSecret);
      setCheckoutMode("checkout");
    } catch (checkoutError) {
      console.error(checkoutError);
      setCheckoutMode("idle");
      setClientSecret("");
      setError(checkoutError.message || "Unable to start checkout.");
    } finally {
      setBusy(false);
    }
  }, [activeAmountInput, cloudUser, initialSuccess, onClearSuccess, supabaseClient]);

  return (
    <div className="stack">
      <div className="sticky">
        <div className="card header-card">
          <div className="space-between">
            <div>
              <div className="display" style={{ fontSize: 42, lineHeight: 0.9 }}>
                Support <span className="accent">HyperPhases</span>
              </div>
              <div className="mono tiny gold">
                Help fund development, infrastructure, and the next round of improvements.
              </div>
            </div>
            <button className="btn-ghost" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="card stack analytics-card">
        <div className="eyebrow">Support The Platform</div>
        <div className="display" style={{ fontSize: 46, lineHeight: 0.92 }}>
          Keep HyperPhases Moving
        </div>
        <div className="small">
          If the platform is useful, you can support ongoing product work with a one-time payment. This helps cover infrastructure, maintenance, and future improvements without pushing the app toward subscription friction.
        </div>
        <div className="notice">
          <div className="label tiny gold" style={{ marginBottom: 8 }}>
            signed in account
          </div>
          <div className="small">
            This checkout will be prefilled for <span className="mono">{cloudUser?.email}</span>.
          </div>
        </div>
        <div className="title-row">
          <div className="tiny muted">Need help instead of making a payment?</div>
          <button className="btn-ghost" onClick={onOpenContact}>
            Contact Team
          </button>
        </div>
      </div>

      {checkoutMode === "success" ? (
        <div className="card stack analytics-card">
          <div className="eyebrow">Payment Complete</div>
          <div className="display" style={{ fontSize: 50, lineHeight: 0.9 }}>
            Thank You
          </div>
          <div className="small">
            Your support has been received. It directly funds the product and keeps HyperPhases sustainable while the core tracking experience stays lightweight.
          </div>
          <div className="grid-2">
            <button
              className="btn-ghost"
              onClick={() => {
                onClearSuccess();
                resetCheckout();
              }}
            >
              Support Again
            </button>
            <button className="btn-sm" onClick={onBack}>
              Return Home
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card stack">
            <div className="title-row">
              <div>
                <div className="eyebrow">Choose Amount</div>
                <div className="display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                  One-Time Support
                </div>
              </div>
              <div className="mono tiny gold">EUR</div>
            </div>
            <div className="grid-3">
              {SUPPORT_PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  className={`pill-btn gold ${customAmount === "" && Number(selectedAmount) === amount ? "active" : ""}`}
                  onClick={() => handlePresetSelect(amount)}
                >
                  <span className="display" style={{ fontSize: 28 }}>
                    {formatEuro(amount)}
                  </span>
                </button>
              ))}
            </div>
            <div className="stack">
              <div className="label tiny gold">custom amount</div>
              <input
                type="number"
                min={MIN_SUPPORT_AMOUNT_EUR}
                max={MAX_SUPPORT_AMOUNT_EUR}
                step="1"
                value={customAmount}
                onChange={(event) => handleCustomAmountChange(event.target.value)}
                placeholder={`Enter ${MIN_SUPPORT_AMOUNT_EUR} to ${MAX_SUPPORT_AMOUNT_EUR} EUR`}
              />
              <div className="tiny muted">
                Support amounts can be between {formatEuro(MIN_SUPPORT_AMOUNT_EUR)} and {formatEuro(MAX_SUPPORT_AMOUNT_EUR)}.
              </div>
            </div>
            {!stripeAvailable && (
              <div className="notice">
                <div className="label tiny" style={{ color: "var(--warn)", marginBottom: 8 }}>
                  setup needed
                </div>
                <div className="small">
                  Stripe checkout is not configured yet. Add your Stripe publishable key to <span className="mono">config.js</span> and load Stripe.js in the page before using this screen.
                </div>
              </div>
            )}
            {error && (
              <div className="notice" style={{ borderColor: "rgba(217, 121, 23, 0.28)" }}>
                <div className="small" style={{ color: "var(--warn)" }}>{error}</div>
              </div>
            )}
            <button
              className="btn-primary"
              disabled={busy || !normalizedAmount || !stripeAvailable}
              onClick={handleStartCheckout}
            >
              {busy ? "Preparing Checkout" : `Continue with ${checkoutLabel}`}
            </button>
          </div>

          {checkoutMode === "checkout" && (
            <div className="card stack">
              <div className="title-row">
                <div>
                  <div className="eyebrow">Secure Payment</div>
                  <div className="display" style={{ fontSize: 38, lineHeight: 0.92 }}>
                    Embedded Checkout
                  </div>
                </div>
                <button className="btn-ghost" onClick={resetCheckout}>
                  Change Amount
                </button>
              </div>
              <div className="small muted">
                Complete your payment below without leaving HyperPhases.
              </div>
              <div id="support-checkout" className="checkout-shell" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ContactFeedbackScreen({ onBack, onOpenSupport }) {
  const feedbackMailto =
    "mailto:feedback@hyperphases.com?subject=HyperPhases%20Feedback";

  return (
    <div className="stack">
      <div className="sticky">
        <div className="card header-card">
          <div className="space-between">
            <div>
              <div className="display" style={{ fontSize: 42, lineHeight: 0.9 }}>
                Contact <span className="accent">HyperPhases</span>
              </div>
              <div className="mono tiny gold">
                Feedback, bug reports, account help, and training-log issues.
              </div>
            </div>
            <button className="btn-ghost" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="card stack analytics-card">
        <div className="eyebrow">Contact & Feedback</div>
        <div className="display" style={{ fontSize: 46, lineHeight: 0.92 }}>
          Reach The Team
        </div>
        <div className="small">
          HyperPhases uses a direct email support model. Send product feedback, bug reports, account questions, or logging issues to the team and include enough detail for a fast response.
        </div>
        <div className="inset stack contact-points" style={{ padding: 16 }}>
          <div className="label tiny gold">primary email</div>
          <div className="mono" style={{ fontSize: 14 }}>feedback@hyperphases.com</div>
          <div className="tiny muted">
            For bugs, include device, browser, what you expected, and the steps that caused the issue.
          </div>
        </div>
        <div className="grid-2">
          <a className="btn-primary support-link" href={feedbackMailto}>
            Email Feedback
          </a>
          <button className="btn-ghost" onClick={onOpenSupport}>
            Support HyperPhases
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card action-panel stack">
          <div className="eyebrow">Bug Report</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 0.94 }}>
            Something Broke
          </div>
          <div className="small muted">
            Report app errors, broken flows, layout issues, or incorrect training-state behavior.
          </div>
        </div>
        <div className="card action-panel stack">
          <div className="eyebrow">Product Feedback</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 0.94 }}>
            Improve The Product
          </div>
          <div className="small muted">
            Share ideas for better planning, analytics, logging, or recovery guidance.
          </div>
        </div>
        <div className="card action-panel stack">
          <div className="eyebrow">Account Help</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 0.94 }}>
            Access Or Sign-In
          </div>
          <div className="small muted">
            Use this path for password reset issues, authentication problems, or account confusion.
          </div>
        </div>
        <div className="card action-panel stack">
          <div className="eyebrow">Training Log</div>
          <div className="display" style={{ fontSize: 30, lineHeight: 0.94 }}>
            Data Or Session Issue
          </div>
          <div className="small muted">
            Report incorrect mesocycle state, session-save problems, history issues, or missing progression data.
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionScreen({
  meso,
  currentBodyweight,
  sessionState,
  setSessionState,
  onBack,
  onSave,
  onSwap,
  onEditIncrement,
  onOpenHistory,
  onToggleBodyweight,
}) {
  const muscles = Object.keys(sessionState.log || {});
  const allDone = muscles.every((muscle) => isMuscleDone(sessionState, muscle));
  const allRated = muscles.every((muscle) => isMuscleRated(sessionState, muscle));
  const unitLabel = getUnitLabel(meso?.unit);
  const unitStep = getUnitStep(meso?.unit);
  const targetRIR = targetRIRForWeek(meso.week);
  const phaseGuide = getPhaseGuide(meso);
  const completedMuscles = muscles.filter((muscle) => isMuscleDone(sessionState, muscle)).length;

  const updateSet = (muscle, exIdx, setIdx, field, value) => {
    setSessionState((current) => ({
      ...current,
      log: {
        ...current.log,
        [muscle]: current.log[muscle].map((block, blockIdx) =>
          blockIdx === exIdx
            ? {
                ...block,
                sets: block.sets.map((set, idx) => (idx === setIdx ? { ...set, [field]: value } : set)),
              }
            : block
        ),
      },
    }));
  };

  const addSet = (muscle, exIdx) => {
    setSessionState((current) => ({
      ...current,
      log: {
        ...current.log,
        [muscle]: current.log[muscle].map((block, idx) =>
          idx === exIdx
            ? {
                ...block,
                sets: [
                  ...block.sets,
                  {
                    id: Date.now() + Math.random(),
                    weight: "",
                    reps: 10,
                    rir: targetRIR,
                    done: false,
                  },
                ],
              }
            : block
        ),
      },
    }));
  };

  const updateFeedback = (muscle, field, value) => {
    setSessionState((current) => ({
      ...current,
      feedback: {
        ...current.feedback,
        [muscle]: {
          ...(current.feedback[muscle] || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateExerciseNotes = (muscle, exIdx, notes) => {
    setSessionState((current) => ({
      ...current,
      log: {
        ...current.log,
        [muscle]: current.log[muscle].map((block, idx) =>
          idx === exIdx ? { ...block, notes } : block
        ),
      },
    }));
  };

  return (
    <div className="stack">
      <div className="sticky">
        <div className="card header-card">
          <div className="space-between">
            <div>
              <div className="display" style={{ fontSize: 42, lineHeight: 0.9 }}>
                {sessionState.dayLabel}
              </div>
              <div className="mono tiny gold">
                Week {meso.week} · Target RIR {targetRIRForWeek(meso.week)}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <span className="status-chip" style={getCoachToneStyles(phaseGuide?.tone)}>
                  {phaseGuide?.label}
                </span>
              </div>
            </div>
            <div className="row">
              <button className="btn-ghost" onClick={onBack}>
                Back
              </button>
              {allDone && allRated && (
                <button className="btn-sm" onClick={onSave}>
                  Save ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card hero-panel session-overview stack">
        <div className="title-row">
          <div>
            <div className="eyebrow">Session Console</div>
            <div className="display" style={{ fontSize: 40, lineHeight: 0.92 }}>
              Execute The Plan
            </div>
          </div>
          <div className="status-chip status-chip-good">
            {completedMuscles}/{muscles.length} muscles complete
          </div>
        </div>
        <div className="small">
          {phaseGuide?.title}: {phaseGuide?.focus}
        </div>
        <div className="goal-track">
          <div className="goal-fill" style={{ width: `${clamp((completedMuscles / Math.max(1, muscles.length)) * 100, 0, 100)}%` }} />
        </div>
      </div>

      {muscles.map((muscle) => {
        const rated = isMuscleRated(sessionState, muscle);
        const done = isMuscleDone(sessionState, muscle);
        return (
          <div key={muscle} className="card stack">
            <div className="space-between" style={{ alignItems: "flex-start" }}>
              <div className="label tiny accent">{muscle}</div>
              <div className={`label tiny ${done && !rated ? "accent" : rated ? "gold" : "muted"}`}>
                {rated ? "✓ Rated" : done ? "Rate now ↓" : ""}
              </div>
            </div>
            {(sessionState.log[muscle] || []).map((block, exIdx) => {
              const progressionGuide = getProgressionGuide(
                meso,
                muscle,
                block.exercise,
                block.bodyweightMode
              );
              return (
                <div
                  key={`${muscle}-${block.exercise}-${exIdx}`}
                  className={`exercise-block stack ${block.bodyweightMode ? "exercise-block-bodyweight" : ""}`}
                >
                  <div className="exercise-header">
                    <div className="stack" style={{ gap: 6 }}>
                      <div className="display" style={{ fontSize: 28 }}>
                        {block.exercise}
                      </div>
                      <div className="exercise-meta">
                        <span className="status-chip">Target {targetRIR} RIR</span>
                        <span className="status-chip">Inc ±{formatKg(block.increment)}{unitLabel}</span>
                        {block.bodyweightMode && (
                          <span className="status-chip" style={getCoachToneStyles("good")}>
                            Bodyweight Mode
                          </span>
                        )}
                        {block.bodyweightMode && currentBodyweight !== "" && (
                          <span className="status-chip status-chip-good">
                            BW {currentBodyweight} {unitLabel}
                          </span>
                        )}
                        {(() => {
                          const previous = getLastPerformance(meso.sessions, muscle, block.exercise);
                          return previous ? (
                            <span className="status-chip status-chip-good">
                              {previous.bodyweightMode
                                ? previous.weight === "" || Number(previous.weight) === 0
                                  ? `Last BW x ${previous.reps} @ ${previous.rir} RIR`
                                  : `Last BW + ${formatKg(previous.weight)} ${unitLabel} x ${previous.reps} @ ${previous.rir} RIR`
                                : `Last ${formatKg(previous.weight)} ${unitLabel} x ${previous.reps} @ ${previous.rir} RIR`}
                            </span>
                          ) : (
                            <span className="status-chip">First log for this movement</span>
                          );
                        })()}
                        <span className="status-chip" style={getCoachToneStyles(progressionGuide.tone)}>
                          {progressionGuide.label}
                        </span>
                      </div>
                    </div>
                    <div className="exercise-actions">
                      <button
                        className={`btn-ghost ${block.bodyweightMode ? "bodyweight-toggle-active" : ""}`}
                        onClick={() => onToggleBodyweight(muscle, exIdx, block.exercise, !block.bodyweightMode)}
                      >
                        {block.bodyweightMode ? "BW ✓" : "bodyweight"}
                      </button>
                      <button
                        className="badge"
                        onClick={() => onEditIncrement(muscle, exIdx, block.increment, block.exercise)}
                      >
                        ±{formatKg(block.increment)}{unitLabel}
                      </button>
                      <button className="btn-ghost" onClick={() => onOpenHistory(muscle, block.exercise)}>
                        history
                      </button>
                      <button className="btn-ghost" onClick={() => onSwap(muscle, exIdx)}>
                        swap
                      </button>
                    </div>
                  </div>
                  <div className="tiny muted">{progressionGuide.detail}</div>
                  <div className="session-grid header">
                    <div>#</div>
                    <div>{block.bodyweightMode ? `ADD ${unitLabel.toUpperCase()}` : unitLabel.toUpperCase()}</div>
                    <div>REPS</div>
                    <div>RIR</div>
                    <div>✓</div>
                  </div>
                  {block.sets.map((set, setIdx) => (
                    <div key={set.id} className={`session-grid ${set.done ? "done" : "active"}`}>
                      <div className="mono tiny gold">{setIdx + 1}</div>
                      <input
                        type="number"
                        step={unitStep}
                        value={set.weight}
                        placeholder={block.bodyweightMode ? "optional" : ""}
                        onChange={(event) => updateSet(muscle, exIdx, setIdx, "weight", event.target.value)}
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(event) => updateSet(muscle, exIdx, setIdx, "reps", Number(event.target.value))}
                      />
                      <select
                        value={set.rir}
                        onChange={(event) =>
                          updateSet(
                            muscle,
                            exIdx,
                            setIdx,
                            "rir",
                            event.target.value === "" ? "" : Number(event.target.value)
                          )
                        }
                      >
                        <option value="">-</option>
                        {[0, 1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <button
                        className={`done-btn ${set.done ? "active" : ""}`}
                        onClick={() => updateSet(muscle, exIdx, setIdx, "done", !set.done)}
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                  <button className="btn-ghost add-set-btn" onClick={() => addSet(muscle, exIdx)}>
                    + add set
                  </button>
                  <div className="stack" style={{ gap: 6 }}>
                    <div className="label tiny gold">exercise notes</div>
                    <textarea
                      rows="3"
                      value={block.notes || ""}
                      onChange={(event) => updateExerciseNotes(muscle, exIdx, event.target.value)}
                      placeholder="Technique, machine used, pain, grip, tempo, substitutions..."
                    />
                  </div>
                </div>
              );
            })}

            {done && (
              <div className="feedback-card stack">
                <div className="display gold" style={{ fontSize: 32, lineHeight: 0.92 }}>
                  How was {muscle}?
                </div>
                <FeedbackGroup
                  title="Pump"
                  field="pump"
                  options={FEEDBACK_OPTIONS.pump}
                  value={sessionState.feedback[muscle]?.pump}
                  onSelect={(value) => updateFeedback(muscle, "pump", value)}
                />
                <FeedbackGroup
                  title="Soreness from last session"
                  field="soreness"
                  options={FEEDBACK_OPTIONS.soreness}
                  value={sessionState.feedback[muscle]?.soreness}
                  onSelect={(value) => updateFeedback(muscle, "soreness", value)}
                />
                <FeedbackGroup
                  title="Performance vs last week"
                  field="performance"
                  options={FEEDBACK_OPTIONS.performance}
                  value={sessionState.feedback[muscle]?.performance}
                  onSelect={(value) => updateFeedback(muscle, "performance", value)}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="card">
        <div className="stack" style={{ gap: 8, marginBottom: 16 }}>
          <div className="label tiny gold">session notes</div>
          <textarea
            rows="4"
            value={sessionState.notes || ""}
            onChange={(event) =>
              setSessionState((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            placeholder="Overall context for this workout: energy, time pressure, equipment availability, unusual fatigue..."
          />
        </div>
        {allDone && !allRated ? (
          <div className="mono tiny muted">Rate all muscle groups above to finish.</div>
        ) : allDone && allRated ? (
          <button className="btn-primary" onClick={onSave}>
            Save Session
          </button>
        ) : (
          <div className="mono tiny muted">Complete at least one done set for every exercise to finish the session.</div>
        )}
      </div>
    </div>
  );
}

function FeedbackGroup({ title, options, value, onSelect }) {
  return (
    <div className="stack">
      <div className="label tiny">{title}</div>
      <div className="feedback-options">
        {options.map((option) => (
          <button
            key={option.value}
            className={`feedback-btn ${value === option.value ? "active" : ""}`}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwapModal({ meso, muscle, current, onClose, onSwap }) {
  const options = Array.from(new Set([current, ...getAllExerciseOptions(muscle)]));
  const [draft, setDraft] = useState("");
  const addCustomSwap = () => {
    const normalized = normalizeExerciseName(draft);
    if (!normalized) return;
    const canonical =
      options.find((item) => item.toLowerCase() === normalized.toLowerCase()) || normalized;
    onSwap(canonical);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(event) => event.stopPropagation()}>
        <div className="title-row">
          <div>
            <div className="eyebrow">// swap</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              Swap — {muscle}
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="notice" style={{ borderColor: "rgba(232, 122, 0, 0.35)" }}>
          <div className="label tiny" style={{ color: "var(--warn)", marginBottom: 8 }}>
            warning
          </div>
          <div className="small">
            Swapping mid-meso resets the RIR baseline for this movement. RP-style advice is to keep exercises stable across the full mesocycle when possible.
          </div>
        </div>
        <div className="inset stack" style={{ padding: 12 }}>
          <div className="label tiny gold">pick or add exercise</div>
          <input
            list={`swap-library-${muscle}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Type or choose a ${muscle} exercise`}
          />
          <datalist id={`swap-library-${muscle}`}>
            {options.map((exercise) => (
              <option key={`${muscle}-swap-${exercise}`} value={exercise} />
            ))}
          </datalist>
          <button className="btn-ghost" onClick={addCustomSwap}>
            Use This Exercise
          </button>
        </div>
        {options.map((exercise) => {
          const active = exercise === current;
          return (
            <button
              key={exercise}
              className="chip"
              disabled={active}
              onClick={() => onSwap(exercise)}
              style={{
                opacity: active ? 0.45 : 1,
                fontStyle: active ? "italic" : "normal",
                textAlign: "left",
              }}
            >
              {exercise}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IncrementModal({ current, exerciseName, unit, onClose, onSave }) {
  const [value, setValue] = useState(current || DEFAULT_INCREMENT);
  const unitLabel = getUnitLabel(unit);
  const unitStep = getUnitStep(unit);
  const valid = Number(value) > 0;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(event) => event.stopPropagation()}>
        <div className="title-row">
          <div>
            <div className="eyebrow">// increment</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              Weight Increment
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="small muted">
          {exerciseName} · How much does this exercise increase by each step?
        </div>
        <div className="grid-3">
          {[1, 2.5, 5, 10, 15, 20].map((preset) => (
            <button
              key={preset}
              className={`pill-btn gold ${Number(value) === preset ? "active" : ""}`}
              onClick={() => setValue(preset)}
            >
              <span className="display" style={{ fontSize: 28 }}>
                {preset}
              </span>
            </button>
          ))}
        </div>
        <input
          type="number"
          min="0.5"
          step={unitStep}
          value={value}
          onChange={(event) => setValue(event.target.value === "" ? "" : Number(event.target.value))}
          placeholder={`Custom ${unitLabel} increment`}
        />
        <button className="btn-primary" onClick={() => valid && onSave(Number(value))} disabled={!valid}>
          Save Increment
        </button>
      </div>
    </div>
  );
}

function ManageExercisesSheet({ meso, onClose, onAdd, onRemove }) {
  const activeMuscles = getActiveMusclesFromSlots(getMesoDaySlots(meso));
  const [drafts, setDrafts] = useState({});

  const updateDraft = (muscle, value) => {
    setDrafts((current) => ({ ...current, [muscle]: value }));
  };

  const handleAdd = async (muscle) => {
    const draft = normalizeExerciseName(drafts[muscle]);
    if (!draft) return;
    const added = await onAdd(muscle, draft);
    if (added) {
      setDrafts((current) => ({ ...current, [muscle]: "" }));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(event) => event.stopPropagation()}>
        <div className="title-row">
          <div>
            <div className="eyebrow">Exercises</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              Manage Plan
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="small muted">
          Add or remove movements for future sessions. Existing logs stay intact, and exercises added mid-block start fresh from their next appearance in the mesocycle.
        </div>
        {activeMuscles.map((muscle) => (
          <div key={muscle} className="card stack">
            <div className="title-row">
              <div className="display" style={{ fontSize: 28 }}>{muscle}</div>
              <div className="mono tiny gold">{(meso.exercises[muscle] || []).length}/3 active</div>
            </div>
            <div className="inset stack" style={{ padding: 12 }}>
              <div className="label tiny gold">add exercise</div>
              <select
                value={
                  getAllExerciseOptions(muscle).includes(drafts[muscle] || "")
                    ? drafts[muscle] || ""
                    : ""
                }
                onChange={(event) => updateDraft(muscle, event.target.value)}
              >
                <option value="">Choose a {muscle} exercise</option>
                {getAllExerciseOptions(muscle).map((exercise) => (
                  <option key={`${muscle}-manage-${exercise}`} value={exercise}>
                    {exercise}
                  </option>
                ))}
              </select>
              <input
                value={drafts[muscle] || ""}
                onChange={(event) => updateDraft(muscle, event.target.value)}
                placeholder={`Or type a custom ${muscle} exercise`}
              />
              <div className="title-row">
                <div className="tiny muted">Pick from the dropdown or type your own movement.</div>
                <button
                  className="btn-ghost"
                  disabled={(meso.exercises[muscle] || []).length >= 3 || !normalizeExerciseName(drafts[muscle])}
                  onClick={() => handleAdd(muscle)}
                >
                  Add
                </button>
              </div>
            </div>
            {(meso.exercises[muscle] || []).length ? (
              (meso.exercises[muscle] || []).map((exercise) => (
                <div key={`${muscle}-${exercise}`} className="title-row">
                  <div className="small">{exercise}</div>
                  <button className="btn-ghost" onClick={() => onRemove(muscle, exercise)}>
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div className="tiny muted">No active exercises left for this muscle.</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchiveSheet({ mesos, onClose, onOpenDetail }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(event) => event.stopPropagation()}>
        <div className="title-row">
          <div>
            <div className="eyebrow">Archive</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              Previous Mesocycles
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {mesos.length ? (
          mesos.map((item) => (
            <button
              key={item.remoteId || item.updatedAt}
              className="card stack"
              onClick={() => onOpenDetail(item)}
              style={{ textAlign: "left" }}
            >
              <div className="title-row">
                <div>
                  <div className="display" style={{ fontSize: 30 }}>
                    {item.name || item.splitName || item.split?.name || "Archived Meso"}
                  </div>
                  <div className="tiny muted">
                    {new Date(item.startedAt || item.started).toLocaleDateString()} · {item.totalWeeks} weeks
                  </div>
                </div>
                <div className="badge">{item.completedAt ? "Done" : "Archived"}</div>
              </div>
              <div className="small muted">
                {(item.sessions || []).filter((session) => !session.synthetic).length} logged sessions
              </div>
            </button>
          ))
        ) : (
          <div className="card small muted">No previous mesocycles saved yet.</div>
        )}
      </div>
    </div>
  );
}

function ArchivedMesoDetailSheet({ meso, onClose, onUseAsTemplate }) {
  const summary = getMesoSummaryStats(meso);
  const unitLabel = getUnitLabel(meso?.unit);
  const phaseGuide = getPhaseGuide(meso);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(event) => event.stopPropagation()}>
        <div className="title-row">
          <div>
            <div className="eyebrow">Archived Block</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              {meso.name || meso.splitName || meso.split?.name || "Archived Meso"}
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="card stack analytics-card">
          <div className="title-row">
            <div>
              <div className="eyebrow">Phase Review</div>
              <div className="display" style={{ fontSize: 34, lineHeight: 0.92 }}>
                {phaseGuide?.title}
              </div>
            </div>
            <div className="status-chip" style={getCoachToneStyles(phaseGuide?.tone)}>
              {phaseGuide?.label}
            </div>
          </div>
          <div className="small">{phaseGuide?.copy}</div>
          <button className="btn-primary" onClick={() => onUseAsTemplate(meso)}>
            Build New Block From This
          </button>
        </div>
        <div className="grid-2">
          <div className="card stack analytics-card">
            <div className="eyebrow">Timeline</div>
            <div className="small">
              {new Date(meso.startedAt || meso.started).toLocaleDateString()} to{" "}
              {new Date(meso.completedAt || meso.updatedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="card stack analytics-card">
            <div className="eyebrow">Sessions</div>
            <div className="display" style={{ fontSize: 40, lineHeight: 0.88 }}>
              {(meso.sessions || []).filter((session) => !session.synthetic).length}
            </div>
          </div>
        </div>
        <div className="card stack">
          <div className="eyebrow">Top Movers</div>
          {(summary.topMovers || []).length ? (
            summary.topMovers.map((item) => (
              <div key={item.key} className="title-row">
                <div className="small">{item.exercise}</div>
                <div className="mono tiny gold">
                  {item.delta > 0 ? "+" : ""}{formatKg(item.delta)} {unitLabel}
                </div>
              </div>
            ))
          ) : (
            <div className="small muted">No weight history was logged in this block.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExerciseHistoryModal({ meso, muscle, exerciseName, onClose }) {
  const history = getExerciseHistoryRows(meso.sessions, muscle, exerciseName);
  const unitLabel = getUnitLabel(meso?.unit);
  const first = history.length
    ? history[history.length - 1].sets.find((set) => set.weight !== "" && !Number.isNaN(Number(set.weight))) || null
    : null;
  const latest = history.length
    ? [...history[0].sets].reverse().find((set) => set.weight !== "" && !Number.isNaN(Number(set.weight))) || null
    : null;
  const delta = first && latest ? latest.weight - first.weight : null;
  const progressionGuide = getProgressionGuide(
    meso,
    muscle,
    exerciseName,
    history[0]?.bodyweightMode
  );
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(event) => event.stopPropagation()}>
        <div className="title-row">
          <div>
            <div className="eyebrow">Exercise History</div>
            <div className="display" style={{ fontSize: 44, lineHeight: 0.94 }}>
              {exerciseName}
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="card stack analytics-card">
          <div className="eyebrow">Trend</div>
          {delta != null ? (
            <>
              <div className="small">
                {formatKg(first.weight)} {unitLabel} to {formatKg(latest.weight)} {unitLabel}
              </div>
              <div className="mono tiny" style={{ color: delta >= 0 ? "var(--ok)" : "var(--warn)" }}>
                {delta >= 0 ? "+" : ""}{formatKg(delta)} {unitLabel} across this mesocycle
              </div>
            </>
          ) : history[0]?.bodyweightMode ? (
            <div className="small muted">
              Bodyweight reps are being tracked here. Added load will appear when it is logged.
            </div>
          ) : (
            <div className="small muted">No completed sets logged yet for this exercise.</div>
          )}
        </div>
        <div className="card stack analytics-card">
          <div className="title-row">
            <div>
              <div className="eyebrow">Next Step</div>
              <div className="display" style={{ fontSize: 30, lineHeight: 0.92 }}>
                {progressionGuide.label}
              </div>
            </div>
            <div className="status-chip" style={getCoachToneStyles(progressionGuide.tone)}>
              {progressionGuide.tone === "good" ? "Progress" : progressionGuide.tone === "warn" ? "Caution" : "Baseline"}
            </div>
          </div>
          <div className="small">{progressionGuide.detail}</div>
        </div>
        {history.length ? (
          history.map((item, idx) => (
            <div key={`${exerciseName}-${item.week}-${item.date}-${idx}`} className="card stack">
              <div className="title-row">
                <div>
                  <div className="display" style={{ fontSize: 28 }}>Week {item.week}</div>
                  <div className="tiny muted">{new Date(item.date).toLocaleDateString()}</div>
                </div>
                {item.synthetic && <div className="badge">Seed</div>}
              </div>
              {item.sets.map((set, setIdx) => (
                <div key={`${item.date}-${setIdx}`} className="title-row">
                  <div className="mono tiny">Set {setIdx + 1}</div>
                  <div className="mono tiny gold">
                    {item.bodyweightMode
                      ? set.weight === "" || Number(set.weight) === 0
                        ? `BW only · ${set.reps} reps · RIR ${set.rir === "" ? "-" : set.rir}`
                        : `BW + ${formatKg(set.weight)} ${unitLabel} · ${set.reps} reps · RIR ${set.rir === "" ? "-" : set.rir}`
                      : `${formatKg(set.weight)} ${unitLabel} · ${set.reps} reps · RIR ${set.rir === "" ? "-" : set.rir}`}
                  </div>
                </div>
              ))}
              {item.notes ? (
                <div className="notice" style={{ padding: 12 }}>
                  <div className="label tiny gold" style={{ marginBottom: 6 }}>
                    exercise notes
                  </div>
                  <div className="small">{item.notes}</div>
                </div>
              ) : null}
              {item.sessionNotes ? (
                <div className="notice" style={{ padding: 12 }}>
                  <div className="label tiny gold" style={{ marginBottom: 6 }}>
                    session context
                  </div>
                  <div className="small">{item.sessionNotes}</div>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="card small muted">No previous completed sets found for this movement yet.</div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
