import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ajouterJours, debutSemaine, memeJour } from "@/lib/calendrier";
import { FiltresCalendrier } from "@/components/FiltresCalendrier";

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const NOMS_JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default async function PageCalendrier({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string; mois?: string; matiere?: string; type?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { annee, mois, matiere, type } = await searchParams;

  const maintenant = new Date();
  const anneeCourante = annee ? parseInt(annee, 10) : maintenant.getFullYear();
  const moisCourant = mois ? parseInt(mois, 10) - 1 : maintenant.getMonth();

  const premierJourMois = new Date(anneeCourante, moisCourant, 1);
  const dernierJourMois = new Date(anneeCourante, moisCourant + 1, 0);

  const debutGrille = debutSemaine(premierJourMois);
  const finGrille = ajouterJours(debutSemaine(dernierJourMois), 6);

  const matieres = await prisma.matiere.findMany({ where: { utilisateurId }, orderBy: { nom: "asc" } });

  const [devoirs, controles] = await Promise.all([
    type === "controle"
      ? []
      : prisma.devoir.findMany({
          where: {
            utilisateurId,
            date: { gte: debutGrille, lte: finGrille },
            ...(matiere ? { matiere: { nom: matiere } } : {}),
          },
          include: { matiere: true },
        }),
    type === "devoir"
      ? []
      : prisma.controle.findMany({
          where: {
            utilisateurId,
            date: { gte: debutGrille, lte: finGrille },
            ...(matiere ? { matiere: { nom: matiere } } : {}),
          },
          include: { matiere: true },
        }),
  ]);

  const jours: Date[] = [];
  for (let d = new Date(debutGrille); d <= finGrille; d = ajouterJours(d, 1)) {
    jours.push(new Date(d));
  }

  function construireLien(deltaMois: number) {
    const d = new Date(anneeCourante, moisCourant + deltaMois, 1);
    const params = new URLSearchParams();
    params.set("annee", String(d.getFullYear()));
    params.set("mois", String(d.getMonth() + 1));
    if (matiere) params.set("matiere", matiere);
    if (type) params.set("type", type);
    return `/calendrier?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {NOMS_MOIS[moisCourant]} {anneeCourante}
        </h1>
        <div className="flex gap-2">
          <Link
            href={construireLien(-1)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
← Précédent
          </Link>
          <Link
            href={construireLien(1)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            Suivant →
          </Link>
        </div>
      </div>

      <FiltresCalendrier
        matieres={matieres.map((m) => m.nom)}
        matiereActuelle={matiere ?? ""}
        typeActuel={type ?? ""}
      />

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-zinc-300 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800">
        {NOMS_JOURS.map((nom) => (
          <div
            key={nom}
            className="bg-zinc-100 p-2 text-center text-xs font-medium text-zinc-500 dark:bg-zinc-900"
          >
            {nom}
          </div>
        ))}
        {jours.map((jour) => {
          const horsMois = jour.getMonth() !== moisCourant;
          const devoirsJour = devoirs.filter((d) => memeJour(d.date, jour));
          const controlesJour = controles.filter((c) => memeJour(c.date, jour));
          const estAujourdhui = memeJour(jour, maintenant);

          return (
            <div
              key={jour.toISOString()}
              className={`min-h-24 bg-white p-1 dark:bg-zinc-950 ${horsMois ? "opacity-40" : ""}`}
            >
              <p
                className={`text-xs ${
                  estAujourdhui ? "font-bold text-blue-600 dark:text-blue-400" : "text-zinc-500"
                }`}
              >
                {jour.getDate()}
              </p>
              <div className="flex flex-col gap-0.5">
                {devoirsJour.map((d) => (
                  <p
                    key={d.id}
                    title={`${d.matiere.nom} — ${d.titre}`}
                    className="truncate rounded bg-zinc-100 px-1 text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {d.matiere.nom}: {d.titre}
                  </p>
                ))}
                {controlesJour.map((c) => (
                  <p
                    key={c.id}
                    title={`${c.matiere.nom}${c.chapitreLibre ? " — " + c.chapitreLibre : ""}`}
                    className="truncate rounded bg-blue-100 px-1 text-[10px] text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  >
                    {c.matiere.nom}
                    {c.chapitreLibre ? `: ${c.chapitreLibre}` : ""}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
