import { withSupabase, SUPABASE_CONFIG, resolveEnv } from "@/lib/supabase";

/**
 * Next.js App Router Route Handler powered by `@supabase/server` `withSupabase`.
 * Supports `auth: ['user', 'publishable', 'secret', 'none']` so you can test it directly
 * in the browser or with an `apikey` / `Authorization` header.
 */
export const GET = withSupabase(
  { auth: ["user", "publishable", "secret", "none"] },
  async (_req, ctx) => {
    const envCheck = resolveEnv();

    // Verify connectivity against the configured Data API endpoint (/rest/v1/)
    const restResponse = await fetch(SUPABASE_CONFIG.dataApiUrl, {
      headers: {
        apikey: SUPABASE_CONFIG.secretKey || SUPABASE_CONFIG.publishableKey,
      },
      cache: "no-store",
    });

    return Response.json({
      status: "ok",
      package: "@supabase/server",
      authMode: ctx.authMode,
      envResolved: !envCheck.error,
      dataApiReachable: restResponse.ok,
      dataApiStatus: restResponse.status,
      config: {
        supabaseUrl: SUPABASE_CONFIG.url,
        dataApiUrl: SUPABASE_CONFIG.dataApiUrl,
        jwksUrl: SUPABASE_CONFIG.jwksUrl,
        hasPublishableKey: Boolean(SUPABASE_CONFIG.publishableKey),
        hasSecretKey: Boolean(SUPABASE_CONFIG.secretKey),
      },
      clientsReady: {
        supabase: Boolean(ctx.supabase),
        supabaseAdmin: Boolean(ctx.supabaseAdmin),
      },
    });
  }
);
