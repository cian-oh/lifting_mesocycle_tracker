export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/config.js") {
      const config = {
        supabaseUrl: env.HYPERTRACK_SUPABASE_URL || "",
        supabaseAnonKey: env.HYPERTRACK_SUPABASE_ANON_KEY || "",
      };

      return new Response(
        `window.__HYPERTRACK_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`,
        {
          headers: {
            "content-type": "application/javascript; charset=utf-8",
            "cache-control": "no-store",
          },
        }
      );
    }

    return env.ASSETS.fetch(request);
  },
};
