import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EditeurBlocsCours, type BlocInitial } from "@/components/EditeurBlocsCours";
import { IconeFlecheGauche } from "@/components/Icone";
import { boutonPrincipal, titrePage } from "@/lib/ui";
import { enregistrerContenuChapitre } from "../../../actions";
import { BoutonSoumission } from "@/components/BoutonSoumission";

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
    <div className="flex flex-col gap-[var(--carreau)]">
      <div>
        <Link
          href={`/cours/${matiereId}/${chapitreId}`}
          className="inline-flex items-center gap-1 font-body text-xs font-bold text-ink-soft hover:text-ink-blue"
        >
          <IconeFlecheGauche /> {chapitre.nom}
        </Link>
        <h1 className={titrePage}>Modifier : {chapitre.nom}</h1>
      </div>

      <form action={enregistrerContenuChapitre} className="flex flex-col gap-4">
        <input type="hidden" name="chapitreId" value={chapitre.id} />
        <input type="hidden" name="matiereId" value={matiereId} />

        <EditeurBlocsCours blocsInitiaux={blocsInitiaux} />

        <BoutonSoumission texteChargement="Enregistrement…" className={boutonPrincipal + " self-start"}>
          Enregistrer
        </BoutonSoumission>
      </form>
    </div>
  );
}
