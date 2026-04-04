# HyperPhases

HyperPhases is a mobile-first hypertrophy tracker built around customizable mesocycle planning, RIR-based progression, and feedback-driven volume adjustment. The current design direction is brighter and cleaner, with a more polished product feel and support for multiple popular split templates.

The app is designed to reproduce the core practical loop of RP-style hypertrophy tracking without a subscription:

- target RIR changes across the mesocycle
- suggested load changes based on prior RIR performance
- weekly volume ramps based on pump, soreness, and performance feedback
- exercises stay stable through the mesocycle unless you deliberately swap them

This repository is intentionally simple:

- static hosting friendly
- one `index.html`
- one `app.jsx`
- one committed `config.js`
- optional Supabase auth and sync

Cloudflare deployment note:

- the app now reads public Supabase config directly from `config.js`

## What the app does

HyperPhases supports:

- fresh mesocycle setup
- resume-mid-meso setup with seed performance data
- exercise selection by muscle group with built-in recommendations
- custom exercise entry when a movement is missing from the suggested list
- load unit selection in `kg` or `lb`
- per-exercise weight increment configuration
- later in-session increment edits when you finally know what the gym setup allows
- set-by-set workout logging
- inline muscle feedback collection
- automatic weekly volume adjustment
- automatic week advancement after all configured split days are logged
- optional cloud sync through Supabase auth
- preset split library with editable day names and muscle assignments before the mesocycle starts

## How the training logic works

### Target RIR by week

- Week 1: `3`
- Week 2: `2`
- Week 3: `2`
- Week 4: `1`
- Week 5: `1`
- Week 6+: `0`

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
  - persistence
  - setup flows
  - session logging
  - Supabase auth and sync
- `config.js`
  - committed browser-readable Supabase public config
