import Link from "next/link";
import type { Devoir, Matiere } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { nettoyerHtml } from "@/lib/html";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { ChampsDevoir } from "@/components/ChampsDevoir";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { CaseCoche } from "@/components/CaseCoche";
import { MiseEnAvantRecherche } from "@/components/MiseEnAvantRecherche";
import { IconeChevronBas } from "@/components/Icone";
import { boutonPrincipal, boutonSecondaire, champ, encart, label, titrePage, titreSection } from "@/lib/ui";
import { creerDevoirManuel, supprimerDevoir } from "./actions";

type DevoirAvecMatiere = Devoir & { matiere: Matiere };

function LigneDevoir({ devoir, urgent }: { devoir: DevoirAvecMatiere; urgent?: boolean }) {
  const fait = devoir.statut === "TERMINE";
  return (
    <li id={`element-${devoir.id}`} className="relative">
      <details className="group">
        <summary className="flex min-h-[var(--carreau)] cursor-pointer list-none items-baseline gap-2 leading-[var(--carreau)] marker:hidden">
          <span className="absolute right-full top-[0.15rem] mr-2.5">
            <CaseCoche coche={fait} devoirId={devoir.id} retour="/devoirs" />
          </span>
          <span
            className={
              "min-w-0 flex-1 truncate " +
              (fait
                ? "text-ink-soft line-through decoration-bic-green"
                : urgent
                  ? "font-bold text-bic-red"
                  : "text-ink")
            }
          >
            <span
              className={
                "mr-2 font-body text-[0.72rem] font-bold uppercase tracking-wide " +
                (urgent && !fait ? "text-bic-red" : "text-ink-blue")
              }
            >
              {devoir.matiere.nom}
            </span>
            {devoir.titre}
          </span>
          <span className="tabulaire shrink-0 font-mono text-xs text-ink-soft">
            {devoir.date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
          </span>
          <IconeChevronBas className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
        </summary>
        <div className="pb-[calc(var(--carreau)*0.5)] pl-1 pt-1">
          {devoir.description ? (
            <div
              className="whitespace-pre-wrap font-body text-sm leading-[var(--carreau)] text-ink-soft [&_a]:text-ink-blue [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: nettoyerHtml(devoir.description) }}
            />
          ) : (
            <p className="font-body text-sm leading-[var(--carreau)] text-ink-soft">Aucune description.</p>
          )}
          <form action={supprimerDevoir} className="mt-1">
            <input type="hidden" name="devoirId" value={devoir.id} />
            <BoutonSupprimer confirmation="Supprimer définitivement ce devoir ?" />
          </form>
        </div>
      </details>
    </li>
  );
}

function GroupeDevoirs({
  titre,
  devoirs,
  idUrgent,
}: {
  titre: string;
  devoirs: DevoirAvecMatiere[];
  idUrgent?: string;
}) {
  if (devoirs.length === 0) return null;
  return (
    <section className="flex flex-col">
      <h2 className={titreSection + " mb-1"}>
        {titre} <span className="tabulaire text-ink-soft/70">· {devoirs.length}</span>
      </h2>
      <ul className="flex flex-col">
        {devoirs.map((devoir) => (
          <LigneDevoir key={devoir.id} devoir={devoir} urgent={devoir.id === idUrgent} />
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

  const debutAujourdhui = new Date();
  debutAujourdhui.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(debutAujourdhui);
  finAujourdhui.setDate(finAujourdhui.getDate() + 1);
  const finDemain = new Date(debutAujourdhui);
  finDemain.setDate(finDemain.getDate() + 2);

  const devoirFocus = focus
    ? await prisma.devoir.findFirst({ where: { id: focus, utilisateurId }, select: { date: true } })
    : null;
  const afficherPasses = passes === "1" || (devoirFocus ? devoirFocus.date < debutAujourdhui : false);

  const [utilisateur, devoirsAVenir, devoirsPassesCount, devoirsPasses, derniereSynchro, matieres, seances] =
    await Promise.all([
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
  const idUrgent = (pourAujourdhui[0] ?? pourDemain[0])?.id;

  const aucunAVenir = devoirsAVenir.length === 0;
  const aucunDevoir = aucunAVenir && devoirsPassesCount === 0;

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <h1 className={titrePage}>Devoirs</h1>

      <MiseEnAvantRecherche focusId={focus} />

      {modeDeveloppeur && <FormulaireSynchronisation derniereSynchro={derniereSynchro} />}

      <section className={encart}>
        <h2 className={titreSection + " mb-2"}>Ajouter un devoir</h2>
        {erreur && <p className="mb-2 font-body text-sm text-bic-red">{erreur}</p>}
        <form action={creerDevoirManuel} className="flex flex-col gap-3">
          <ChampsDevoir matieres={matieres.map((m) => m.nom)} seances={seances} />
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="description">
              Description
            </label>
            <textarea id="description" name="description" rows={2} className={champ} />
          </div>
          <button type="submit" className={boutonPrincipal + " self-start"}>
            Ajouter
          </button>
        </form>
      </section>

      {aucunDevoir ? (
        <p className="font-body leading-[var(--carreau)] text-ink-soft">
          Aucun devoir. Configure ton token Scolengo dans les{" "}
          <Link href="/parametres" className="text-ink-blue underline underline-offset-2">
            paramètres
          </Link>{" "}
          puis lance une synchronisation, ou ajoutes-en un ci-dessus.
        </p>
      ) : (
        <div className="flex flex-col gap-[var(--carreau)]">
          {aucunAVenir ? (
            <p className="font-body leading-[var(--carreau)] text-ink-soft">Aucun devoir à venir.</p>
          ) : (
            <>
              <GroupeDevoirs titre="Pour aujourd'hui" devoirs={pourAujourdhui} idUrgent={idUrgent} />
              <GroupeDevoirs titre="Pour demain" devoirs={pourDemain} idUrgent={idUrgent} />
              <GroupeDevoirs titre="Pour plus tard" devoirs={pourPlusTard} />
            </>
          )}

          {afficherPasses && <GroupeDevoirs titre="Devoirs passés" devoirs={devoirsPasses} />}

          {devoirsPassesCount > 0 && (
            <Link
              href={afficherPasses ? "/devoirs" : "/devoirs?passes=1"}
              className={boutonSecondaire + " self-start"}
            >
              {afficherPasses
                ? "Masquer les devoirs passés"
                : `Voir les devoirs passés (${devoirsPassesCount})`}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
