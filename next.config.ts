import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En dev, Next bloque par défaut les requêtes vers ses ressources internes
  // (_next/*, HMR…) provenant d'une autre origine que localhost. Sans ça, ouvrir
  // l'app depuis un téléphone sur le réseau local (http://192.168.x.x:3000)
  // charge le HTML mais pas le JS : les liens marchent, rien d'autre.
  // Adapte l'adresse à celle affichée par `next dev` (ligne "Network").
  allowedDevOrigins: [
    "192.168.1.68",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.0.*",
    "172.16.*.*",
  ],
  experimental: {
    serverActions: {
      // Les cours peuvent contenir des videos/PDF assez lourds ; la limite par
      // defaut de 1 Mo est trop basse pour ces uploads.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
