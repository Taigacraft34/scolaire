import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ devoirs: [], controles: [], cours: [] });
  }

  const contient = { contains: q, mode: "insensitive" as const };
  const qMinuscule = q.toLowerCase();

  // Matieres dont le nom correspond : on ramenera tout ce qui leur est rattache.
  const matieresCorrespondantes = await prisma.matiere.findMany({
    where: { utilisateurId, nom: contient },
    select: { id: true },
  });
  const matiereIds = matieresCorrespondantes.map((m) => m.id);

  const [devoirs, controles] = await Promise.all([
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
  ]);

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
      href: "/devoirs",
    })),
    controles: controles.map((c) => ({
      id: c.id,
      titre: c.chapitreLibre || "Controle",
      matiere: c.matiere.nom,
      date: c.date,
      href: "/controles",
    })),
    cours: chapitres.map((c) => ({
      id: c.id,
      titre: c.nom,
      matiere: c.matiere.nom,
      href: `/cours/${c.matiereId}/${c.id}`,
    })),
  });
}
