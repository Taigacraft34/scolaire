import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FiltresRecherche } from "@/components/FiltresRecherche";

export default async function PageRecherche({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; matiere?: string; type?: string; date?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { q, matiere, type, date } = await searchParams;
  const requete = q?.trim() ?? "";

  const matieres = await prisma.matiere.findMany({ where: { utilisateurId }, orderBy: { nom: "asc" } });

  const filtreMatiere = matiere ? { matiere: { nom: matiere } } : {};
  const filtreDate = date
    ? {
        date: {
          gte: new Date(`${date}T00:00:00`),
          lte: new Date(`${date}T23:59:59`),
        },
      }
    : {};
  const rechercheActive = requete.length > 0 || matiere || type || date;

  const [devoirs, controles, notes, chapitres] = await Promise.all([
    !rechercheActive || type === "" || type === undefined || type === "devoir"
      ? prisma.devoir.findMany({
          where: {
            utilisateurId,
            ...filtreMatiere,
            ...filtreDate,
            ...(requete
              ? {
                  OR: [
                    { titre: { contains: requete, mode: "insensitive" } },
                    { description: { contains: requete, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          include: { matiere: true },
          orderBy: { date: "desc" },
          take: 50,
        })
      : [],
    !rechercheActive || type === "" || type === undefined || type === "controle"
      ? prisma.controle.findMany({
          where: {
            utilisateurId,
            ...filtreMatiere,
            ...filtreDate,
            ...(requete
              ? {
                  OR: [
                    { chapitreLibre: { contains: requete, mode: "insensitive" } },
                    { commentaire: { contains: requete, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          include: { matiere: true },
          orderBy: { date: "desc" },
          take: 50,
        })
      : [],
    !rechercheActive || type === "" || type === undefined || type === "note"
      ? prisma.note.findMany({
          where: {
            utilisateurId,
            ...filtreMatiere,
            ...filtreDate,
            ...(requete ? { commentaire: { contains: requete, mode: "insensitive" } } : {}),
          },
          include: { matiere: true },
          orderBy: { date: "desc" },
          take: 50,
        })
      : [],
    !rechercheActive || type === "" || type === undefined || type === "chapitre"
      ? prisma.chapitre.findMany({
          where: {
            utilisateurId,
            ...filtreMatiere,
            ...(requete ? { nom: { contains: requete, mode: "insensitive" } } : {}),
          },
          include: { matiere: true },
          orderBy: { nom: "asc" },
          take: 50,
        })
      : [],
  ]);

  const aucunResultat =
    rechercheActive && devoirs.length === 0 && controles.length === 0 && notes.length === 0 && chapitres.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Recherche</h1>

      <FiltresRecherche
        matieres={matieres.map((m) => m.nom)}
        qActuel={requete}
        matiereActuelle={matiere ?? ""}
        typeActuel={type ?? ""}
        dateActuelle={date ?? ""}
      />

      {!rechercheActive ? (
        <p className="text-sm text-zinc-500">Entrez un mot-cle ou choisissez un filtre pour lancer une recherche.</p>
      ) : aucunResultat ? (
        <p className="text-sm text-zinc-500">Aucun resultat.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {devoirs.length > 0 && (
            <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Devoirs ({devoirs.length})
              </h2>
              <ul className="flex flex-col gap-1">
                {devoirs.map((d) => (
                  <li key={d.id} className="flex justify-between text-sm">
                    <Link href="/devoirs" className="hover:underline">
                      {d.matiere.nom} — {d.titre}
                    </Link>
                    <span className="text-zinc-500">{d.date.toLocaleDateString("fr-FR")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {controles.length > 0 && (
            <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Controles ({controles.length})
              </h2>
              <ul className="flex flex-col gap-1">
                {controles.map((c) => (
                  <li key={c.id} className="flex justify-between text-sm">
                    <Link href="/controles" className="hover:underline">
                      {c.matiere.nom} {c.chapitreLibre ? `— ${c.chapitreLibre}` : ""}
                    </Link>
                    <span className="text-zinc-500">{c.date.toLocaleDateString("fr-FR")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {notes.length > 0 && (
            <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Notes ({notes.length})
              </h2>
              <ul className="flex flex-col gap-1">
                {notes.map((n) => (
                  <li key={n.id} className="flex justify-between text-sm">
                    <Link href="/notes" className="hover:underline">
                      {n.matiere.nom} — {n.noteObtenue}/{n.noteMaximale}
                    </Link>
                    <span className="text-zinc-500">{n.date.toLocaleDateString("fr-FR")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {chapitres.length > 0 && (
            <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Chapitres ({chapitres.length})
              </h2>
              <ul className="flex flex-col gap-1">
                {chapitres.map((c) => (
                  <li key={c.id} className="text-sm">
                    <Link href={`/cours/${c.matiereId}/${c.id}`} className="hover:underline">
                      {c.matiere.nom} — {c.nom}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
