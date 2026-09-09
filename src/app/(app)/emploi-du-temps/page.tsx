import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ajouterJours, debutSemaine } from "@/lib/calendrier";
import { JOURS_ORDRE, LIBELLES_JOUR } from "@/lib/emploiDuTemps";
import { memeMatiere } from "@/lib/prochainCours";
import { partiesFuseau } from "@/lib/fuseau";
import { dateCourte, dateMoyenne, ilYa } from "@/lib/dates";
import { libelleStatutControle } from "@/lib/libelles";
import { nettoyerHtml } from "@/lib/html";
import {
  GrilleEmploiDuTemps,
  type BlocGrille,
  type ContenuSeanceGrille,
  type ControleGrille,
  type DevoirGrille,
  type JourGrille,
} from "@/components/GrilleEmploiDuTemps";
import type { Controle, Devoir, Matiere, SeanceEmploiDuTemps } from "@/generated/prisma/client";
import { IconeFlecheGauche, IconeFlecheDroite } from "@/components/Icone";
import { boutonEncadre, titrePage } from "@/lib/ui";

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

  const retour = semaineParam
    ? `/emploi-du-temps?semaine=${encodeURIComponent(semaineParam)}`
    : "/emploi-du-temps";

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
    dateLabel: dateMoyenne(d.date),
  });

  const enContenusSync = (contenuSeance: SeanceEmploiDuTemps["contenuSeance"]): ContenuSeanceGrille[] => {
    if (!Array.isArray(contenuSeance)) return [];
    return contenuSeance
      .filter(
        (c): c is { id: string; titre: string | null; html: string } =>
          !!c && typeof c === "object" && "html" in c && typeof (c as { html: unknown }).html === "string",
      )
      .map((c) => ({ id: c.id, titre: c.titre ?? "", html: nettoyerHtml(c.html) }));
  };

  const enControle = (c: ControleAvecMatiere): ControleGrille => ({
    id: c.id,
    intitule: c.chapitreLibre || `Contrôle de ${c.matiere.nom}`,
    commentaire: c.commentaire,
    aVenir: libelleStatutControle(c.date) === "À venir",
    dateLabel: dateMoyenne(c.date),
    heure: c.heure,
  });

  const joursGrille: JourGrille[] = jours.map((j) => ({
    cle: j.cle,
    libelle: j.libelle,
    blocs: j.blocs.map<BlocGrille>((b) => {
      const contenusSync = enContenusSync(b.seance.contenuSeance);
      const contenuManuelTexte = b.seance.contenuManuel;
      return {
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
        // Le contenu MBN (rempli par le prof) prend le dessus sur la note
        // personnelle des qu'il existe ; la note reste en base pour reapparaitre
        // si le prof retire son contenu.
        contenus:
          contenusSync.length > 0
            ? contenusSync
            : contenuManuelTexte
              ? [{ id: "manuel", titre: "", html: nettoyerHtml(contenuManuelTexte) }]
              : [],
        contenuSynchronise: contenusSync.length > 0,
        contenuManuelTexte,
      };
    }),
  }));

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className={titrePage}>Emploi du temps</h1>
        {derniereSynchro && (
          <p className="font-body text-xs text-ink-soft">
            Synchronisé {ilYa(derniereSynchro.termineeLe ?? derniereSynchro.demarreeLe)}
          </p>
        )}
      </div>

      {!utilisateur.scolengoTokenChiffre && (
        <p className="border border-bic-red/40 bg-bic-red/5 p-3 font-body text-sm text-bic-red">
          Aucun token MonBureauNumérique configuré. Ajoute-le dans les{" "}
          <Link href="/parametres" className="underline underline-offset-2">
            paramètres
          </Link>{" "}
          puis lance une synchronisation.
        </p>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg text-ink">
          Semaine du{" "}
          <span className="tabulaire">{dateCourte(lundiAffiche)}</span> au{" "}
          <span className="tabulaire">{dateCourte(vendrediAffiche)}</span>
        </h2>
        <div className="flex gap-1.5">
          <Link href={lienSemaine(-1)} className={boutonEncadre} aria-label="Semaine précédente">
            <IconeFlecheGauche />
          </Link>
          <Link href="/emploi-du-temps" className={boutonEncadre}>
            Cette semaine
          </Link>
          <Link href={lienSemaine(1)} className={boutonEncadre} aria-label="Semaine suivante">
            <IconeFlecheDroite />
          </Link>
        </div>
      </div>

      {seances.length === 0 ? (
        <p className="font-body leading-[var(--carreau)] text-ink-soft">
          Aucun cours pour cette semaine.
        </p>
      ) : (
        <GrilleEmploiDuTemps
          jours={joursGrille}
          lignes={lignes}
          hauteur={hauteurGrille}
          retour={retour}
        />
      )}
    </div>
  );
}
