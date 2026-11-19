import {
  withSupabase,
  createSupabaseContext,
  type WithSupabaseConfig,
  type SupabaseContext,
} from "@supabase/server";
import {
  resolveEnv,
  createAdminClient,
  createContextClient,
  verifyCredentials,
  extractCredentials,
  verifyAuth,
} from "@supabase/server/core";

export {
  withSupabase,
  createSupabaseContext,
  resolveEnv,
  createAdminClient,
  createContextClient,
  verifyCredentials,
  extractCredentials,
  verifyAuth,
  type WithSupabaseConfig,
  type SupabaseContext,
};

export const SUPABASE_CONFIG = {
  url:
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://fbpkvvhcegecfzdrwsvj.supabase.co",
  dataApiUrl:
    process.env.SUPABASE_DATA_API_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_DATA_API_URL ||
    "https://fbpkvvhcegecfzdrwsvj.supabase.co/rest/v1/",
  publishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "",
  secretKey: process.env.SUPABASE_SECRET_KEY || "",
  jwksUrl:
    process.env.SUPABASE_JWKS_URL ||
    "https://fbpkvvhcegecfzdrwsvj.supabase.co/auth/v1/.well-known/jwks.json",
};

/**
 * Resolves the Supabase environment using `@supabase/server/core` `resolveEnv()`
 * and returns a typed admin client (`createAdminClient`).
 */
export function getSupabaseAdminClient<Database = unknown>() {
  const { data: env, error } = resolveEnv();
  if (error || !env) {
    throw error ?? new Error("Failed to resolve Supabase environment variables.");
  }
  return createAdminClient<Database>({ env });
}

/**
 * Helper to query the Supabase Data API (`/rest/v1/`) directly with the configured keys.
 */
export async function fetchSupabaseDataApi<T = unknown>(
  endpointPath: string,
  options: RequestInit & { useSecretKey?: boolean } = {}
): Promise<T> {
  const { useSecretKey = true, headers, ...restOptions } = options;
  const apiKey = useSecretKey
    ? SUPABASE_CONFIG.secretKey
    : SUPABASE_CONFIG.publishableKey;

  const baseUrl = SUPABASE_CONFIG.dataApiUrl.replace(/\/+$/, "");
  const cleanPath = endpointPath.replace(/^\/+/, "");

  const res = await fetch(`${baseUrl}/${cleanPath}`, {
    ...restOptions,
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase Data API error (${res.status}): ${errText}`);
  }

  return res.json() as Promise<T>;
}
