import Link from "next/link";
import type { Devoir, Matiere } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { nettoyerHtml } from "@/lib/html";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { ChampsDevoir } from "@/components/ChampsDevoir";
import { LigneDevoir, type DevoirLigne } from "@/components/LigneDevoir";
import { MiseEnAvantRecherche } from "@/components/MiseEnAvantRecherche";
import { dateCourte } from "@/lib/dates";
import { boutonPrincipal, boutonSecondaire, champ, encart, label, titrePage, titreSection } from "@/lib/ui";
import { creerDevoirManuel } from "./actions";

type DevoirAvecMatiere = Devoir & { matiere: Matiere };

function enLigne(devoir: DevoirAvecMatiere): DevoirLigne {
  return {
    id: devoir.id,
    titre: devoir.titre,
    fait: devoir.statut === "TERMINE",
    descriptionHtml: devoir.description ? nettoyerHtml(devoir.description) : null,
    matiere: devoir.matiere.nom,
    dateLabel: dateCourte(devoir.date),
  };
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
          <LigneDevoir key={devoir.id} devoir={enLigne(devoir)} urgent={devoir.id === idUrgent} />
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
