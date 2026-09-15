import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { partiesFuseau } from "@/lib/fuseau";
import { memeMatiere } from "@/lib/prochainCours";
import { dateCourte, dateLongue, ilYa } from "@/lib/dates";
import { LigneObligation } from "@/components/LigneObligation";
import { LigneSeance } from "@/components/LigneSeance";
import { SlipControle } from "@/components/SlipControle";
import { titreSection } from "@/lib/ui";

function jours(entre: Date, et: Date): number {
  return Math.round((et.getTime() - entre.getTime()) / 86_400_000);
}

function dansLabel(n: number): string {
  if (n <= 0) return "aujourd'hui";
  if (n === 1) return "demain";
  if (n < 7) return `dans ${n} jours`;
  if (n < 14) return "la semaine prochaine";
  return `dans ${Math.round(n / 7)} semaines`;
}

type Synchro = {
  statut: "EN_COURS" | "SUCCES" | "ECHEC";
  demarreeLe: Date;
  termineeLe: Date | null;
  erreurs: string | null;
};

// La ligne de fraîcheur : elle dit la vérité même quand la dernière synchro a
// échoué, et passe en rouge dès que l'app n'est plus à jour.
function etatSynchro(s: Synchro | null, maintenant: Date): { texte: string; alerte: boolean } {
  if (!s) return { texte: "Jamais synchronisé — configure ton token Scolengo", alerte: true };
  if (s.statut === "EN_COURS") return { texte: "Synchronisation en cours…", alerte: false };
  if (s.statut === "ECHEC")
    return { texte: `Dernière synchro en échec ${ilYa(s.demarreeLe, maintenant)}`, alerte: true };
  const quand = s.termineeLe ?? s.demarreeLe;
  const heures = (maintenant.getTime() - quand.getTime()) / 3_600_000;
  if (heures > 36) return { texte: `Dernière synchro ${ilYa(quand, maintenant)}`, alerte: true };
  return { texte: `Synchronisé ${ilYa(quand, maintenant)}`, alerte: false };
}

export default async function PageTableauDeBord() {
  const session = await auth();
  const utilisateurId = session!.user.id;

  const maintenant = new Date();
  const debutAuj = new Date(maintenant);
  debutAuj.setHours(0, 0, 0, 0);
  const finAuj = new Date(debutAuj);
  finAuj.setDate(finAuj.getDate() + 1);
  const finDemain = new Date(debutAuj);
  finDemain.setDate(finDemain.getDate() + 2);
  const finSemaine = new Date(debutAuj);
  finSemaine.setDate(finSemaine.getDate() + 7);
  const dans48h = new Date(maintenant);
  dans48h.setHours(dans48h.getHours() + 48);

  const [
    utilisateur,
    enRetard,
    enRetardTotal,
    devoirs,
    controles,
    notes,
    derniereSynchro,
    seancesJour,
    seancesDemain,
  ] = await Promise.all([
    prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { fuseauHoraire: true, modeDeveloppeur: true },
    }),
    prisma.devoir.findMany({
      where: { utilisateurId, statut: "A_FAIRE", date: { lt: debutAuj } },
      orderBy: { date: "asc" },
      take: 6,
      include: { matiere: true },
    }),
    prisma.devoir.count({ where: { utilisateurId, statut: "A_FAIRE", date: { lt: debutAuj } } }),
    prisma.devoir.findMany({
      where: { utilisateurId, statut: "A_FAIRE", date: { gte: debutAuj } },
      orderBy: { date: "asc" },
      take: 30,
      include: { matiere: true },
    }),
    prisma.controle.findMany({
      where: { utilisateurId, date: { gte: debutAuj } },
      orderBy: { date: "asc" },
      take: 12,
      include: { matiere: true, chapitres: { include: { chapitre: true } } },
    }),
    prisma.note.findMany({
      where: { utilisateurId },
      select: { noteObtenue: true, noteMaximale: true, coefficient: true },
    }),
    prisma.synchronisation.findFirst({
      where: { utilisateurId },
      orderBy: { demarreeLe: "desc" },
      select: { statut: true, demarreeLe: true, termineeLe: true, erreurs: true },
    }),
    prisma.seanceEmploiDuTemps.findMany({
      where: { utilisateurId, debut: { gte: debutAuj, lt: finAuj } },
      orderBy: { debut: "asc" },
    }),
    prisma.seanceEmploiDuTemps.findMany({
      where: { utilisateurId, debut: { gte: finAuj, lt: finDemain } },
      orderBy: { debut: "asc" },
    }),
  ]);

  const timeZone = utilisateur?.fuseauHoraire || "Europe/Paris";

  const pondere = notes.reduce((a, n) => a + (n.noteObtenue / n.noteMaximale) * 20 * n.coefficient, 0);
  const coeffs = notes.reduce((a, n) => a + n.coefficient, 0);
  const moyenne = coeffs > 0 ? (pondere / coeffs).toFixed(2).replace(".", ",") : null;

  const pourAuj = devoirs.filter((d) => d.date < finAuj);
  const pourDemain = devoirs.filter((d) => d.date >= finAuj && d.date < finDemain);
  const plusTardTous = devoirs.filter((d) => d.date >= finDemain);
  const pourPlusTard = plusTardTous.slice(0, 8);

  const prochainControle = controles[0];
  const controleImminent = prochainControle && prochainControle.date < dans48h;
  const controlesJour = controles.filter((c) => c.date < finAuj);
  const controlesDemain = controles.filter((c) => c.date >= finAuj && c.date < finDemain);
  const controlesSemaine = controles.filter(
    (c) => c.date < finSemaine && c.id !== prochainControle?.id,
  );

  // Les cours d'aujourd'hui deja termines n'ont plus d'interet ; s'il n'en
  // reste aucun, on montre ceux de demain a la place.
  const seancesJourRestantes = seancesJour.filter((s) => s.fin >= maintenant);
  const coursDemain = seancesJourRestantes.length === 0 && seancesDemain.length > 0;
  const seancesAffichees = coursDemain ? seancesDemain : seancesJourRestantes;

  const chapitresAReviser = prochainControle
    ? prochainControle.chapitres.map((c) => c.chapitre.nom).filter(Boolean)
    : [];
  if (chapitresAReviser.length === 0 && prochainControle?.chapitreLibre) {
    chapitresAReviser.push(prochainControle.chapitreLibre);
  }

  // Le stylo rouge est réservé à ce qui est en retard ou dû aujourd'hui. Une
  // seule ligne — la première — passe en grand.
  const idAccent = (enRetard[0] ?? pourAuj[0])?.id;

  const sync = etatSynchro(derniereSynchro, maintenant);

  const dateAuj = dateLongue(maintenant);
  const jourCourt = maintenant.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  const moisCourt = maintenant.toLocaleDateString("fr-FR", { month: "long" });
  const numJour = maintenant.getDate();

  // Rattache à chaque cours affiché l'échéance du même jour qui « tombe »
  // pendant lui (aujourd'hui, ou demain si on affiche les cours de demain).
  const controlesEcheance = coursDemain ? controlesDemain : controlesJour;
  const devoirsEcheance = coursDemain ? pourDemain : pourAuj;
  function echeanceDe(matiereCours: string) {
    const c = controlesEcheance.find((x) => memeMatiere(matiereCours, x.matiere.nom));
    if (c) return { href: `/controles?focus=${c.id}`, marque: { lettre: "C" as const, couleur: "rouge" as const } };
    const d = devoirsEcheance.find((x) => memeMatiere(matiereCours, x.matiere.nom));
    if (d) return { href: `/devoirs?focus=${d.id}`, marque: { lettre: "T" as const, couleur: "rouge" as const } };
    return null;
  }

  return (
    <div className="relative flex flex-col gap-[var(--carreau)]">
      {/* La date : en ligne sur mobile, empilée dans la marge sur desktop. */}
      <div className="flex items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="font-display text-[1.85rem] leading-[calc(var(--carreau)*2)] text-ink first-letter:uppercase sm:sr-only">
          {dateAuj}
        </h1>
        {moyenne ? (
          <Link
            href="/notes"
            aria-label={`Moyenne générale : ${moyenne} sur 20`}
            className="shrink-0 font-body text-sm text-ink-soft hover:text-ink-blue"
          >
            <span aria-hidden>
              moyenne <span className="tabulaire font-bold text-ink">{moyenne}</span>
              <span className="text-ink-soft">/20</span>
            </span>
          </Link>
        ) : null}
      </div>
      <div
        aria-hidden
        className="pointer-events-none hidden sm:absolute sm:right-full sm:top-0 sm:mr-[calc(var(--carreau)+0.3rem)] sm:flex sm:w-[var(--marge)] sm:flex-col sm:items-end sm:text-right sm:leading-tight"
      >
        <span className="font-body text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">
          {jourCourt}
        </span>
        <span className="font-display text-[1.85rem] leading-none text-ink">{numJour}</span>
        <span className="font-body text-xs text-ink-soft">{moisCourt}</span>
      </div>

      <Link
        href="/parametres"
        className={
          "-mt-[calc(var(--carreau)*0.5)] font-body text-xs hover:text-ink-blue " +
          (sync.alerte ? "font-bold text-bic-red" : "text-ink-soft/80")
        }
      >
        {sync.texte}
      </Link>

      {/* Le detail de l'erreur n'a de sens que pour quelqu'un qui debug : on
          le reserve au mode developpeur pour ne pas polluer l'accueil. */}
      {utilisateur?.modeDeveloppeur && derniereSynchro?.statut === "ECHEC" && derniereSynchro.erreurs && (
        <p className="-mt-[calc(var(--carreau)*0.5)] whitespace-pre-wrap font-mono text-xs text-bic-red/80">
          {derniereSynchro.erreurs}
        </p>
      )}

      {enRetard.length > 0 && (
        <section className="flex flex-col">
          <h2 className={titreSection + " mb-1 flex items-baseline gap-2 text-bic-red"}>
            En retard <span className="tabulaire text-bic-red/70">· {enRetardTotal}</span>
            {enRetardTotal > enRetard.length && (
              <Link href="/devoirs" className="font-body text-xs font-bold text-bic-red underline decoration-1 underline-offset-2">
                voir tout
              </Link>
            )}
          </h2>
          <ul className="flex flex-col">
            {enRetard.map((d) => (
              <LigneObligation
                key={d.id}
                matiere={d.matiere.nom}
                intitule={d.titre}
                date={dateCourte(d.date)}
                href={`/devoirs?focus=${d.id}`}
                urgent
                accent={d.id === idAccent}
                devoir={{ id: d.id, coche: false }}
                retour="/"
              />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col">
        <h2 className={titreSection + " mb-1"}>Pour aujourd&apos;hui</h2>
        {pourAuj.length === 0 ? (
          <p className="leading-[var(--carreau)] text-ink-soft">Rien à rendre aujourd&apos;hui.</p>
        ) : (
          <ul className="flex flex-col">
            {pourAuj.map((d) => (
              <LigneObligation
                key={d.id}
                matiere={d.matiere.nom}
                intitule={d.titre}
                href={`/devoirs?focus=${d.id}`}
                urgent
                accent={d.id === idAccent}
                devoir={{ id: d.id, coche: false }}
                retour="/"
              />
            ))}
          </ul>
        )}
      </section>

      {seancesAffichees.length > 0 && (
        <section className="flex flex-col">
          <h2 className={titreSection + " mb-1"}>{coursDemain ? "Cours de demain" : "Cours du jour"}</h2>
          <ul className="flex flex-col">
            {seancesAffichees.map((s) => {
              const e = s.annule ? null : echeanceDe(s.matiere);
              return (
                <LigneSeance
                  key={s.id}
                  heure={partiesFuseau(s.debut, timeZone).label}
                  matiere={s.matiere}
                  salle={s.salle}
                  annule={s.annule}
                  marque={e?.marque}
                  href={e?.href}
                />
              );
            })}
          </ul>
        </section>
      )}

      {(pourDemain.length > 0 || pourPlusTard.length > 0) && (
        <div className="flex flex-col gap-[calc(var(--carreau)*0.5)]">
          {pourDemain.length > 0 && (
            <section className="flex flex-col">
              <h2 className={titreSection + " mb-1 text-ink-blue/70"}>Demain</h2>
              <ul className="flex flex-col">
                {pourDemain.map((d) => (
                  <LigneObligation
                    key={d.id}
                    matiere={d.matiere.nom}
                    intitule={d.titre}
                    href={`/devoirs?focus=${d.id}`}
                    attenue
                    devoir={{ id: d.id, coche: false }}
                    retour="/"
                  />
                ))}
              </ul>
            </section>
          )}

          {pourPlusTard.length > 0 && (
            <section className="flex flex-col">
              <h2 className={titreSection + " mb-1 flex items-baseline gap-2 text-ink-blue/70"}>
                Cette semaine et après
                {plusTardTous.length > pourPlusTard.length && (
                  <Link
                    href="/devoirs"
                    className="font-body text-xs font-bold text-ink-blue underline decoration-1 underline-offset-2"
                  >
                    voir tout ({plusTardTous.length})
                  </Link>
                )}
              </h2>
              <ul className="flex flex-col">
                {pourPlusTard.map((d) => (
                  <LigneObligation
                    key={d.id}
                    matiere={d.matiere.nom}
                    intitule={d.titre}
                    date={dateCourte(d.date)}
                    href={`/devoirs?focus=${d.id}`}
                    attenue
                    devoir={{ id: d.id, coche: false }}
                    retour="/"
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <div>
        {prochainControle ? (
          <SlipControle
            matiere={prochainControle.matiere.nom}
            intitule={prochainControle.chapitreLibre ?? ""}
            dateLabel={dateLongue(prochainControle.date)}
            dansLabel={dansLabel(jours(debutAuj, prochainControle.date))}
            imminent={!!controleImminent}
            chapitres={chapitresAReviser}
            href={`/controles?focus=${prochainControle.id}`}
          />
        ) : (
          <p className="font-body text-sm text-ink-soft">Aucun contrôle en vue.</p>
        )}
      </div>

      {controlesSemaine.length > 0 && (
        <section className="flex flex-col">
          <h2 className={titreSection + " mb-1 text-ink-blue/70"}>Autres contrôles cette semaine</h2>
          <ul className="flex flex-col">
            {controlesSemaine.map((c) => (
              <LigneObligation
                key={c.id}
                matiere={c.matiere.nom}
                intitule={c.chapitreLibre ?? "Contrôle"}
                date={dateCourte(c.date)}
                href={`/controles?focus=${c.id}`}
                attenue
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
