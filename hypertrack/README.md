# HyperPhases

HyperPhases is a mobile-first hypertrophy tracker built around customizable mesocycle planning, RIR-based progression, and feedback-driven volume adjustment. The current design direction is brighter and cleaner, with a more polished product feel and support for multiple popular split templates.

The app is designed to reproduce the core practical loop of RP-style hypertrophy tracking without a subscription:

- target RIR changes across the mesocycle
- suggested load changes based on prior RIR performance
- weekly volume ramps based on pump, soreness, and performance feedback
- exercises stay stable through the mesocycle unless you deliberately swap or remove them

This repository is intentionally simple:

- static hosting friendly
- one `index.html`
- one `app.jsx`
- one committed `config.js`
- Supabase auth and cloud storage

Cloudflare deployment note:

- the app now reads public Supabase config directly from `config.js`
- users must sign in before they can plan or log training
- mesocycle data is stored in Supabase, not in browser local storage

## What the app does

HyperPhases supports:

- auth-first cloud usage
- fresh mesocycle setup
- resume-mid-meso setup with seed performance data
- exercise selection by muscle group with built-in recommendations
- custom exercise entry when a movement is missing from the suggested list
- bodyweight exercise options even when bodyweight is not the only equipment selected
- load unit selection in `kg` or `lb`
- per-exercise weight increment configuration
- later in-session increment edits when you finally know what the gym setup allows
- automatic RIR prefills based on the current mesocycle week
- set-by-set workout logging
- per-exercise history modal with prior weeks and logged weights
- inline muscle feedback collection
- post-creation exercise removal for future sessions
- automatic weekly volume adjustment
- automatic week advancement after all configured split days are logged
- archived mesocycle folder for previous blocks
- homepage progression analytics and goal bars
- preset split library with editable day names and muscle assignments before the mesocycle starts

## How the training logic works

### Target RIR by week

- Week 1: `3`
- Week 2: `2`
- Week 3: `2`
- Week 4: `1`
- Week 5: `1`
- Week 6+: `0`

When a session is created, new sets are prefilled with that week’s target RIR. The user can still edit any set manually.

### Weight progression

For each exercise, HyperPhases looks at the last completed set it can find for that movement.

- If actual RIR was above target, load increases.
- If actual RIR was below target, load decreases slightly.
- If actual RIR matched target, load stays the same.

Adjustment size:

- big muscles: `±2.5%`
- small muscles: `±1.5%`

Big muscles:

- Chest
- Back
- Quads
- Hamstrings
- Glutes

The final number is snapped to the exercise’s configured increment.

### Volume progression

Each muscle has an MEV and MRV range. After a session, the app adjusts weekly sets for the muscles trained that day:

- default: `+2`
- low pump: `+3`
- moderate soreness: stop upward ramp
- severe soreness: `-2`

Volume is always clamped inside the muscle’s MEV to MRV range.

### Resume flow

If you resume partway through a mesocycle, the app:

- asks for current week
- asks for your recent weight / reps / RIR per exercise
- builds a synthetic seed session
- calculates starting volume based on mesocycle position

That lets the first resumed workout still produce weight suggestions immediately.

## Cloud data model

The app expects a `hypertrack_mesos` table in Supabase with:

- `id uuid primary key`
- `user_id uuid not null`
- `status text not null`
- `name text`
- `started_at timestamptz`
- `completed_at timestamptz`
- `updated_at timestamptz not null`
- `meso_json jsonb not null`

Recommended behavior:

- exactly one `active` row per user
- any completed or replaced mesocycle becomes `archived`
- row-level security should restrict users to their own rows only

The app stores the full active or archived mesocycle state in `meso_json`, while the top-level columns support filtering and archive browsing.

## Project structure

- `index.html`
  - fonts
  - CSS
  - React runtime
  - Supabase browser client script
  - Babel standalone loader
- `app.jsx`
  - entire UI
  - mesocycle logic
  - Supabase-backed persistence
  - setup flows
  - session logging
  - archive/history views
  - auth-first account flow
- `config.js`
  - committed browser-readable Supabase public config
