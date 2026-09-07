import Link from "next/link";
import type { Devoir, Matiere } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LIBELLES_STATUT_DEVOIR } from "@/lib/libelles";
import { nettoyerHtml } from "@/lib/html";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { ChampsDevoir } from "@/components/ChampsDevoir";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { BoutonSoumission } from "@/components/BoutonSoumission";
import { MiseEnAvantRecherche } from "@/components/MiseEnAvantRecherche";
import { basculerStatutDevoir, creerDevoirManuel, supprimerDevoir } from "./actions";

type DevoirAvecMatiere = Devoir & { matiere: Matiere };

function LigneDevoir({ devoir }: { devoir: DevoirAvecMatiere }) {
  return (
    <li id={`element-${devoir.id}`} className="flex flex-col gap-2 p-3 text-sm">
      <details>
        <summary className="cursor-pointer list-none marker:hidden">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">
            {devoir.matiere.nom} — {devoir.titre}
          </p>
          <p className="text-xs text-zinc-500">{LIBELLES_STATUT_DEVOIR[devoir.statut]}</p>
        </summary>
        {devoir.description ? (
          <div
            className="mt-2 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400"
            dangerouslySetInnerHTML={{ __html: nettoyerHtml(devoir.description) }}
          />
        ) : (
          <p className="mt-2 text-xs text-zinc-500">Aucune description.</p>
        )}
      </details>
      <div className="flex items-center justify-between">
        <span className="whitespace-nowrap text-xs text-zinc-500">
          {devoir.date.toLocaleDateString("fr-FR")}
        </span>
        <div className="flex items-center gap-3">
          <form action={basculerStatutDevoir}>
            <input type="hidden" name="devoirId" value={devoir.id} />
            <BoutonSoumission
              texteChargement="…"
              className={
                devoir.statut === "TERMINE"
                  ? "rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  : "rounded-full bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
              }
            >
              {devoir.statut === "TERMINE" ? "Marquer non fait" : "Marquer termine"}
            </BoutonSoumission>
          </form>
          <form action={supprimerDevoir}>
            <input type="hidden" name="devoirId" value={devoir.id} />
            <BoutonSupprimer confirmation="Supprimer definitivement ce devoir ?" />
          </form>
        </div>
      </div>
    </li>
  );
}

function GroupeDevoirs({ titre, devoirs }: { titre: string; devoirs: DevoirAvecMatiere[] }) {
  if (devoirs.length === 0) return null;
  return (
    <section className="rounded-lg border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="border-b border-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-900 dark:text-zinc-300">
        {titre} ({devoirs.length})
      </h2>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {devoirs.map((devoir) => (
          <LigneDevoir key={devoir.id} devoir={devoir} />
        ))}
      </ul>
    </section>
  );
}

export default async function PageDevoirs({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; passes?: string; focus?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { erreur, passes, focus } = await searchParams;

  // Bornes de dates (heure locale du serveur). Un devoir "passe" est un devoir
  // dont la date de rendu est anterieure a aujourd'hui : ceux du jour meme
  // restent visibles.
  const debutAujourdhui = new Date();
  debutAujourdhui.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(debutAujourdhui);
  finAujourdhui.setDate(finAujourdhui.getDate() + 1);
  const finDemain = new Date(debutAujourdhui);
  finDemain.setDate(finDemain.getDate() + 2);

  // Si on arrive sur un devoir passe depuis la recherche, on deplie
  // automatiquement la liste des devoirs passes pour qu'il soit visible.
  const devoirFocus = focus
    ? await prisma.devoir.findFirst({
        where: { id: focus, utilisateurId },
        select: { date: true },
      })
    : null;
  const afficherPasses = passes === "1" || (devoirFocus ? devoirFocus.date < debutAujourdhui : false);

  const [
    utilisateur,
    devoirsAVenir,
    devoirsPassesCount,
    devoirsPasses,
    derniereSynchro,
    matieres,
    seances,
  ] = await Promise.all([
      prisma.utilisateur.findUnique({ where: { id: utilisateurId }, select: { modeDeveloppeur: true } }),
      prisma.devoir.findMany({
        where: { utilisateurId, date: { gte: debutAujourdhui } },
        include: { matiere: true },
        orderBy: { date: "asc" },
        take: 200,
      }),
      prisma.devoir.count({ where: { utilisateurId, date: { lt: debutAujourdhui } } }),
      afficherPasses
        ? prisma.devoir.findMany({
            where: { utilisateurId, date: { lt: debutAujourdhui } },
            include: { matiere: true },
            orderBy: { date: "desc" },
            take: 200,
          })
        : Promise.resolve([] as DevoirAvecMatiere[]),
      prisma.synchronisation.findFirst({ where: { utilisateurId }, orderBy: { demarreeLe: "desc" } }),
      prisma.matiere.findMany({ where: { utilisateurId }, orderBy: { nom: "asc" } }),
      prisma.seanceEmploiDuTemps.findMany({
        where: { utilisateurId, annule: false, debut: { gte: debutAujourdhui } },
        select: { debut: true, matiere: true },
        orderBy: { debut: "asc" },
        take: 500,
      }),
    ]);

  const modeDeveloppeur = utilisateur?.modeDeveloppeur ?? false;

  const pourAujourdhui = devoirsAVenir.filter((d) => d.date < finAujourdhui);
  const pourDemain = devoirsAVenir.filter((d) => d.date >= finAujourdhui && d.date < finDemain);
  const pourPlusTard = devoirsAVenir.filter((d) => d.date >= finDemain);

  const aucunAVenir = devoirsAVenir.length === 0;
  const aucunDevoir = aucunAVenir && devoirsPassesCount === 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Devoirs</h1>

      <MiseEnAvantRecherche focusId={focus} />

      {modeDeveloppeur && <FormulaireSynchronisation derniereSynchro={derniereSynchro} />}

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ajouter un devoir</h2>
        {erreur && <p className="mb-3 text-sm text-red-500">{erreur}</p>}
        <form action={creerDevoirManuel} className="flex flex-col gap-3">
          <ChampsDevoir matieres={matieres.map((m) => m.nom)} seances={seances} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Ajouter
          </button>
        </form>
      </section>

      {aucunDevoir ? (
        <div className="rounded-lg border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <p className="p-4 text-sm text-zinc-500">
            Aucun devoir. Configurez votre token Scolengo dans les{" "}
            <a href="/parametres" className="underline">
              parametres
            </a>{" "}
            puis lancez une synchronisation, ou ajoutez-en un manuellement ci-dessus.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {aucunAVenir ? (
            <p className="text-sm text-zinc-500">Aucun devoir a venir.</p>
          ) : (
            <>
              <GroupeDevoirs titre="Pour aujourd'hui" devoirs={pourAujourdhui} />
              <GroupeDevoirs titre="Pour demain" devoirs={pourDemain} />
              <GroupeDevoirs titre="Pour plus tard" devoirs={pourPlusTard} />
            </>
          )}

          {afficherPasses && (
            <GroupeDevoirs titre="Devoirs passes" devoirs={devoirsPasses} />
          )}

          {devoirsPassesCount > 0 && (
            <Link
              href={afficherPasses ? "/devoirs" : "/devoirs?passes=1"}
              className="self-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {afficherPasses
                ? "Masquer les devoirs passes"
                : `Voir les devoirs passes (${devoirsPassesCount})`}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
