import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply CORS headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value:
              "http://3000-firebase-taskflow3git-1756579205792.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev, https://3000-firebase-taskflow3git-1756579205792.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
