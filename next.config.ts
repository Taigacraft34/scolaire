import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// La connexion passe par un formulaire (server action) qui redirige vers
// ZITADEL : form-action doit l'autoriser, sinon le navigateur bloque la
// redirection apres envoi.
const origineZitadel = process.env.ZITADEL_ISSUER ? new URL(process.env.ZITADEL_ISSUER).origin : "";

// Tout est servi par l'app elle-meme (polices next/font auto-hebergees,
// aucun script tiers). 'unsafe-inline' reste necessaire pour les scripts
// inline de Next (charge RSC, script de theme) et les styles inline ; en dev,
// le rechargement a chaud demande aussi eval et un websocket.
const politiqueContenu = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${origineZitadel}`.trim(),
  // 'self' et non 'none' : l'aperçu PDF des cours est une iframe de l'app.
  "frame-ancestors 'self'",
].join("; ");

const enTetesSecurite = [
  { key: "Content-Security-Policy", value: politiqueContenu },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS n'a de sens qu'en HTTPS : pas en dev (http://localhost, IP locale).
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: enTetesSecurite }];
  },
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
