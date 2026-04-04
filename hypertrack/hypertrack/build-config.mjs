import { writeFileSync } from "node:fs";

const config = {
  supabaseUrl: process.env.HYPERTRACK_SUPABASE_URL || "",
  supabaseAnonKey: process.env.HYPERTRACK_SUPABASE_ANON_KEY || "",
};

writeFileSync(
  new URL("./config.js", import.meta.url),
  `window.__HYPERTRACK_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`,
  "utf8"
);
