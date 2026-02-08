import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.vercel.app"
      ].filter(Boolean) as string[],
    },
  },
};

export default nextConfig;
