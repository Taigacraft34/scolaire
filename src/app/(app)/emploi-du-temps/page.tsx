import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ajouterJours, debutSemaine } from "@/lib/calendrier";
import { JOURS_ORDRE, LIBELLES_JOUR, heureLocale, indexJourSemaine } from "@/lib/emploiDuTemps";

function formatDateParam(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
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
    select: { scolengoTokenChiffre: true },
  });

  const semaineBase = semaineParam ? new Date(semaineParam) : new Date();
  const lundiAffiche = debutSemaine(Number.isNaN(semaineBase.getTime()) ? new Date() : semaineBase);
  const dimancheAffiche = ajouterJours(lundiAffiche, 6);
  const finSemaine = ajouterJours(lundiAffiche, 7);

  const seances = await prisma.seanceEmploiDuTemps.findMany({
    where: { utilisateurId, debut: { gte: lundiAffiche, lt: finSemaine } },
    orderBy: { debut: "asc" },
  });

  const derniereSynchro = await prisma.synchronisation.findFirst({
    where: { utilisateurId },
    orderBy: { demarreeLe: "desc" },
  });

  function lienSemaine(delta: number): string {
    return `/emploi-du-temps?semaine=${formatDateParam(ajouterJours(lundiAffiche, delta * 7))}`;
  }

  const joursAffiches = JOURS_ORDRE.map((jour, index) => {
    const date = ajouterJours(lundiAffiche, index);
    const seancesJour = seances.filter((s) => indexJourSemaine(s.debut) === index);
    return { jour, date, seances: seancesJour };
  });

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
          {dimancheAffiche.toLocaleDateString("fr-FR")}
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
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-300 bg-zinc-200 sm:grid-cols-7 dark:border-zinc-800 dark:bg-zinc-800">
          {joursAffiches.map(({ jour, date, seances: seancesJour }) => (
            <div key={jour} className="min-h-32 bg-white p-2 dark:bg-zinc-950">
              <p className="mb-1 text-xs font-medium text-zinc-500">
                {LIBELLES_JOUR[jour]} {date.getDate()}/{date.getMonth() + 1}
              </p>
              <div className="flex flex-col gap-1">
                {seancesJour.length === 0 ? (
                  <p className="text-xs text-zinc-400">—</p>
                ) : (
                  seancesJour.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded border-l-2 bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800 ${
                        s.annule
                          ? "border-red-400 text-zinc-400 line-through dark:text-zinc-500"
                          : "border-blue-400 text-zinc-700 dark:text-zinc-300"
                      }`}
                      style={s.couleur && !s.annule ? { borderLeftColor: s.couleur } : undefined}
                    >
                      <p className="font-medium">
                        {heureLocale(s.debut)}–{heureLocale(s.fin)} {s.matiere}
                      </p>
                      {(s.enseignant || s.salle) && (
                        <p className="text-zinc-500">
                          {[s.enseignant, s.salle].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
