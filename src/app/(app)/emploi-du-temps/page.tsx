import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ajouterJours, debutSemaine } from "@/lib/calendrier";
import { JOURS_ORDRE, LIBELLES_JOUR } from "@/lib/emploiDuTemps";
import { memeMatiere } from "@/lib/prochainCours";
import { libelleStatutControle } from "@/lib/libelles";
import { nettoyerHtml } from "@/lib/html";
import {
  GrilleEmploiDuTemps,
  type BlocGrille,
  type ControleGrille,
  type DevoirGrille,
  type JourGrille,
} from "@/components/GrilleEmploiDuTemps";
import type { Controle, Devoir, Matiere, SeanceEmploiDuTemps } from "@/generated/prisma/client";

type DevoirAvecMatiere = Devoir & { matiere: Matiere };
type ControleAvecMatiere = Controle & { matiere: Matiere };

const PX_PAR_HEURE = 56;
const HEURE_MIN_DEFAUT = 8;
const HEURE_MAX_DEFAUT = 18;

function formatDateParam(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

// Heure d'une date exprimee dans le fuseau de l'utilisateur (les dates Scolengo
// sont en UTC ; on veut l'heure "murale" locale pour aligner la grille).
function partiesFuseau(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const val = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const h = Number(val("hour"));
  const m = Number(val("minute"));
  return {
    minutes: h * 60 + m,
    label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    cleJour: `${val("year")}-${val("month")}-${val("day")}`,
  };
}

interface Bloc {
  seance: SeanceEmploiDuTemps;
  debMin: number;
  finMin: number;
  labelDeb: string;
  labelFin: string;
  col: number;
  nbCol: number;
  devoirs: DevoirAvecMatiere[];
  controles: ControleAvecMatiere[];
}

// Repartit les seances d'une journee en colonnes : les seances qui se
// chevauchent sont placees cote a cote (partitionnement d'intervalles).
function disposerJournee(seances: SeanceEmploiDuTemps[], timeZone: string): Bloc[] {
  const evenements = seances
    .map((seance) => {
      const d = partiesFuseau(seance.debut, timeZone);
      const f = partiesFuseau(seance.fin, timeZone);
      const debMin = d.minutes;
      const finMin = Math.max(f.minutes, debMin + 25);
      return { seance, debMin, finMin, labelDeb: d.label, labelFin: f.label };
    })
    .sort((a, b) => a.debMin - b.debMin || a.finMin - b.finMin);

  const resultat: Bloc[] = [];
  let groupe: Bloc[] = [];
  let colonnesFin: number[] = [];
  let groupeFin = -1;

  const cloturer = () => {
    for (const bloc of groupe) bloc.nbCol = colonnesFin.length;
    resultat.push(...groupe);
    groupe = [];
    colonnesFin = [];
    groupeFin = -1;
  };

  for (const ev of evenements) {
    if (groupe.length > 0 && ev.debMin >= groupeFin) cloturer();

    let col = colonnesFin.findIndex((fin) => fin <= ev.debMin);
    if (col === -1) {
      col = colonnesFin.length;
      colonnesFin.push(ev.finMin);
    } else {
      colonnesFin[col] = ev.finMin;
    }

    groupe.push({ ...ev, col, nbCol: 1, devoirs: [], controles: [] });
    groupeFin = Math.max(groupeFin, ev.finMin);
  }
  if (groupe.length > 0) cloturer();

  return resultat;
}

// Rattache un element date (devoir ou controle) a la seance de sa matiere qui a
// lieu le meme jour et dont l'heure de debut est la plus proche de l'echeance.
function rattacher<T extends { date: Date; matiere: Matiere }>(
  elements: T[],
  blocs: Bloc[],
  timeZone: string,
  ajouter: (bloc: Bloc, element: T) => void,
) {
  for (const element of elements) {
    const jourElement = partiesFuseau(element.date, timeZone).cleJour;
    let meilleur: Bloc | null = null;
    let meilleurEcart = Infinity;
    for (const bloc of blocs) {
      if (partiesFuseau(bloc.seance.debut, timeZone).cleJour !== jourElement) continue;
      if (!memeMatiere(bloc.seance.matiere, element.matiere.nom)) continue;
      const ecart = Math.abs(bloc.seance.debut.getTime() - element.date.getTime());
      if (ecart < meilleurEcart) {
        meilleur = bloc;
        meilleurEcart = ecart;
      }
    }
    if (meilleur) ajouter(meilleur, element);
  }
}

export default async function PageEmploiDuTemps({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { semaine: semaineParam } = await searchParams;

  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({
    where: { id: utilisateurId },
    select: { scolengoTokenChiffre: true, fuseauHoraire: true },
  });
  const timeZone = utilisateur.fuseauHoraire || "Europe/Paris";

  const semaineBase = semaineParam ? new Date(semaineParam) : new Date();
  const lundiAffiche = debutSemaine(Number.isNaN(semaineBase.getTime()) ? new Date() : semaineBase);
  const vendrediAffiche = ajouterJours(lundiAffiche, 4);
  const finSemaine = ajouterJours(lundiAffiche, 7);
  const bornesEcheance = {
    date: { gte: ajouterJours(lundiAffiche, -1), lt: ajouterJours(finSemaine, 1) },
  };

  const [seances, devoirsSemaine, controlesSemaine, derniereSynchro] = await Promise.all([
    prisma.seanceEmploiDuTemps.findMany({
      where: { utilisateurId, debut: { gte: lundiAffiche, lt: finSemaine } },
      orderBy: { debut: "asc" },
    }),
    prisma.devoir.findMany({
      where: { utilisateurId, ...bornesEcheance },
      include: { matiere: true },
    }),
    prisma.controle.findMany({
      where: { utilisateurId, ...bornesEcheance },
      include: { matiere: true },
    }),
    prisma.synchronisation.findFirst({ where: { utilisateurId }, orderBy: { demarreeLe: "desc" } }),
  ]);

  function lienSemaine(delta: number): string {
    return `/emploi-du-temps?semaine=${formatDateParam(ajouterJours(lundiAffiche, delta * 7))}`;
  }

  // Lundi -> vendredi uniquement.
  const jours = JOURS_ORDRE.slice(0, 5).map((jour, index) => {
    const date = ajouterJours(lundiAffiche, index);
    const cleJour = partiesFuseau(date, timeZone).cleJour;
    const seancesJour = seances.filter((s) => partiesFuseau(s.debut, timeZone).cleJour === cleJour);
    return {
      jour,
      libelle: `${LIBELLES_JOUR[jour]} ${date.getDate()}/${date.getMonth() + 1}`,
      cle: cleJour,
      blocs: disposerJournee(seancesJour, timeZone),
    };
  });

  const tousBlocs = jours.flatMap((j) => j.blocs);
  rattacher(devoirsSemaine, tousBlocs, timeZone, (b, d) => b.devoirs.push(d));
  rattacher(controlesSemaine, tousBlocs, timeZone, (b, c) => b.controles.push(c));

  const heureMin = tousBlocs.length
    ? Math.floor(Math.min(...tousBlocs.map((b) => b.debMin)) / 60)
    : HEURE_MIN_DEFAUT;
  const heureMax = tousBlocs.length
    ? Math.ceil(Math.max(...tousBlocs.map((b) => b.finMin)) / 60)
    : HEURE_MAX_DEFAUT;
  const hauteurGrille = (heureMax - heureMin) * PX_PAR_HEURE;
  const lignes = Array.from({ length: heureMax - heureMin + 1 }, (_, i) => ({
    label: `${heureMin + i}h`,
    top: i * PX_PAR_HEURE,
  }));

  const enDevoir = (d: DevoirAvecMatiere): DevoirGrille => ({
    id: d.id,
    titre: d.titre,
    descriptionHtml: d.description ? nettoyerHtml(d.description) : null,
    statut: d.statut,
    dateLabel: d.date.toLocaleDateString("fr-FR"),
  });

  const enControle = (c: ControleAvecMatiere): ControleGrille => ({
    id: c.id,
    intitule: c.chapitreLibre || `Controle de ${c.matiere.nom}`,
    commentaire: c.commentaire,
    aVenir: libelleStatutControle(c.date) === "À venir",
    dateLabel: c.date.toLocaleDateString("fr-FR"),
    heure: c.heure,
  });

  const joursGrille: JourGrille[] = jours.map((j) => ({
    cle: j.cle,
    libelle: j.libelle,
    blocs: j.blocs.map<BlocGrille>((b) => ({
      id: b.seance.id,
      matiere: b.seance.matiere,
      salle: b.seance.salle,
      enseignant: b.seance.enseignant,
      couleur: b.seance.couleur,
      annule: b.seance.annule,
      labelDeb: b.labelDeb,
      labelFin: b.labelFin,
      top: ((b.debMin - heureMin * 60) / 60) * PX_PAR_HEURE,
      height: ((b.finMin - b.debMin) / 60) * PX_PAR_HEURE - 2,
      leftPct: (b.col / b.nbCol) * 100,
      widthPct: 100 / b.nbCol,
      devoirs: b.devoirs.map(enDevoir),
      controles: b.controles.map(enControle),
    })),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Emploi du temps</h1>
        {derniereSynchro && (
          <p className="text-xs text-zinc-500">
            Derniere synchronisation : {derniereSynchro.demarreeLe.toLocaleString("fr-FR")}
          </p>
        )}
      </div>

      <p className="-mt-3 text-sm text-zinc-500">
        L&apos;emploi du temps est importe automatiquement depuis MonBureauNumerique lors des
        synchronisations. Il n&apos;y a pas de saisie manuelle.
      </p>

      {!utilisateur.scolengoTokenChiffre && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Aucun token MonBureauNumerique configure. Ajoutez-le dans les{" "}
          <Link href="/parametres" className="underline">
            parametres
          </Link>{" "}
          puis lancez une synchronisation pour voir votre emploi du temps.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Semaine du {lundiAffiche.toLocaleDateString("fr-FR")} au{" "}
          {vendrediAffiche.toLocaleDateString("fr-FR")}
        </h2>
        <div className="flex gap-2">
          <Link
            href={lienSemaine(-1)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            ← Semaine precedente
          </Link>
          <Link
            href="/emploi-du-temps"
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            Cette semaine
          </Link>
          <Link
            href={lienSemaine(1)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            Semaine suivante →
          </Link>
        </div>
      </div>

      {seances.length === 0 ? (
        <p className="rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          Aucun cours pour cette semaine.
        </p>
      ) : (
        <GrilleEmploiDuTemps jours={joursGrille} lignes={lignes} hauteur={hauteurGrille} />
      )}
    </div>
  );
}
