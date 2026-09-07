import type { Metadata, Viewport } from "next";
import { Spectral, Atkinson_Hyperlegible, Fragment_Mono } from "next/font/google";
import "./globals.css";

// Spectral : sérif d'écran de la fonderie parisienne Prod.Type — la voix des
// titres, registre « livre scolaire ».
const spectral = Spectral({
  variable: "--police-titre",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Atkinson Hyperlegible (Braille Institute) : conçue pour la lisibilité pure —
// le texte qu'un élève lit dix fois par jour, posé sur la réglure.
const atkinson = Atkinson_Hyperlegible({
  variable: "--police-corps",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Fragment Mono : chiffres et codes (heures, abréviations Scolengo, dates) —
// alignés à la ligne comme des colonnes écrites.
const fragmentMono = Fragment_Mono({
  variable: "--police-mono",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scolaire",
  description: "Ton cahier de bord scolaire, connecté à MonBureauNumérique",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Scolaire",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfdfb" },
    { media: "(prefers-color-scheme: dark)", color: "#151b2e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${spectral.variable} ${atkinson.variable} ${fragmentMono.variable} h-full`}
    >
      <head>
        {/* Applique le thème avant le premier rendu pour éviter un flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  var theme = localStorage.getItem("theme");
  if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
