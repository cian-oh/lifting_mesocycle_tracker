const { useState, useEffect, useCallback } = React;

const STORAGE_KEY = "hypertrack_cian_v1";
const DEFAULT_INCREMENT = 2.5;
const DAY_TYPES = ["Upper", "Lower", "Push", "Pull"];
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
const DAY_MUSCLES = {
  Upper: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
  Lower: ["Quads", "Hamstrings", "Glutes", "Calves"],
  Push: ["Chest", "Shoulders", "Triceps"],
  Pull: ["Back", "Biceps", "Rear Delts"],
};
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
  fresh: [0, 1, 2, 3],
  resume: [0, 1, 2, 3],
};

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

function getFallbackExercisePlan(equipment) {
  return Object.fromEntries(
    MUSCLES.map((muscle) => [muscle, getAvailableExercises(muscle, equipment).slice(0, 2)])
  );
}

async function suggestExercisesWithAnthropic(equipment) {
  const apiKey = window.HYPERTRACK_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("No Anthropic key configured in browser.");
  }
  const prompt = `You are an expert hypertrophy coach. A lifter has: ${equipment.join(
    ", "
  )}. For each muscle group, suggest exactly 2 exercises optimised for hypertrophy using ONLY available equipment. Muscles: Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Rear Delts. Return ONLY valid JSON, no markdown, no preamble: {"Chest":["ex1","ex2"],"Back":["ex1","ex2"],"Shoulders":["ex1","ex2"],"Biceps":["ex1","ex2"],"Triceps":["ex1","ex2"],"Quads":["ex1","ex2"],"Hamstrings":["ex1","ex2"],"Glutes":["ex1","ex2"],"Calves":["ex1","ex2"],"Rear Delts":["ex1","ex2"]}`;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic error ${response.status}`);
  }
  const payload = await response.json();
  const text = payload?.content?.map((part) => part.text || "").join("") || "";
  const parsed = JSON.parse(text);
  return Object.fromEntries(
    MUSCLES.map((muscle) => [muscle, (parsed[muscle] || []).slice(0, 2)])
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

function createSyntheticSession(dayType, week) {
  return {
    dayType,
    week,
    date: new Date().toISOString(),
    synthetic: true,
    log: {},
    feedback: {},
  };
}

function buildSessionState(meso, dayType) {
  const muscles = DAY_MUSCLES[dayType];
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
    dayType,
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

function getWeekDoneDayTypes(meso, week) {
  return DAY_TYPES.filter((dayType) =>
    meso.sessions.some((session) => session.week === week && session.dayType === dayType)
  );
}

function advanceWeekIfNeeded(meso) {
  const doneThisWeek = getWeekDoneDayTypes(meso, meso.week);
  if (doneThisWeek.length === DAY_TYPES.length) {
    return { ...meso, week: Math.min(meso.week + 1, meso.totalWeeks + 1) };
  }
  return meso;
}

function applyVolumeProgression(meso, sessionState) {
  const nextVolume = { ...meso.weeklyVolume };
  DAY_MUSCLES[sessionState.dayType].forEach((muscle) => {
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

  const persistMeso = useCallback(async (nextMeso) => {
    setMeso(nextMeso);
    await storage.set(nextMeso);
  }, []);

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
      const done = getWeekDoneDayTypes(meso, meso.week);
      if (done.includes(dayType)) return;
      setSessionState(buildSessionState(meso, dayType));
      setScreen("session");
    },
    [meso]
  );

  const saveSession = useCallback(async () => {
    if (!meso || !sessionState) return;
    const sessionRecord = {
      dayType: sessionState.dayType,
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
        <WelcomeScreen onStart={() => setScreen("setup")} />
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

function WelcomeScreen({ onStart }) {
  return (
    <div className="centered stack">
      <div>
        <div className="eyebrow">// Hypertrophy Tracking</div>
        <div className="display" style={{ fontSize: 96, lineHeight: 0.88 }}>
          Hyper
          <br />
          <span className="accent">Track</span>
        </div>
        <div className="small" style={{ maxWidth: 360 }}>
          RP-style mesocycle programming. No subscription. Built by Cian.
        </div>
      </div>
      <div className="feature-pills">
        {["RIR Progression", "Volume Ramping", "Pump/Soreness", "AI Exercise Pick"].map((item) => (
          <div key={item} className="feature-pill">
            {item}
          </div>
        ))}
      </div>
      <div className="divider" />
      <div className="notice">
        <div className="label tiny accent" style={{ marginBottom: 8 }}>
          split notice
        </div>
        <div className="small">
          Currently supported: Upper / Lower / Push / Pull split only. Other splits are not supported at this time.
        </div>
      </div>
      <button className="btn-primary" onClick={onStart}>
        Start Mesocycle
      </button>
    </div>
  );
}

function SetupScreen({ onComplete, onCancel }) {
  const [mode, setMode] = useState("choose");
  const [step, setStep] = useState(0);
  const [equipment, setEquipment] = useState(DEFAULT_EQUIPMENT);
  const [weeks, setWeeks] = useState(6);
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState(() => getFallbackExercisePlan(DEFAULT_EQUIPMENT));
  const [incrementsSetup, setIncrementsSetup] = useState(() =>
    Object.fromEntries(Object.values(getFallbackExercisePlan(DEFAULT_EQUIPMENT)).flat().map((exercise) => [exercise, DEFAULT_INCREMENT]))
  );
  const [weeklyVol, setWeeklyVol] = useState(
    Object.fromEntries(MUSCLES.map((muscle) => [muscle, MEV_MRV[muscle][0]]))
  );
  const [resumeWeek, setResumeWeek] = useState(1);
  const [prevWeights, setPrevWeights] = useState({});
  const [weightStep, setWeightStep] = useState(0);
  const [doneWeeks, setDoneWeeks] = useState([]);

  const visualStep = mode === "fresh" ? clamp(step, 0, 3) : step === 0 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3;

  useEffect(() => {
    setResumeWeek((prev) => clamp(prev, 1, weeks));
  }, [weeks]);

  const triggerExerciseSelection = async () => {
    setLoading(true);
    setStep(1);
    try {
      const suggested = await suggestExercisesWithAnthropic(equipment);
      const { normalizedExercises, normalizedIncrements } = normalizeExercisesAndIncrements(
        suggested,
        incrementsSetup
      );
      setExercises(normalizedExercises);
      setIncrementsSetup(normalizedIncrements);
    } catch (error) {
      const fallback = getFallbackExercisePlan(equipment);
      const { normalizedExercises, normalizedIncrements } = normalizeExercisesAndIncrements(
        fallback,
        incrementsSetup
      );
      setExercises(normalizedExercises);
      setIncrementsSetup(normalizedIncrements);
      console.warn("Exercise suggestion fallback in use.", error);
    } finally {
      setLoading(false);
      setStep(2);
    }
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
    const meso = {
      id: Date.now(),
      week: 1,
      totalWeeks: weeks,
      started: new Date().toISOString(),
      sessions: [],
      equipment,
      exercises: normalizedExercises,
      weeklyVolume: weeklyVol,
      increments: normalizedIncrements,
    };
    await onComplete(meso, "Mesocycle started");
  };

  const createResumeMeso = async () => {
    const { normalizedExercises, normalizedIncrements } = normalizeExercisesAndIncrements(
      exercises,
      incrementsSetup
    );
    const seed = buildSeedSession(normalizedExercises, prevWeights, normalizedIncrements);
    const meso = {
      id: Date.now(),
      week: resumeWeek,
      totalWeeks: weeks,
      started: new Date().toISOString(),
      sessions: [seed, ...doneWeeks.map((dayType) => createSyntheticSession(dayType, resumeWeek))],
      equipment,
      exercises: normalizedExercises,
      weeklyVolume: calcVolumeForWeek(resumeWeek, weeks),
      increments: normalizedIncrements,
      resumed: true,
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
            {mode === "fresh" ? "Equipment" : "Resume Setup"}
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
      <button className="btn-primary" onClick={triggerExerciseSelection}>
        AI Select Exercises
      </button>
    </div>
  );

  const renderLoading = () => (
    <div className="card stack">
      <div className="eyebrow">// AI loading</div>
      <div className="display" style={{ fontSize: 50 }}>
        Selecting
      </div>
      <div className="small">AI selecting exercises...</div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: loading ? "72%" : "100%" }} />
      </div>
      <div className="tiny muted">
        Falls back automatically to the built-in hypertrophy exercise library if the AI call is unavailable.
      </div>
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
            ? "Select up to 3 exercises per muscle group."
            : "Match what you’ve been doing. Select up to 3 exercises per muscle group."}
        </div>
      </div>
      {MUSCLES.map((muscle) => {
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
      {MUSCLES.map((muscle) => {
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

  const currentResumeMuscle = MUSCLES[weightStep];

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
          {weightStep + 1} / {MUSCLES.length}
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
          onClick={() => setWeightStep((prev) => clamp(prev - 1, 0, MUSCLES.length - 1))}
          disabled={weightStep === 0}
        >
          Previous
        </button>
        {weightStep < MUSCLES.length - 1 ? (
          <button
            className="btn-sm"
            onClick={() => setWeightStep((prev) => clamp(prev + 1, 0, MUSCLES.length - 1))}
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
          {DAY_TYPES.map((dayType) => (
            <button
              key={dayType}
              className={`chip ${doneWeeks.includes(dayType) ? "active" : ""}`}
              onClick={() =>
                setDoneWeeks((current) =>
                  current.includes(dayType)
                    ? current.filter((item) => item !== dayType)
                    : [...current, dayType]
                )
              }
            >
              {dayType}
            </button>
          ))}
        </div>
      </div>
      <div className="card stack">
        <div className="label tiny gold">summary</div>
        <div className="mono small">Week {resumeWeek} of {weeks}</div>
        <div className="mono small">Target RIR {targetRIRForWeek(resumeWeek)}</div>
        <div className="mono small">Days marked done: {doneWeeks.length || 0}</div>
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
      {mode !== "choose" && step === 1 && renderLoading()}
      {mode !== "choose" && step === 2 && renderExerciseReview()}
      {mode === "fresh" && step === 3 && renderVolumeStep()}
      {mode === "resume" && step === 3 && renderResumeWeights()}
      {mode === "resume" && step === 4 && renderResumeDays()}
    </div>
  );
}

function HomeScreen({ meso, onNewMeso, onStartSession }) {
  const doneDayTypes = getWeekDoneDayTypes(meso, meso.week);
  const progress = meso.totalWeeks > 0 ? clamp(((meso.week - 1) / meso.totalWeeks) * 100, 0, 100) : 0;
  const complete = meso.week > meso.totalWeeks;
  return (
    <div className="stack">
      <div className="sticky">
        <div className="card header-card">
          <div className="space-between">
            <div>
              <div className="display" style={{ fontSize: 42, lineHeight: 0.9 }}>
                Hyper<span className="accent">Track</span>
              </div>
              <div className="mono tiny gold">by Cian</div>
            </div>
            <button className="btn-ghost" onClick={onNewMeso}>
              New Meso
            </button>
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
            <div className="space-between" style={{ alignItems: "flex-end" }}>
              <div>
                <div className="eyebrow">// current mesocycle</div>
                <div className="display" style={{ fontSize: 96, lineHeight: 0.8 }}>
                  {meso.week}
                </div>
                <div className="small muted">of {meso.totalWeeks} weeks</div>
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
            {DAY_TYPES.map((dayType) => {
              const muscles = DAY_MUSCLES[dayType];
              const done = doneDayTypes.includes(dayType);
              return (
                <div
                  key={dayType}
                  className={`card day-tile ${done ? "done" : ""}`}
                  onClick={() => !done && onStartSession(dayType)}
                >
                  <div className="space-between" style={{ alignItems: "flex-start" }}>
                    <div className="display" style={{ fontSize: 34 }}>
                      {dayType}
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
            {MUSCLES.map((muscle) => {
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

function SessionScreen({
  meso,
  sessionState,
  setSessionState,
  onBack,
  onSave,
  onSwap,
  onEditIncrement,
}) {
  const muscles = DAY_MUSCLES[sessionState.dayType];
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
                {sessionState.dayType}
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
