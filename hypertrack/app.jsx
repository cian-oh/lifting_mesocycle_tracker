const { useState, useEffect, useCallback } = React;

const STORAGE_KEY = "hypertrack_cian_v1";
const SUPABASE_CONFIG_KEY = "hypertrack_cian_supabase_v1";
const SUPABASE_TABLE = "hypertrack_mesos";
const DEFAULT_INCREMENT = 2.5;
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
    "Barbell & rack": ["Bench Press", "Incline Bench Press", "Paused Bench Press"],
    Dumbbells: ["DB Flat Press", "DB Incline Press", "DB Fly"],
    "Cable machine": ["Cable Fly", "High-to-Low Crossover", "Single-Arm Press"],
    Machines: ["Chest Press", "Pec Deck", "Incline Press Machine"],
    "Smith machine": ["Smith Incline Press", "Smith Flat Press"],
    "Bodyweight only": ["Push-Up", "Deficit Push-Up", "Feet-Elevated Push-Up"],
  },
  Back: {
    "Barbell & rack": ["Barbell Row", "Pendlay Row", "Rack Pull"],
    Dumbbells: ["DB Row", "Chest-Supported DB Row", "Meadows Row"],
    "Cable machine": ["Lat Pulldown", "Seated Cable Row", "Straight-Arm Pulldown"],
    Machines: ["Machine Row", "Hammer Row", "High Row Machine"],
    "Smith machine": ["Smith Row"],
    "Bodyweight only": ["Inverted Row", "Towel Row"],
  },
  Shoulders: {
    "Barbell & rack": ["Barbell OHP", "Push Press"],
    Dumbbells: ["DB Lateral Raise", "Arnold Press", "Seated DB Press"],
    "Cable machine": ["Cable Lateral Raise", "Face Pull", "Cable Y-Raise"],
    Machines: ["Shoulder Press Machine", "Lateral Raise Machine"],
    "Smith machine": ["Smith High Incline Press"],
    "Bodyweight only": ["Pike Push-Up", "Handstand Push-Up Progression"],
  },
  Biceps: {
    "Barbell & rack": ["Barbell Curl", "EZ-Bar Curl"],
    Dumbbells: ["Alternating DB Curl", "Hammer Curl", "Incline DB Curl"],
    "Cable machine": ["Cable Curl", "Bayesian Curl", "Rope Hammer Curl"],
    Machines: ["Preacher Curl Machine", "Biceps Curl Machine"],
    "Smith machine": ["Smith Drag Curl"],
    "Bodyweight only": ["Towel Curl Iso", "Chin-Up Negative"],
  },
  Triceps: {
    "Barbell & rack": ["Close-Grip Bench Press", "Skull Crusher"],
    Dumbbells: ["DB Skull Crusher", "Overhead DB Extension", "Tate Press"],
    "Cable machine": ["Rope Pushdown", "Overhead Cable Extension", "Straight-Bar Pushdown"],
    Machines: ["Dip Machine", "Triceps Extension Machine"],
    "Smith machine": ["Smith Close-Grip Bench"],
    "Bodyweight only": ["Bench Dip", "Diamond Push-Up"],
  },
  Quads: {
    "Barbell & rack": ["Back Squat", "Front Squat", "High-Bar Squat"],
    Dumbbells: ["Goblet Squat", "Bulgarian Split Squat", "DB Reverse Lunge"],
    "Cable machine": ["Cable Squat", "Cable Split Squat"],
    Machines: ["Leg Press", "Leg Extension", "Hack Squat"],
    "Smith machine": ["Smith Squat", "Smith Split Squat"],
    "Bodyweight only": ["Walking Lunge", "Sissy Squat", "Tempo Squat"],
  },
  Hamstrings: {
    "Barbell & rack": ["Romanian Deadlift", "Good Morning", "Stiff-Leg Deadlift"],
    Dumbbells: ["DB Romanian Deadlift", "Single-Leg RDL"],
    "Cable machine": ["Cable Leg Curl", "Cable Pull-Through"],
    Machines: ["Lying Leg Curl", "Seated Leg Curl", "Nordic Curl Machine"],
    "Smith machine": ["Smith Romanian Deadlift"],
    "Bodyweight only": ["Nordic Curl", "Sliding Leg Curl"],
  },
  Glutes: {
    "Barbell & rack": ["Barbell Hip Thrust", "Barbell Lunge"],
    Dumbbells: ["DB Hip Thrust", "DB Step-Up", "DB Walking Lunge"],
    "Cable machine": ["Cable Kickback", "Cable Pull-Through", "Cable Abduction"],
    Machines: ["Hip Thrust Machine", "Glute Drive", "Abduction Machine"],
    "Smith machine": ["Smith Hip Thrust", "Smith Reverse Lunge"],
    "Bodyweight only": ["Single-Leg Glute Bridge", "Frog Pump", "Step-Up"],
  },
  Calves: {
    "Barbell & rack": ["Standing Calf Raise", "Donkey Calf Raise"],
    Dumbbells: ["Single-Leg DB Calf Raise", "Seated DB Calf Raise"],
    "Cable machine": ["Cable Calf Raise"],
    Machines: ["Standing Calf Machine", "Seated Calf Machine", "Leg Press Calf Raise"],
    "Smith machine": ["Smith Standing Calf Raise"],
    "Bodyweight only": ["Single-Leg Calf Raise", "Tempo Calf Raise"],
  },
  "Rear Delts": {
    "Barbell & rack": ["Rear Delt Row", "Wide-Grip Row"],
    Dumbbells: ["Reverse Fly", "Chest-Supported Rear Delt Raise"],
    "Cable machine": ["Face Pull", "Cable Rear Delt Fly", "Cable Y-Raise"],
    Machines: ["Reverse Pec Deck", "Rear Delt Machine"],
    "Smith machine": ["Smith High Row"],
    "Bodyweight only": ["Prone Y-Raise", "Wall Rear Delt Raise"],
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
  equipment.forEach((item) => {
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

async function fetchRemoteMeso(client, userId) {
  const { data, error } = await client
    .from(SUPABASE_TABLE)
    .select("meso_json, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function pushRemoteMeso(client, userId, meso) {
  const payload = withUpdatedAt(meso);
  const { error } = await client.from(SUPABASE_TABLE).upsert(
    {
      user_id: userId,
      meso_json: payload,
      updated_at: payload.updatedAt,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
  return payload;
}

function pickNewestMeso(localMeso, remoteRow) {
  const remoteMeso = remoteRow?.meso_json || null;
  if (!localMeso) return remoteMeso;
  if (!remoteMeso) return localMeso;
  const localTime = new Date(localMeso.updatedAt || localMeso.started || 0).getTime();
  const remoteTime = new Date(
    remoteMeso.updatedAt || remoteRow.updated_at || remoteMeso.started || 0
  ).getTime();
  return remoteTime > localTime ? remoteMeso : localMeso;
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
  muscles.forEach((muscle) => {
    const selected = meso.exercises[muscle] || [];
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
          rir: "",
          done: false,
        })),
      };
    });
  });
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

function App() {
  const [screen, setScreen] = useState("loading");
  const [meso, setMeso] = useState(null);
  const [toast, setToast] = useState(null);
  const [sessionState, setSessionState] = useState(null);
  const [swapTarget, setSwapTarget] = useState(null);
  const [incrementTarget, setIncrementTarget] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cloudConfig, setCloudConfig] = useState(() => loadSupabaseConfig());
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [cloudUser, setCloudUser] = useState(null);
  const [cloudStatus, setCloudStatus] = useState("Sign in to sync across devices.");
  const [cloudBusy, setCloudBusy] = useState(false);

  useEffect(() => {
    storage.get().then((saved) => {
      if (saved) {
        setMeso(saved);
        setScreen("home");
      } else {
        setScreen("welcome");
      }
    });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (meso && (screen === "welcome" || screen === "loading")) {
      setScreen("home");
    }
  }, [meso, screen]);

  useEffect(() => {
    const client = createSupabaseClient(cloudConfig);
    setSupabaseClient(client);
    if (!client) {
      setCloudUser(null);
      setCloudStatus(
        cloudConfig.url || cloudConfig.anonKey
          ? "Connection details are incomplete."
          : "Sign in to sync across devices."
      );
      return undefined;
    }
    let active = true;
    client.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error(error);
        setCloudStatus("Account services are unavailable right now.");
        return;
      }
      setCloudUser(data.user || null);
      setCloudStatus(
        data.user ? `Signed in as ${data.user.email}` : "Sign in to sync across devices."
      );
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setCloudUser(session?.user || null);
      setCloudStatus(
        session?.user
          ? `Signed in as ${session.user.email}`
          : "Sign in to sync across devices."
      );
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [cloudConfig]);

  const persistMeso = useCallback(
    async (nextMeso, options = {}) => {
      let payload = withUpdatedAt(nextMeso);
      setMeso(payload);
      await storage.set(payload);
      if (options.skipRemote) {
        return payload;
      }
      if (supabaseClient && cloudUser) {
        try {
          setCloudBusy(true);
          payload = await pushRemoteMeso(supabaseClient, cloudUser.id, {
            ...payload,
            ownerUserId: cloudUser.id,
          });
          setMeso(payload);
          await storage.set(payload);
          setCloudStatus(`Last synced ${new Date(payload.updatedAt).toLocaleString()}`);
        } catch (error) {
          console.error(error);
          setCloudStatus("Sync failed. Your local save is still safe.");
        } finally {
          setCloudBusy(false);
        }
      }
      return payload;
    },
    [cloudUser, supabaseClient]
  );

  const syncFromCloud = useCallback(async () => {
    if (!supabaseClient || !cloudUser) return;
    try {
      setCloudBusy(true);
      const remoteRow = await fetchRemoteMeso(supabaseClient, cloudUser.id);
      const localMeso = await storage.get();
      const compatibleLocal =
        localMeso && localMeso.ownerUserId && localMeso.ownerUserId !== cloudUser.id
          ? null
          : localMeso;
      const chosen = pickNewestMeso(compatibleLocal, remoteRow);
      if (chosen) {
        const owned = { ...chosen, ownerUserId: cloudUser.id };
        setMeso(owned);
        await storage.set(owned);
        if (!remoteRow || chosen === compatibleLocal) {
          await pushRemoteMeso(supabaseClient, cloudUser.id, owned);
        }
      } else {
        setMeso(null);
        setScreen("welcome");
      }
      setCloudStatus(
        remoteRow ? "Cloud progress refreshed." : "No synced mesocycle found for this account yet."
      );
    } catch (error) {
      console.error(error);
      setCloudStatus("Sync failed.");
    } finally {
      setCloudBusy(false);
    }
  }, [cloudUser, supabaseClient]);

  useEffect(() => {
    if (!supabaseClient || !cloudUser) return;
    syncFromCloud();
  }, [cloudUser, supabaseClient, syncFromCloud]);

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
      setCloudUser(null);
      setCloudStatus("Signed out. Local progress is still available on this device.");
    } catch (error) {
      console.error(error);
      setCloudStatus("Sign-out failed");
    } finally {
      setCloudBusy(false);
    }
  }, [supabaseClient]);

  const handlePushCloud = useCallback(async () => {
    if (!meso) return;
    await persistMeso(meso);
  }, [meso, persistMeso]);

  const handleNewMeso = useCallback(async () => {
    const confirmed = window.confirm("Start a new mesocycle and clear the current one?");
    if (!confirmed) return;
    setSessionState(null);
    setMeso(null);
    await storage.clear();
    setScreen("setup");
  }, []);

  const startSession = useCallback(
    (dayType) => {
      if (!meso) return;
      const done = getWeekDoneDaySlotIds(meso, meso.week);
      if (done.includes(dayType)) return;
      const nextState = buildSessionState(meso, dayType);
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

  return (
    <div className="app-shell">
      {screen === "loading" && <LoadingScreen />}
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
            await persistMeso(nextMeso);
            setToast(message);
            setScreen("home");
          }}
          onCancel={() => setScreen(meso ? "home" : "welcome")}
        />
      )}
      {screen === "home" && meso && (
        <HomeScreen
          meso={meso}
          onNewMeso={handleNewMeso}
          onStartSession={startSession}
          onGoHome={() => setScreen("home")}
          onOpenAccount={() => setAccountOpen(true)}
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
      {accountOpen && (
        <AccountSheet
          hasMeso={Boolean(meso)}
          initialConfig={cloudConfig}
          cloudUser={cloudUser}
          cloudStatus={cloudStatus}
          cloudBusy={cloudBusy}
          onClose={() => setAccountOpen(false)}
          onSaveCloudConfig={handleSaveCloudConfig}
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onPullCloud={syncFromCloud}
          onPushCloud={handlePushCloud}
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
          Hyper<span className="accent">Track</span>
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
          <span className="accent">Track</span>
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
  const normalizedSplitDays = normalizeDaySlots(splitDays);
  const activeMuscles = getActiveMusclesFromSlots(normalizedSplitDays);

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
    setExercises((current) => {
      const selected = current[muscle] || [];
      const active = selected.includes(exercise);
      let next = selected;
      if (active) {
        next = selected.filter((item) => item !== exercise);
      } else if (selected.length < 3) {
        next = [...selected, exercise];
      }
      return { ...current, [muscle]: next };
    });
    setIncrementsSetup((current) => ({
      ...current,
      [exercise]: current[exercise] || DEFAULT_INCREMENT,
    }));
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
        const selected = exercises[muscle] || [];
        return (
          <div key={muscle} className="card stack">
            <div className="title-row">
              <div className="display" style={{ fontSize: 30 }}>
                {muscle}
              </div>
              <div className="mono tiny gold">{selected.length} / 3</div>
            </div>
            <div className="stack">
              {options.map((exercise) => {
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
                          <div className="mono tiny">{formatKg(incrementsSetup[exercise] || DEFAULT_INCREMENT)} kg</div>
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
                          step="0.5"
                          value={incrementsSetup[exercise] || ""}
                          onChange={(event) =>
                            setIncrementsSetup((current) => ({
                              ...current,
                              [exercise]: event.target.value === "" ? "" : Number(event.target.value),
                            }))
                          }
                          placeholder="Custom kg increment"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
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
                step="0.5"
                placeholder="KG"
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
  onNewMeso,
  onStartSession,
  onGoHome,
  onOpenAccount,
}) {
  const daySlots = getMesoDaySlots(meso);
  const activeMuscles = getActiveMusclesFromSlots(daySlots);
  const doneDayTypes = getWeekDoneDaySlotIds(meso, meso.week);
  const progress = meso.totalWeeks > 0 ? clamp(((meso.week - 1) / meso.totalWeeks) * 100, 0, 100) : 0;
  const complete = meso.week > meso.totalWeeks;
  return (
    <div className="stack">
      <div className="sticky">
        <div className="card header-card">
          <div className="space-between">
            <div>
              <button className="brand-button" onClick={onGoHome} aria-label="Return to home">
                <div className="display" style={{ fontSize: 42, lineHeight: 0.9 }}>
                  Hyper<span className="accent">Track</span>
                </div>
              </button>
              <div className="mono tiny gold">
                RIR-led progression and adaptive volume for hypertrophy mesocycles
              </div>
            </div>
            <div className="row">
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
            {daySlots.map((daySlot) => {
              const muscles = daySlot.muscles;
              const done = doneDayTypes.includes(daySlot.id);
              return (
                <div
                  key={daySlot.id}
                  className={`card day-tile ${done ? "done" : ""}`}
                  onClick={() => !done && onStartSession(daySlot.id)}
                >
                  <div className="space-between" style={{ alignItems: "flex-start" }}>
                    <div className="display" style={{ fontSize: 34 }}>
                      {daySlot.label}
                    </div>
                    {done && <div className="badge">✓</div>}
                  </div>
                  <div className="mono tiny muted" style={{ marginTop: 8 }}>
                    {muscles.join(" · ")}
                  </div>
                </div>
              );
            })}
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
  onClose,
  onSaveCloudConfig,
  onSignUp,
  onSignIn,
  onSignOut,
  onPullCloud,
  onPushCloud,
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
          onPullCloud={onPullCloud}
          onPushCloud={onPushCloud}
        />
      </div>
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
  onPullCloud,
  onPushCloud,
}) {
  const hasHostedConfig = Boolean(initialConfig?.url && initialConfig?.anonKey);
  const [url, setUrl] = useState(initialConfig?.url || "");
  const [anonKey, setAnonKey] = useState(initialConfig?.anonKey || "");
  const [email, setEmail] = useState(cloudUser?.email || "");
  const [password, setPassword] = useState("");
  const accountTitle = cloudUser ? "Your progress is connected" : "Sign in to keep progress in sync";
  const accountSummary = cloudUser
    ? "Your mesocycle can sync across devices while still saving locally on this browser."
    : "Sign in to back up your mesocycle and keep progress consistent across devices.";
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
      <div className="eyebrow">Sync</div>
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
          <button className="btn-ghost" onClick={onPullCloud}>
            Refresh Sync
          </button>
          <button className="btn-ghost" onClick={onPushCloud} disabled={!hasMeso}>
            Save to Cloud
          </button>
          <button className="btn-ghost" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      )}
      <div className="tiny muted">
        Local storage always stays active. Cloud sync is an additional backup and continuity layer.
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
}) {
  const muscles = Object.keys(sessionState.log || {});
  const allDone = muscles.every((muscle) => isMuscleDone(sessionState, muscle));
  const allRated = muscles.every((muscle) => isMuscleRated(sessionState, muscle));

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
                    rir: "",
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
                      ±{formatKg(block.increment)}kg
                    </button>
                    <button className="btn-ghost" onClick={() => onSwap(muscle, exIdx)}>
                      swap
                    </button>
                  </div>
                </div>
                <div className="session-grid header">
                  <div>#</div>
                  <div>KG</div>
                  <div>REPS</div>
                  <div>RIR</div>
                  <div>✓</div>
                </div>
                {block.sets.map((set, setIdx) => (
                  <div key={set.id} className="session-grid">
                    <div className="mono tiny gold">{setIdx + 1}</div>
                    <input
                      type="number"
                      step="0.5"
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
  const options = getAvailableExercises(muscle, meso.equipment);
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

function IncrementModal({ current, exerciseName, onClose, onSave }) {
  const [value, setValue] = useState(current || DEFAULT_INCREMENT);
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
          step="0.5"
          value={value}
          onChange={(event) => setValue(event.target.value === "" ? "" : Number(event.target.value))}
          placeholder="Custom kg increment"
        />
        <button className="btn-primary" onClick={() => valid && onSave(Number(value))} disabled={!valid}>
          Save Increment
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
