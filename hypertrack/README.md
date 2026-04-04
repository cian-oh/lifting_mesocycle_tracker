# HyperTrack

Mobile-first RP-style hypertrophy tracker built as a static React app for free Cloudflare Pages hosting.

## What’s in here

- `index.html`: static entrypoint, fonts, CSS, React runtime, Babel loader
- `app.jsx`: the full app in one file

## Storage

By default the app persists to browser `localStorage` under `hypertrack_cian_v1`.

It also detects and uses `window.storage.get/set` if that API exists, so the same app can run in environments that expose a Claude-style storage adapter.

## Run locally

Because this app uses browser-loaded JSX, you should serve the folder over a simple static server rather than opening `index.html` directly.

Examples:

```bash
cd hypertrack
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy to Cloudflare Pages

This project is intentionally zero-build.

1. Create a new GitHub repo and drag this `hypertrack` directory into it.
2. Push the repo to GitHub.
3. In Cloudflare Pages, choose `Create a project` and connect the repo.
4. Use these settings:
   - Framework preset: `None`
   - Build command: leave blank
   - Build output directory: `/`
5. Deploy.

Cloudflare Pages free tier is enough for this app because it is just static files.

## Free storage guidance

For a personal free deployment, the simplest storage option is exactly what this app already uses:

- `localStorage` is free
- no server is required
- no account auth is required
- your data stays in your browser on your device

That is the right fit if:

- only you are using the app
- you mainly use one phone or one browser profile
- you do not need cross-device sync

### Important limitation

`localStorage` is device/browser specific. If you switch phone, clear browser data, or use a different browser, the stored mesocycle does not follow you.

## If you later want sync but still want to stay cheap

Best upgrade path:

1. Keep this UI on Cloudflare Pages.
2. Add a tiny Cloudflare Worker API.
3. Store the JSON blob in a free Cloudflare KV namespace or D1 database.
4. Protect it with Cloudflare Access or a simple personal passcode flow.

I did not wire that in by default because you asked for free and simple, and local browser storage is the cleanest first version.

## Supabase option

Yes. Supabase is a reasonable alternative if you want:

- the same data on multiple devices
- a simple hosted Postgres backend
- email login or magic-link auth later

For this app specifically, Supabase Database is the better fit than Supabase Storage.

- Use a small table to store the `meso` JSON blob per user.
- Keep the app on Cloudflare Pages.
- Add a lightweight auth flow so only your account can read and write your plan data.

Recommended shape:

- `profiles` table or `mesocycles` table
- columns like `id`, `user_id`, `meso_json`, `updated_at`
- Row Level Security so only your logged-in user can access rows

I did not build that in yet because it adds:

- auth setup
- Supabase project configuration
- a browser client dependency
- sync state and error handling

If you want, the next step can be a Supabase-backed version of this same app with:

1. email magic-link sign-in
2. one-row-per-user JSON persistence
3. local draft cache plus cloud sync

## AI exercise selection

The app includes an Anthropic fetch path, but on a normal public Cloudflare Pages site there is no safe way to embed a private Anthropic API key in frontend code.

So the app is built to:

- try the Anthropic path only if a browser-side key is explicitly provided
- otherwise fall back automatically to the built-in exercise library

For a private personal deployment, the fallback library is the default recommended mode.
