import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { debutSemaine, formatDateParam } from "@/lib/calendrier";

// Le contenu de "contenuSeance" (rempli par la synchro MBN) est un tableau
// { id, titre, html } ; on compare le texte brut (balises retirees) a la
// requete et on renvoie un extrait a afficher dans les resultats - le titre
// de la seance elle-meme (SeanceEmploiDuTemps.titre) est presque toujours
// identique a la matiere et n'apporte rien affiche a cote.
function texteBrutHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extrait(texte: string, longueurMax = 80): string {
  return texte.length > longueurMax ? `${texte.slice(0, longueurMax).trimEnd()}…` : texte;
}

function extraitCorrespondant(texte: string, qMinuscule: string): string | null {
  return texte.toLowerCase().includes(qMinuscule) ? extrait(texte) : null;
}

function extraitDepuisContenuSeance(contenuSeance: Prisma.JsonValue, qMinuscule: string): string | null {
  if (!Array.isArray(contenuSeance)) return null;
  for (const bloc of contenuSeance) {
    if (!bloc || typeof bloc !== "object") continue;
    const { titre, html } = bloc as { titre?: unknown; html?: unknown };
    const titreTexte = typeof titre === "string" ? titre.trim() : "";
    if (titreTexte && titreTexte.toLowerCase().includes(qMinuscule)) return titreTexte;
    if (typeof html === "string") {
      // Le titre du bloc MBN est souvent generique ("Cours", "Séance") : on
      // prefere toujours montrer l'extrait qui a matche plutot que ce titre.
      const trouve = extraitCorrespondant(texteBrutHtml(html), qMinuscule);
      if (trouve) return trouve;
    }
  }
  return null;
}

// Recherche globale utilisee par la barre de recherche de l'en-tete. Renvoie
// les devoirs, controles et cours (chapitres) correspondant a la requete. La
// requete est comparee aux libelles habituels mais aussi au nom des matieres
// et des enseignants : chercher un prof ou une matiere ramene tout ce qui y
// est rattache.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erreur: "Non autorise" }, { status: 401 });
  }
  const utilisateurId = session.user.id;

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    return NextResponse.json({ devoirs: [], controles: [], cours: [], seances: [] });
  }

  const contient = { contains: q, mode: "insensitive" as const };
  const qMinuscule = q.toLowerCase();

  // Matieres dont le nom correspond : on ramenera tout ce qui leur est rattache.
  const matieresCorrespondantes = await prisma.matiere.findMany({
    where: { utilisateurId, nom: contient },
    select: { id: true },
  });
  const matiereIds = matieresCorrespondantes.map((m) => m.id);

  const [devoirs, controles, seancesAvecContenu] = await Promise.all([
    prisma.devoir.findMany({
      where: {
        utilisateurId,
        OR: [
          { titre: contient },
          { description: contient },
          { enseignant: contient },
          { matiereId: { in: matiereIds } },
        ],
      },
      include: { matiere: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.controle.findMany({
      where: {
        utilisateurId,
        OR: [
          { chapitreLibre: contient },
          { commentaire: contient },
          { matiereId: { in: matiereIds } },
          { devoirSource: { enseignant: contient } },
        ],
      },
      include: { matiere: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    // Le contenu ("activite en seance", synchronise ou manuel) est filtre en
    // JS ci-dessous : contenuSeance est un JSON de blocs, pas comparable
    // directement en SQL comme les autres champs texte.
    prisma.seanceEmploiDuTemps.findMany({
      where: {
        utilisateurId,
        OR: [{ contenuManuel: { not: null } }, { contenuSeance: { not: Prisma.DbNull } }],
      },
      orderBy: { debut: "desc" },
    }),
  ]);

  const seances = seancesAvecContenu
    .map((s) => {
      const trouve =
        (s.contenuManuel ? extraitCorrespondant(s.contenuManuel, qMinuscule) : null) ??
        extraitDepuisContenuSeance(s.contenuSeance, qMinuscule);
      return trouve ? { seance: s, extrait: trouve } : null;
    })
    .filter((r): r is { seance: (typeof seancesAvecContenu)[number]; extrait: string } => r !== null)
    .slice(0, 50);

  // Cours d'un enseignant recherche : les chapitres n'ont pas d'enseignant, on
  // passe par les matieres de ses devoirs.
  const matiereIdsAssocies = new Set<string>(matiereIds);
  for (const devoir of devoirs) {
    if (devoir.enseignant?.toLowerCase().includes(qMinuscule)) {
      matiereIdsAssocies.add(devoir.matiereId);
    }
  }

  const chapitres = await prisma.chapitre.findMany({
    where: {
      utilisateurId,
      OR: [
        { nom: contient },
        { matiereId: { in: [...matiereIdsAssocies] } },
        { blocs: { some: { contenuHtml: contient } } },
      ],
    },
    include: { matiere: true },
    orderBy: { nom: "asc" },
    take: 50,
  });

  return NextResponse.json({
    devoirs: devoirs.map((d) => ({
      id: d.id,
      titre: d.titre,
      matiere: d.matiere.nom,
      date: d.date,
      href: `/devoirs?focus=${d.id}`,
    })),
    controles: controles.map((c) => ({
      id: c.id,
      titre: c.chapitreLibre || "Controle",
      matiere: c.matiere.nom,
      date: c.date,
      href: `/controles?focus=${c.id}`,
    })),
    cours: chapitres.map((c) => ({
      id: c.id,
      titre: c.nom,
      matiere: c.matiere.nom,
      href: `/cours/${c.matiereId}/${c.id}`,
    })),
    seances: seances.map(({ seance: s, extrait }) => ({
      id: s.id,
      titre: extrait,
      matiere: s.matiere,
      date: s.debut,
      href: `/emploi-du-temps?semaine=${formatDateParam(debutSemaine(s.debut))}&focus=${s.id}`,
    })),
  });
}
