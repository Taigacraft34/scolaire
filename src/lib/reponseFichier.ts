// En-tetes des fichiers servis depuis l'origine de l'app (documents uploades,
// pieces jointes MBN). Leur type MIME n'est pas fiable : il vient du
// navigateur a l'upload, ou du prof sur MBN. Ouvert "inline", un .html ou un
// .svg executerait son JavaScript avec la session de l'utilisateur. On
// n'affiche donc dans le navigateur que des types inoffensifs ; tout le reste
// est force en telechargement, en type neutre.
const TYPES_AFFICHABLES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "text/plain",
]);

function estAffichable(typeMime: string): boolean {
  return TYPES_AFFICHABLES.has(typeMime) || typeMime.startsWith("audio/") || typeMime.startsWith("video/");
}

export function enTetesFichier(typeMimeBrut: string | null, nomFichier: string): HeadersInit {
  // "application/pdf;charset=iso-8859-1" -> "application/pdf"
  const typeMime = (typeMimeBrut ?? "").split(";")[0].trim().toLowerCase();
  const affichable = estAffichable(typeMime);

  const enTetes: Record<string, string> = {
    "Content-Type": affichable ? typeMime : "application/octet-stream",
    "Content-Disposition": `${affichable ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(nomFichier)}`,
    // Interdit au navigateur de deviner un autre type que celui annonce.
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=3600",
  };
  // Filet de securite : le fichier tourne dans une origine opaque, sans
  // scripts. Pas pour le PDF : Chrome refuse d'afficher un PDF sandboxe, et
  // sa visionneuse est deja isolee de la page.
  if (typeMime !== "application/pdf") enTetes["Content-Security-Policy"] = "sandbox";
  return enTetes;
}
