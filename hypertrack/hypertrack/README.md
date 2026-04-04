# HyperTrack

HyperTrack is a mobile-first hypertrophy tracker built for an Upper / Lower / Push / Pull split and styled around an industrial luxury aesthetic: deep black surfaces, crimson actions, gold data accents, dense mid-workout UI, and a single-screen-first flow.

The app is designed to reproduce the core practical loop of RP-style hypertrophy tracking without a subscription:

- target RIR changes across the mesocycle
- suggested load changes based on prior RIR performance
- weekly volume ramps based on pump, soreness, and performance feedback
- exercises stay stable through the mesocycle unless you deliberately swap them

This repository is intentionally simple:

- Worker-friendly static asset app
- one `index.html`
- one `app.jsx`
- one runtime-served `config.js`
- optional Supabase auth and sync

Cloudflare deployment note:

- the app now serves public Supabase config through a Cloudflare Worker route

## What the app does

HyperTrack supports:

- fresh mesocycle setup
- resume-mid-meso setup with seed performance data
- exercise selection by muscle group
- per-exercise weight increment configuration
- set-by-set workout logging
- inline muscle feedback collection
- automatic weekly volume adjustment
- automatic week advancement after all 4 split days are logged
- optional cloud sync through Supabase auth

Supported split only:

- Upper
- Lower
- Push
- Pull

Other splits are intentionally not supported in this version.

## How the training logic works

### Target RIR by week

- Week 1: `3`
- Week 2: `2`
- Week 3: `2`
- Week 4: `1`
- Week 5: `1`
- Week 6+: `0`

### Weight progression

For each exercise, HyperTrack looks at the last completed set it can find for that movement.

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
  - local fallback config for non-Worker environments
- `worker.js`
  - serves runtime config and forwards all other requests to static assets
- `wrangler.jsonc`
  - Worker and asset configuration
- `.dev.vars.example`
  - local Worker environment variable template

## Local persistence

The app always keeps a local copy of your mesocycle.

Primary app data key:

- `hypertrack_cian_v1`

Supabase config key:

- `hypertrack_cian_supabase_v1`

Storage behavior:

- uses `window.storage.get/set` if available
- otherwise falls back to browser `localStorage`

That means the app works in:

- a normal browser-only deployment
- an environment exposing a Claude-style storage API

## Supabase integration

This version now includes optional Supabase integration.

### What Supabase is used for

Supabase is used for:

- email/password authentication
- syncing the single `meso` JSON blob across devices

Supabase Storage buckets are not used. This app stores the training state in the Supabase database as JSON.

### Sync model

The app stays local-first:

- every save writes locally first
- if you are signed into Supabase, the same mesocycle is also pushed to the cloud
- when you sign in, the app compares local and remote timestamps and keeps the newer one

This gives you:

- offline usability
- cloud backup
- cross-device continuity

### Supabase table

Create a table named `hypertrack_mesos`.

Suggested SQL:

```sql
create table if not exists public.hypertrack_mesos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  meso_json jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);
```

### Row Level Security

Enable RLS and allow each user to access only their own row.

```sql
alter table public.hypertrack_mesos enable row level security;

create policy "Users can read their own meso"
on public.hypertrack_mesos
for select
using (auth.uid() = user_id);

create policy "Users can insert their own meso"
on public.hypertrack_mesos
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own meso"
on public.hypertrack_mesos
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### Supabase auth flow in the app

The app exposes an account panel in the UI.

The clean production flow is:

- Supabase URL and anon key are served from the Worker at runtime
- the user only enters email and password

Then:

1. Open the app.
2. Sign up or sign in.
3. The app restores the session and syncs your mesocycle row.

### Supabase dashboard setup

Before using Supabase auth, configure your project:

1. Enable Email auth in Supabase Auth.
2. If email confirmation is enabled, add your deployed Cloudflare URL to the allowed site / redirect settings.
3. Keep your project URL and anon key ready for Cloudflare Worker environment variables.

If you test locally and confirmation emails are enabled, also add your local URL such as:

- `http://localhost:8787`

### What the app syncs

It syncs one row per user containing the full `meso` object, including:

- current week
- total weeks
- exercise selection
- increments
- weekly volume
- session logs
- resume seed data

### Important note on secrets

The Supabase anon key is meant to be used in the browser. Do not place your Supabase service role key in this app.

## Running locally

Run the app through Wrangler so the Worker can provide runtime config.

1. Copy the env template:

```bash
cd /Users/cianoh/hypertrack
cp .dev.vars.example .dev.vars
```

2. Edit `.dev.vars` with your real values:

```txt
HYPERTRACK_SUPABASE_URL="https://your-project-ref.supabase.co"
HYPERTRACK_SUPABASE_ANON_KEY="your-anon-or-publishable-key"
```

3. Start local dev:

```bash
cd /Users/cianoh/hypertrack
npx wrangler dev
```

Then open:

```txt
http://localhost:8787
```

If you want a plain static fallback for visual-only testing, `config.js` will keep the app from crashing, but account sync is intended to be tested through Wrangler.

## Deploying to Cloudflare

Deploy this as a Worker with static assets, not as a static-only Pages site.

Runtime variables to add:

- `HYPERTRACK_SUPABASE_URL`
- `HYPERTRACK_SUPABASE_ANON_KEY`

These values are public client values. Do not use the Supabase service role key.

Deploy with Wrangler:

```bash
cd /Users/cianoh/hypertrack
npx wrangler deploy
```

With those set, the deployed app will stop asking users for Supabase keys and will only ask for email/password.

## Uploading to GitHub

If you do not want to sign into GitHub in the laptop browser, the easiest workflow is:

1. Create an empty repo from your phone or another machine.
2. Upload these files into the repo root:
   - `index.html`
   - `app.jsx`
   - `config.js`
   - `worker.js`
   - `wrangler.jsonc`
   - `README.md`
3. Deploy with Wrangler or connect the repo to a Worker-capable Cloudflare workflow.

## AI exercise suggestions

The app contains an Anthropic fetch path for exercise suggestion, but it also has a built-in fallback exercise library.

Practical recommendation:

- use the built-in fallback by default
- only enable Anthropic if you deliberately want browser-side exercise suggestion behavior and understand the API key exposure tradeoff

For a personal static deployment, the fallback path is the safer default.

## Product behavior summary

Welcome:

- brand intro
- split notice
- optional Supabase cloud setup

Setup:

- fresh flow
- resume flow
- exercise review
- increment configuration
- starting volume or resume data capture

Home:

- week banner
- target RIR
- cloud sync card
- day grid
- volume tracker

Session:

- suggested load per exercise
- per-set logging
- swap modal
- increment modal
- inline pump / soreness / performance rating
- save gate only after all trained muscles are completed and rated

## Current constraints

- split support is limited to Upper / Lower / Push / Pull
- there is no backend other than optional Supabase
- the app is intentionally single-file and dependency-light
- the UI is optimized for phone-sized screens first

## Recommended next upgrades

If you want a stronger second version, the best next steps are:

1. add a proper export / import backup file flow
2. add Supabase session status recovery messaging
3. add explicit cloud conflict resolution UI
4. split `app.jsx` into components once the product surface stabilizes
