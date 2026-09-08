import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ajouterJours, debutSemaine, memeJour } from "@/lib/calendrier";
import { dateCourte } from "@/lib/dates";
import { FiltresCalendrier } from "@/components/FiltresCalendrier";
import { IconeFlecheGauche, IconeFlecheDroite, IconeChevronDroite } from "@/components/Icone";
import { boutonEncadre, titrePage, titreSection } from "@/lib/ui";

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

  // Liste chronologique du mois affiché — la vue lisible sur mobile.
  const agenda = [
    ...devoirs.map((d) => ({
      id: d.id,
      date: d.date,
      type: "devoir" as const,
      matiere: d.matiere.nom,
      titre: d.titre,
      href: `/devoirs?focus=${d.id}`,
    })),
    ...controles.map((c) => ({
      id: c.id,
      date: c.date,
      type: "controle" as const,
      matiere: c.matiere.nom,
      titre: c.chapitreLibre ?? "Contrôle",
      href: `/controles?focus=${c.id}`,
    })),
  ]
    .filter((e) => e.date.getMonth() === moisCourant && e.date.getFullYear() === anneeCourante)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

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

      <div className="carreaux pleine-largeur-mobile grid grid-cols-7 overflow-hidden border border-ink-blue bg-paper">
        {NOMS_JOURS.map((nom) => (
          <div
            key={nom}
            className="border-b border-l border-ink-blue/40 py-1 text-center font-body text-xs font-bold uppercase tracking-wide text-ink-blue first:border-l-0"
          >
            <span className="sm:hidden">{nom[0]}</span>
            <span className="hidden sm:inline">{nom}</span>
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
                "min-w-0 overflow-hidden border-b border-l border-ruling p-1 [&:nth-child(7n+1)]:border-l-0 " +
                "min-h-[calc(var(--carreau)*2)] sm:min-h-[calc(var(--carreau)*3.5)] " +
                (horsMois ? "opacity-35" : "")
              }
            >
              <p
                className={
                  "tabulaire font-mono text-xs " +
                  (estAujourdhui
                    ? "inline-flex h-4 w-4 items-center justify-center rounded-full bg-ink-blue font-bold text-paper"
                    : "text-ink-soft")
                }
              >
                {jour.getDate()}
              </p>

              {/* Mobile : des pastilles. Desktop : le détail. */}
              {(devoirsJour.length > 0 || controlesJour.length > 0) && (
                <span className="mt-1 flex flex-wrap gap-1 sm:hidden" aria-hidden>
                  {controlesJour.map((c) => (
                    <span key={c.id} className="h-1.5 w-1.5 rounded-full bg-bic-red" />
                  ))}
                  {devoirsJour.map((d) => (
                    <span key={d.id} className="h-1.5 w-1.5 rounded-full bg-ink-blue" />
                  ))}
                </span>
              )}

              <div className="mt-0.5 hidden min-w-0 flex-col gap-0.5 sm:flex">
                {devoirsJour.map((d) => (
                  <p
                    key={d.id}
                    title={`${d.matiere.nom} — ${d.titre}`}
                    className="truncate font-body text-xs leading-snug text-ink"
                  >
                    <span className="font-bold text-ink-blue">{d.matiere.nom}</span> {d.titre}
                  </p>
                ))}
                {controlesJour.map((c) => (
                  <p
                    key={c.id}
                    title={`${c.matiere.nom}${c.chapitreLibre ? " — " + c.chapitreLibre : ""}`}
                    className="truncate bg-bic-red/10 px-1 font-body text-xs font-bold leading-snug text-bic-red"
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

      {/* Agenda du mois — la vue de lecture sur mobile. */}
      <section className="flex flex-col sm:hidden">
        <h2 className={titreSection + " mb-1"}>Ce mois-ci</h2>
        {agenda.length === 0 ? (
          <p className="font-body text-sm text-ink-soft">Rien ce mois-ci.</p>
        ) : (
          <ul className="flex flex-col">
            {agenda.map((e) => (
              <li
                key={`${e.type}-${e.id}`}
                className="relative flex min-h-[var(--carreau)] items-baseline gap-2 leading-[var(--carreau)]"
              >
                <span className="tabulaire absolute right-full mr-[calc(var(--carreau)+0.3rem)] font-mono text-xs text-ink-soft">
                  {dateCourte(e.date)}
                </span>
                <Link
                  href={e.href}
                  className={
                    "min-w-0 flex-1 truncate hover:underline " +
                    (e.type === "controle" ? "font-bold text-bic-red" : "text-ink")
                  }
                >
                  <span
                    className={
                      "mr-2 font-body text-[0.72rem] font-bold uppercase tracking-wide " +
                      (e.type === "controle" ? "text-bic-red" : "text-ink-blue")
                    }
                  >
                    {e.matiere}
                  </span>
                  {e.titre}
                </Link>
                <IconeChevronDroite className="shrink-0 text-ink-soft/70" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
