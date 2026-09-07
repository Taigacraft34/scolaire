import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ajouterJours, debutSemaine, memeJour } from "@/lib/calendrier";
import { FiltresCalendrier } from "@/components/FiltresCalendrier";
import { IconeFlecheGauche, IconeFlecheDroite } from "@/components/Icone";
import { boutonEncadre, titrePage } from "@/lib/ui";

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
    <div className="flex flex-col gap-[var(--carreau)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className={titrePage + " first-letter:uppercase"}>
          {NOMS_MOIS[moisCourant]} <span className="tabulaire text-ink-soft">{anneeCourante}</span>
        </h1>
        <div className="flex gap-1.5">
          <Link href={construireLien(-1)} className={boutonEncadre} aria-label="Mois précédent">
            <IconeFlecheGauche />
          </Link>
          <Link href={construireLien(1)} className={boutonEncadre} aria-label="Mois suivant">
            <IconeFlecheDroite />
          </Link>
        </div>
      </div>

      <FiltresCalendrier
        matieres={matieres.map((m) => m.nom)}
        matiereActuelle={matiere ?? ""}
        typeActuel={type ?? ""}
      />

      <div className="carreaux grid grid-cols-7 overflow-hidden border border-ink-blue bg-paper">
        {NOMS_JOURS.map((nom) => (
          <div
            key={nom}
            className="border-b border-l border-ink-blue/40 py-1 text-center font-body text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue first:border-l-0"
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
              className={
                "min-h-[calc(var(--carreau)*3.5)] border-b border-l border-ruling p-1 [&:nth-child(7n+1)]:border-l-0 " +
                (horsMois ? "opacity-35" : "")
              }
            >
              <p
                className={
                  "tabulaire font-mono text-xs " +
                  (estAujourdhui
                    ? "inline-flex h-4 w-4 items-center justify-center rounded-full bg-bic-red font-bold text-paper"
                    : "text-ink-soft")
                }
              >
                {jour.getDate()}
              </p>
              <div className="mt-0.5 flex flex-col gap-0.5">
                {devoirsJour.map((d) => (
                  <p
                    key={d.id}
                    title={`${d.matiere.nom} — ${d.titre}`}
                    className="truncate font-body text-[0.62rem] leading-tight text-ink"
                  >
                    <span className="font-bold text-ink-blue">{d.matiere.nom}</span> {d.titre}
                  </p>
                ))}
                {controlesJour.map((c) => (
                  <p
                    key={c.id}
                    title={`${c.matiere.nom}${c.chapitreLibre ? " — " + c.chapitreLibre : ""}`}
                    className="truncate bg-bic-red/10 px-1 font-body text-[0.62rem] font-bold leading-tight text-bic-red"
                  >
                    {c.matiere.nom}
                    {c.chapitreLibre ? ` · ${c.chapitreLibre}` : ""}
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
