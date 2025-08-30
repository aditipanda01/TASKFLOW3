import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devServer: {
    allowedDevOrigins: [
      "http://3000-firebase-taskflow3git-1756579205792.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev",
      "https://3000-firebase-taskflow3git-1756579205792.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev",
    ],
  },
};

export default nextConfig;
