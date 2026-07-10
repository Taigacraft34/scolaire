import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les cours peuvent contenir des videos/PDF assez lourds ; la limite par
      // defaut de 1 Mo est trop basse pour ces uploads.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
