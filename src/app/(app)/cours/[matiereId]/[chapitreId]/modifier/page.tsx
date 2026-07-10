import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EditeurBlocsCours, type BlocInitial } from "@/components/EditeurBlocsCours";
import { enregistrerContenuChapitre } from "../../../actions";

export default async function PageModifierChapitre({
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

  const blocsInitiaux: BlocInitial[] = chapitre.blocs.map((bloc) => ({
    type: bloc.type === "TEXTE" ? "texte" : "fichier",
    contenuHtml: bloc.contenuHtml ?? undefined,
    document: bloc.document
      ? { id: bloc.document.id, nomFichier: bloc.document.nomFichier, typeMime: bloc.document.typeMime }
      : undefined,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/cours/${matiereId}/${chapitreId}`} className="text-xs text-zinc-500 underline">
          ← {chapitre.nom}
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Modifier : {chapitre.nom}
        </h1>
      </div>

      <form
        action={enregistrerContenuChapitre}
        className="flex flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <input type="hidden" name="chapitreId" value={chapitre.id} />
        <input type="hidden" name="matiereId" value={matiereId} />

        <EditeurBlocsCours blocsInitiaux={blocsInitiaux} />

        <button
          type="submit"
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
