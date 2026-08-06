import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost:3000", "dev.boxx.vn"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bnb-chat-agent-media.bienhinh.vn",
      },
    ],
  },
};

export default nextConfig;
