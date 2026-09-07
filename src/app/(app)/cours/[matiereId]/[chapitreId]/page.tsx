import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApercuDocument } from "@/components/ApercuDocument";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/cours/${matiereId}`} className="text-xs text-zinc-500 underline">
            ← {chapitre.matiere.nom}
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{chapitre.nom}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/cours/${matiereId}/${chapitreId}/modifier`}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Modifier
          </Link>
          <form action={supprimerChapitre}>
            <input type="hidden" name="chapitreId" value={chapitre.id} />
            <input type="hidden" name="matiereId" value={matiereId} />
            <BoutonSupprimer confirmation={`Supprimer définitivement le chapitre "${chapitre.nom}" ?`} />
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        {chapitre.blocs.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Ce chapitre est vide.
          </p>
        ) : (
          chapitre.blocs.map((bloc) =>
            bloc.type === "TEXTE" ? (
              <div
                key={bloc.id}
                className="text-sm text-zinc-700 dark:text-zinc-300"
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
