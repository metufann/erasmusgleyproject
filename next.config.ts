import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "xxxxx.supabase.co" }],
  }
};

export default nextConfig;
