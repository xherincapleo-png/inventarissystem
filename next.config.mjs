/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL:
      process.env.DATABASE_URL ||
      "postgresql://postgres.fbpkvvhcegecfzdrwsvj:AdminNexus2026!@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
    DIRECT_URL:
      process.env.DIRECT_URL ||
      "postgresql://postgres.fbpkvvhcegecfzdrwsvj:AdminNexus2026!@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET ||
      "nexus-ims-super-secret-enterprise-key-2026-9988776655",
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL || "https://inventarissystem-bdvj.vercel.app",
    SUPABASE_URL:
      process.env.SUPABASE_URL || "https://fbpkvvhcegecfzdrwsvj.supabase.co",
    SUPABASE_PUBLISHABLE_KEY:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_FelBmSwmkZOMkq78d-vV-g_d2pOunAh",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
