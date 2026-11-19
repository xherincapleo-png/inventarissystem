const FALLBACK_DB =
  "postgresql://postgres.fbpkvvhcegecfzdrwsvj:AdminNexus2026!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DB;
}

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "nexus-ims-super-secret-enterprise-key-2026-9988776655";
}

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "https://inventarissystem-bdvj.vercel.app";
}

export const DATABASE_URL = process.env.DATABASE_URL || FALLBACK_DB;
