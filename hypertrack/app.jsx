const { useState, useEffect, useCallback } = React;

const STORAGE_KEY = "hypertrack_cian_v1";
const SUPABASE_CONFIG_KEY = "hypertrack_cian_supabase_v1";
const SUPABASE_TABLE = "hypertrack_mesos";
const DEFAULT_INCREMENT = 2.5;
const DEFAULT_UNIT = "kg";
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
    "Bodyweight only": ["Push-Up", "Deficit Push-Up", "Feet-Elevated Push-Up", "Ring Push-Up", "Tempo Push-Up"],
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
          weight: Number(set.weight),
          reps: Number(set.reps) || 10,
          rir: Number(set.rir),
        };
      }
    }
  }
  return null;
}

function calcNextWeight({ sessions, muscle, exerciseName, increment, week }) {
  const previous = getLastPerformance(sessions, muscle, exerciseName);
  if (!previous || Number.isNaN(previous.weight)) {
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
  };
}

function buildSessionState(meso, daySlotId) {
  const daySlot = getSlotById(meso, daySlotId);
  if (!daySlot) return null;
  const muscles = daySlot.muscles;
  const log = {};
  const targetRIR = targetRIRForWeek(meso.week);
  muscles.forEach((muscle) => {
    const selected = meso.exercises[muscle] || [];
    if (!selected.length) return;
    const setsPerExercise = Math.max(2, Math.round((meso.weeklyVolume[muscle] || MEV_MRV[muscle][0]) / Math.max(1, selected.length)));
    log[muscle] = selected.map((exercise) => {
      const increment = meso.increments[exercise] || DEFAULT_INCREMENT;
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
        sets: Array.from({ length: setsPerExercise }).map((_, idx) => ({
          id: Date.now() + Math.random() + idx,
          weight: idx === 0 ? suggestedWeight : "",
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
      const completedSets = (block.sets || []).filter(
        (set) => set.done && set.weight !== "" && !Number.isNaN(Number(set.weight))
      );
      if (!completedSets.length) return;
      rows.push({
        week: session.week,
        date: session.date,
        synthetic: Boolean(session.synthetic),
        sets: completedSets.map((set) => ({
          weight: Number(set.weight),
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
        const first = chronological[0]?.sets?.[0];
        const latest = chronological[chronological.length - 1]?.sets?.[chronological[chronological.length - 1].sets.length - 1];
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
  const [manageExercisesOpen, setManageExercisesOpen] = useState(false);
  const [cloudConfig, setCloudConfig] = useState(() => loadSupabaseConfig());
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [cloudUser, setCloudUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("Sign in to use HyperPhases.");
  const [cloudBusy, setCloudBusy] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
          : "Connect Supabase to sign in and use HyperPhases."
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
      setCloudStatus(
        data.user ? `Signed in as ${data.user.email}` : "Sign in to use HyperPhases."
      );
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setCloudUser(session?.user || null);
      setCloudStatus(
        session?.user
          ? `Signed in as ${session.user.email}`
          : "Sign in to use HyperPhases."
      );
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
          ? `Signed in as ${cloudUser.email}`
          : `Signed in as ${cloudUser.email}. Start your first mesocycle.`
      );
      setScreen((current) => {
        if (current === "setup" || current === "session") return current;
        return activeMeso ? "home" : "welcome";
      });
    } catch (error) {
      console.error(error);
      setCloudStatus("Cloud load failed.");
      setScreen("auth");
    } finally {
      setCloudBusy(false);
    }
  }, [cloudUser, supabaseClient]);

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
    setToast("Supabase config saved");
  }, []);

  const handleSignUp = useCallback(
    async (email, password) => {
      const client = createSupabaseClient(cloudConfig);
      if (!client) {
        setCloudStatus("Enter Supabase URL and anon key first");
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
          setCloudStatus(`Signed in as ${email}`);
          setToast("Account created");
        } else {
          setCloudStatus("Account created. Check email confirmation if required.");
          setToast("Sign-up submitted");
        }
      } catch (error) {
        console.error(error);
        setCloudStatus("Sign-up failed");
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
        setCloudStatus("Enter Supabase URL and anon key first");
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
        setCloudStatus(`Signed in as ${email}`);
        setToast("Signed in");
      } catch (error) {
        console.error(error);
        setCloudStatus("Sign-in failed");
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
      setCloudStatus("Signed out.");
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
    setScreen("setup");
  }, []);

  const startSession = useCallback(
    (daySlotId) => {
      if (!meso) return;
      const done = getWeekDoneDaySlotIds(meso, meso.week);
      if (done.includes(daySlotId)) return;
      const nextState = buildSessionState(meso, daySlotId);
      if (!nextState) return;
      setSessionState(nextState);
      setScreen("session");
    },
    [meso]
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
      const nextSession = {
        ...sessionState,
        log: {
          ...sessionState.log,
          [muscle]: sessionState.log[muscle].map((block, idx) =>
            idx === exIdx
              ? {
                  exercise: nextExercise,
                  increment,
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
      };
      setSessionState(nextSession);
      await persistMeso(nextMeso);
      setSwapTarget(null);
      setToast("Exercise swapped");
    },
    [meso, persistMeso, sessionState, swapTarget]
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
        />
      )}
      {screen === "welcome" && (
        <WelcomeScreen
          onStart={() => setScreen("setup")}
          hasMeso={Boolean(meso)}
          cloudUser={cloudUser}
          onOpenAccount={() => setAccountOpen(true)}
        />
      )}
      {screen === "setup" && (
        <SetupScreen
          onComplete={async (nextMeso, message) => {
            await createNewActiveMeso(nextMeso);
            setToast(message);
            setScreen("home");
          }}
          onCancel={() => setScreen(meso ? "home" : "welcome")}
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
        />
      )}
      {screen === "session" && meso && sessionState && (
        <SessionScreen
          meso={meso}
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
          onClose={() => setArchiveDetail(null)}
        />
      )}
      {accountOpen && (
        <AccountSheet
          hasMeso={Boolean(meso)}
          initialConfig={cloudConfig}
          cloudUser={cloudUser}
          cloudStatus={cloudStatus}
          cloudBusy={cloudBusy}
          archivedCount={archivedMesos.length}
          onClose={() => setAccountOpen(false)}
          onSaveCloudConfig={handleSaveCloudConfig}
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onRefresh={loadUserMesos}
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
      <div className="card hero-card stack">
        <div className="eyebrow">Adaptive Hypertrophy Tracking</div>
        <div className="display" style={{ fontSize: 104, lineHeight: 0.82 }}>
          Hyper
          <br />
          <span className="accent">Phases</span>
        </div>
        <div className="hero-subtitle">
          A cleaner, faster way to run a hypertrophy mesocycle with RIR-based load progression and feedback-led volume management.
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
      <div className="insight-grid">
        <div className="insight-card stack" style={{ gap: 6 }}>
          <div className="eyebrow">Load</div>
          <div className="display gold" style={{ fontSize: 34, lineHeight: 0.92 }}>
            RIR-led
          </div>
          <div className="tiny muted">Suggestions stay grounded in your last real performance.</div>
        </div>
        <div className="insight-card stack" style={{ gap: 6 }}>
          <div className="eyebrow">Volume</div>
          <div className="display gold" style={{ fontSize: 34, lineHeight: 0.92 }}>
            Adaptive
          </div>
          <div className="tiny muted">Pump, soreness, and output guide the weekly ramp.</div>
        </div>
        <div className="insight-card stack" style={{ gap: 6 }}>
          <div className="eyebrow">Workflow</div>
          <div className="display gold" style={{ fontSize: 34, lineHeight: 0.92 }}>
            Mobile
          </div>
          <div className="tiny muted">Dense enough for training, clean enough to trust at a glance.</div>
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
    </div>
  );
}

function SetupScreen({ onComplete, onCancel }) {
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
    const recommended = getRecommendedExercisePlan(equipment);
    const { normalizedExercises, normalizedIncrements } = normalizeExercisesAndIncrements(
      recommended,
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
        Build Exercise Plan
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
}) {
  const daySlots = getMesoDaySlots(meso);
  const activeMuscles = getActiveMusclesFromSlots(daySlots);
  const doneDayTypes = getWeekDoneDaySlotIds(meso, meso.week);
  const progress = meso.totalWeeks > 0 ? clamp(((meso.week - 1) / meso.totalWeeks) * 100, 0, 100) : 0;
  const complete = meso.week > meso.totalWeeks;
  const summary = getMesoSummaryStats(meso);
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
            <div className="row">
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
        <div className="card stack" style={{ textAlign: "center" }}>
          <div className="display gold" style={{ fontSize: 80, lineHeight: 0.85 }}>
            🏆
          </div>
          <div className="display" style={{ fontSize: 54, lineHeight: 0.88 }}>
            Meso Complete
          </div>
          <div className="small">
            Deload, assess fatigue, and start a fresh mesocycle when ready.
          </div>
          <button className="btn-primary" onClick={onNewMeso}>
            Start New Meso
          </button>
        </div>
      ) : (
        <>
          <div className="card stack">
            <div className="week-hero">
              <div className="stack" style={{ gap: 8 }}>
                <div className="eyebrow">Current Mesocycle</div>
                <div className="display" style={{ fontSize: 96, lineHeight: 0.8 }}>
                  {meso.week}
                </div>
                <div className="small muted">of {meso.totalWeeks} weeks</div>
                <div className="week-copy">
                  {meso.splitName || meso.split?.name || "Custom split"} · log each configured session once to move the week forward and keep progression aligned to your output.
                </div>
              </div>
              <div className="card" style={{ minWidth: 120, padding: 12 }}>
                <div className="display gold" style={{ fontSize: 54, lineHeight: 0.85 }}>
                  {targetRIRForWeek(meso.week)}
                </div>
                <div className="label tiny">Target RIR</div>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid-2">
            <div className="card stack analytics-card">
              <div className="eyebrow">Why RIR Works</div>
              <div className="small">
                RIR keeps progression tied to real effort so you can push load upward without turning every session into failure-based fatigue.
              </div>
              <div className="tiny muted">
                A mesocycle is a focused 4 to 8 week block where you keep the structure stable and progress load, effort, and volume across the phase.
              </div>
              <div className="goal-track">
                <div className="goal-fill" style={{ width: `${summary.mesoPct}%` }} />
              </div>
              <div className="mono tiny" style={{ color: "var(--ok)" }}>
                Week target set to {targetRIRForWeek(meso.week)} RIR across new sets
              </div>
            </div>
            <div className="card stack analytics-card">
              <div className="eyebrow">Progress Snapshot</div>
              <div className="display" style={{ fontSize: 40, lineHeight: 0.88 }}>
                {summary.upwardCount}
              </div>
              <div className="small muted">exercises trending upward this mesocycle</div>
              <div className="tiny muted">
                {summary.strongest
                  ? `${summary.strongest.exercise} is up ${formatKg(summary.strongest.delta)} ${unitLabel}`
                  : "Complete sessions to unlock strength trend highlights."}
              </div>
            </div>
          </div>

          <div className="grid-3">
            <div className="card stack analytics-card">
              <div className="eyebrow">This Week</div>
              <div className="display" style={{ fontSize: 42, lineHeight: 0.88 }}>
                {doneDayTypes.length}/{daySlots.length}
              </div>
              <div className="goal-track">
                <div className="goal-fill" style={{ width: `${summary.completionPct}%` }} />
              </div>
              <div className="tiny muted">{summary.daysLeft} sessions left this week</div>
            </div>
            <div className="card stack analytics-card">
              <div className="eyebrow">Meso Progress</div>
              <div className="display" style={{ fontSize: 42, lineHeight: 0.88 }}>
                {Math.round(summary.mesoPct)}%
              </div>
              <div className="goal-track">
                <div className="goal-fill" style={{ width: `${summary.mesoPct}%` }} />
              </div>
              <div className="tiny muted">goal completion across the current block</div>
            </div>
            <div className="card stack analytics-card">
              <div className="eyebrow">Archive</div>
              <div className="display" style={{ fontSize: 42, lineHeight: 0.88 }}>
                {archivedMesos.length}
              </div>
              <div className="tiny muted">previous mesocycles saved to your account</div>
              <button className="btn-ghost" onClick={onOpenArchive}>
                View Previous
              </button>
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

          <div className="card stack">
            <div className="title-row">
              <div>
                <div className="display" style={{ fontSize: 38 }}>
                  Strength Trends
                </div>
                <div className="mono tiny muted">first logged weight vs latest logged weight</div>
              </div>
              <button className="btn-ghost" onClick={onManageExercises}>
                Manage Exercises
              </button>
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

          <div className="card stack">
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
        </>
      )}
    </div>
  );
}

function AccountSheet({
  hasMeso,
  initialConfig,
  cloudUser,
  cloudStatus,
  cloudBusy,
  archivedCount,
  onClose,
  onSaveCloudConfig,
  onSignUp,
  onSignIn,
  onSignOut,
  onRefresh,
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
          cloudStatus={cloudStatus}
          cloudBusy={cloudBusy}
          onSaveCloudConfig={onSaveCloudConfig}
          onSignUp={onSignUp}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onRefresh={onRefresh}
          onOpenArchive={onOpenArchive}
          archivedCount={archivedCount}
        />
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
}) {
  return (
    <div className="centered stack" style={{ gap: 18 }}>
      <div className="card hero-card stack">
        <div className="eyebrow">Cloud-First Training</div>
        <div className="display" style={{ fontSize: 104, lineHeight: 0.82 }}>
          Hyper
          <br />
          <span className="accent">Phases</span>
        </div>
        <div className="hero-subtitle">
          Sign in to plan, log, and archive every mesocycle in one place. Your training state stays tied to your account across devices.
        </div>
      </div>
      <CloudSyncCard
        hasMeso={false}
        initialConfig={initialConfig}
        cloudUser={cloudUser}
        cloudStatus={cloudStatus}
        cloudBusy={cloudBusy}
        onSaveCloudConfig={onSaveCloudConfig}
        onSignUp={onSignUp}
        onSignIn={onSignIn}
        onSignOut={() => {}}
        onRefresh={() => {}}
        onOpenArchive={() => {}}
        archivedCount={0}
      />
    </div>
  );
}

function CloudSyncCard({
  hasMeso,
  initialConfig,
  cloudUser,
  cloudStatus,
  cloudBusy,
  onSaveCloudConfig,
  onSignUp,
  onSignIn,
  onSignOut,
  onRefresh,
  onOpenArchive,
  archivedCount,
}) {
  const hasHostedConfig = Boolean(initialConfig?.url && initialConfig?.anonKey);
  const [url, setUrl] = useState(initialConfig?.url || "");
  const [anonKey, setAnonKey] = useState(initialConfig?.anonKey || "");
  const [email, setEmail] = useState(cloudUser?.email || "");
  const [password, setPassword] = useState("");
  const accountTitle = cloudUser ? "Your training is connected" : "Sign in to start tracking";
  const accountSummary = cloudUser
    ? "Your active mesocycle and archive live in your account, so your state stays consistent across devices."
    : "Sign in before planning or logging so HyperPhases always opens to the right account state.";
  const statusTone = /failed/i.test(cloudStatus) ? "accent" : cloudUser ? "gold" : "muted";

  useEffect(() => {
    setUrl(initialConfig?.url || "");
    setAnonKey(initialConfig?.anonKey || "");
  }, [initialConfig]);

  useEffect(() => {
    if (cloudUser?.email) {
      setEmail(cloudUser.email);
    }
  }, [cloudUser]);

  return (
    <div className="card stack">
      <div className="eyebrow">Account</div>
      <div className="display" style={{ fontSize: 38, lineHeight: 0.92 }}>
        {accountTitle}
      </div>
      <div className="small">{accountSummary}</div>
      <div className={`mono tiny ${statusTone}`}>{cloudStatus}</div>
      {!hasHostedConfig && (
        <>
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Supabase project URL"
          />
          <input
            type="text"
            value={anonKey}
            onChange={(event) => setAnonKey(event.target.value)}
            placeholder="Supabase anon key"
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
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
          />
          <div className="grid-2">
            <button
              className="btn-ghost"
              disabled={cloudBusy || !email.trim() || !password}
              onClick={() => onSignUp(email.trim(), password)}
            >
              Create Account
            </button>
            <button
              className="btn-sm"
              disabled={cloudBusy || !email.trim() || !password}
              onClick={() => onSignIn(email.trim(), password)}
            >
              {cloudBusy ? "Working..." : "Sign In"}
            </button>
          </div>
        </>
      )}
      {cloudUser && (
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
      )}
      <div className="tiny muted">
        {cloudUser
          ? `${archivedCount || 0} archived mesocycles saved. Workout data is stored in Supabase, not in browser local storage.`
          : "Once signed in, HyperPhases keeps workout data in Supabase so your training state follows your account."}
      </div>
    </div>
  );
}

function SessionScreen({
  meso,
  sessionState,
  setSessionState,
  onBack,
  onSave,
  onSwap,
  onEditIncrement,
  onOpenHistory,
}) {
  const muscles = Object.keys(sessionState.log || {});
  const allDone = muscles.every((muscle) => isMuscleDone(sessionState, muscle));
  const allRated = muscles.every((muscle) => isMuscleRated(sessionState, muscle));
  const unitLabel = getUnitLabel(meso?.unit);
  const unitStep = getUnitStep(meso?.unit);
  const targetRIR = targetRIRForWeek(meso.week);

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

      <div className="card stack analytics-card" style={{ gap: 8 }}>
        <div className="eyebrow">Why RIR Is Effective</div>
        <div className="small">
          Target RIR keeps load progression anchored to repeatable effort. It helps you push the block forward while controlling fatigue session to session.
        </div>
        <div className="mono tiny" style={{ color: "var(--ok)" }}>
          New sets default to {targetRIR} RIR for week {meso.week}.
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
            {(sessionState.log[muscle] || []).map((block, exIdx) => (
              <div key={`${muscle}-${block.exercise}-${exIdx}`} className="exercise-block stack">
                <div className="exercise-header">
                  <div className="display" style={{ fontSize: 28 }}>
                    {block.exercise}
                  </div>
                  <div className="exercise-actions">
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
                <div className="session-grid header">
                  <div>#</div>
                  <div>{unitLabel.toUpperCase()}</div>
                  <div>REPS</div>
                  <div>RIR</div>
                  <div>✓</div>
                </div>
                {block.sets.map((set, setIdx) => (
                  <div key={set.id} className="session-grid">
                    <div className="mono tiny gold">{setIdx + 1}</div>
                    <input
                      type="number"
                      step={unitStep}
                      value={set.weight}
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
                <button className="btn-ghost" onClick={() => addSet(muscle, exIdx)}>
                  + add set
                </button>
              </div>
            ))}

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

function ManageExercisesSheet({ meso, onClose, onRemove }) {
  const activeMuscles = getActiveMusclesFromSlots(getMesoDaySlots(meso));
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
          Remove movements from future planning while preserving the history you already logged.
        </div>
        {activeMuscles.map((muscle) => (
          <div key={muscle} className="card stack">
            <div className="title-row">
              <div className="display" style={{ fontSize: 28 }}>{muscle}</div>
              <div className="mono tiny gold">{(meso.exercises[muscle] || []).length} active</div>
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

function ArchivedMesoDetailSheet({ meso, onClose }) {
  const summary = getMesoSummaryStats(meso);
  const unitLabel = getUnitLabel(meso?.unit);
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
  const first = history.length ? history[history.length - 1].sets[0] : null;
  const latest = history.length ? history[0].sets[history[0].sets.length - 1] : null;
  const delta = first && latest ? latest.weight - first.weight : null;
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
          ) : (
            <div className="small muted">No completed sets logged yet for this exercise.</div>
          )}
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
                    {formatKg(set.weight)} {unitLabel} · {set.reps} reps · RIR {set.rir === "" ? "-" : set.rir}
                  </div>
                </div>
              ))}
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
