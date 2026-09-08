import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApercuDocument } from "@/components/ApercuDocument";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { IconeFlecheGauche } from "@/components/Icone";
import { boutonPrincipal, titrePage } from "@/lib/ui";
import { nettoyerHtml } from "@/lib/html";
import { supprimerChapitre } from "../../actions";

export default async function PageChapitre({
  params,
}: {
  params: Promise<{ matiereId: string; chapitreId: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { matiereId, chapitreId } = await params;

  const chapitre = await prisma.chapitre.findFirst({
    where: { id: chapitreId, matiereId, utilisateurId },
    include: {
      matiere: true,
      blocs: { include: { document: true }, orderBy: { ordre: "asc" } },
    },
  });
  if (!chapitre) notFound();

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/cours/${matiereId}`}
            className="inline-flex items-center gap-1 font-body text-xs font-bold text-ink-soft hover:text-ink-blue"
          >
            <IconeFlecheGauche /> {chapitre.matiere.nom}
          </Link>
          <h1 className={titrePage}>{chapitre.nom}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/cours/${matiereId}/${chapitreId}/modifier`} className={boutonPrincipal}>
            Modifier
          </Link>
          <form action={supprimerChapitre}>
            <input type="hidden" name="chapitreId" value={chapitre.id} />
            <input type="hidden" name="matiereId" value={matiereId} />
            <BoutonSupprimer
              libelle="Supprimer le chapitre"
              invite={`Supprimer « ${chapitre.nom} » ?`}
            />
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-[var(--carreau)]">
        {chapitre.blocs.length === 0 ? (
          <p className="font-body leading-[var(--carreau)] text-ink-soft">Ce chapitre est vide.</p>
        ) : (
          chapitre.blocs.map((bloc) =>
            bloc.type === "TEXTE" ? (
              <div
                key={bloc.id}
                className="font-body text-[0.95rem] leading-[var(--carreau)] text-ink [&_a]:text-ink-blue [&_a]:underline [&_a]:underline-offset-2"
                dangerouslySetInnerHTML={{ __html: nettoyerHtml(bloc.contenuHtml ?? "") }}
              />
            ) : bloc.document ? (
              <ApercuDocument key={bloc.id} document={bloc.document} />
            ) : null,
          )
        )}
      </div>
    </div>
  );
}
