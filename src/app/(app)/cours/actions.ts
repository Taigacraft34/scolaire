"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { trouverOuCreerMatiere } from "@/lib/matieres";
import { trouverOuCreerChapitre } from "@/lib/chapitres";
import { enregistrerFichier, supprimerFichier } from "@/lib/stockage";
import { nettoyerHtml } from "@/lib/html";

export async function creerMatiere(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) redirect(`/cours?erreur=${encodeURIComponent("Le nom de la matiere est requis.")}`);

  const matiere = await trouverOuCreerMatiere(session.user.id, nom);
  redirect(`/cours/${matiere.id}`);
}

export async function creerChapitre(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const matiereId = String(formData.get("matiereId") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();

  const matiere = await prisma.matiere.findFirst({ where: { id: matiereId, utilisateurId: session.user.id } });
  if (!matiere) redirect("/cours");
  if (!nom) redirect(`/cours/${matiereId}?erreur=${encodeURIComponent("Le nom du chapitre est requis.")}`);

  const chapitre = await trouverOuCreerChapitre(session.user.id, matiere.id, nom);
  revalidatePath(`/cours/${matiereId}`);
  redirect(`/cours/${matiereId}/${chapitre.id}`);
}

export async function supprimerChapitre(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const chapitreId = String(formData.get("chapitreId") ?? "").trim();
  const matiereId = String(formData.get("matiereId") ?? "").trim();
  if (!chapitreId) redirect("/cours");

  const documents = await prisma.document.findMany({
    where: { blocCours: { chapitreId }, utilisateurId: session.user.id },
  });

  await prisma.chapitre.deleteMany({ where: { id: chapitreId, utilisateurId: session.user.id } });

  await Promise.all(documents.map((d) => supprimerFichier(d.cheminStockage)));

  revalidatePath(`/cours/${matiereId}`);
  redirect(`/cours/${matiereId}`);
}

export async function enregistrerContenuChapitre(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const chapitreId = String(formData.get("chapitreId") ?? "").trim();
  const matiereId = String(formData.get("matiereId") ?? "").trim();

  const chapitre = await prisma.chapitre.findFirst({
    where: { id: chapitreId, utilisateurId: session.user.id },
  });
  if (!chapitre) redirect("/cours");

  const anciensBlocs = await prisma.blocCours.findMany({
    where: { chapitreId },
    include: { document: true },
  });
  const anciensDocumentsParId = new Map(
    anciensBlocs.filter((b) => b.document).map((b) => [b.document!.id, b.document!]),
  );

  const typesBloc = formData.getAll("blocType").map((v) => String(v));
  const textesBloc = formData.getAll("blocTexteHtml").map((v) => String(v));
  const fichiersExistantsBloc = formData.getAll("blocFichierExistantId").map((v) => String(v));
  const fichiersBloc = formData.getAll("blocFichier").filter((f): f is File => f instanceof File);

  let indexTexte = 0;
  let indexFichier = 0;
  let ordre = 0;
  const documentsConserves = new Set<string>();
  const nouveauxBlocs: {
    type: "TEXTE" | "FICHIER";
    ordre: number;
    contenuHtml?: string;
    documentId?: string;
  }[] = [];

  for (const type of typesBloc) {
    if (type === "texte") {
      const contenuHtml = nettoyerHtml((textesBloc[indexTexte] ?? "").trim());
      indexTexte++;
      if (!contenuHtml) continue;
      nouveauxBlocs.push({ type: "TEXTE", ordre, contenuHtml });
      ordre++;
    } else if (type === "fichier") {
      const existantId = fichiersExistantsBloc[indexFichier] || null;
      const nouveauFichier = fichiersBloc[indexFichier];
      indexFichier++;

      if (nouveauFichier && nouveauFichier.size > 0) {
        const meta = await enregistrerFichier(nouveauFichier, session.user.id);
        const document = await prisma.document.create({
          data: { utilisateurId: session.user.id, ...meta },
        });
        nouveauxBlocs.push({ type: "FICHIER", ordre, documentId: document.id });
        ordre++;
      } else if (existantId && anciensDocumentsParId.has(existantId)) {
        documentsConserves.add(existantId);
        nouveauxBlocs.push({ type: "FICHIER", ordre, documentId: existantId });
        ordre++;
      }
    }
  }

  // Supprime les anciens blocs puis les documents qui ne sont plus references.
  await prisma.blocCours.deleteMany({ where: { chapitreId } });

  const documentsASupprimer = [...anciensDocumentsParId.values()].filter(
    (d) => !documentsConserves.has(d.id),
  );
  if (documentsASupprimer.length > 0) {
    await prisma.document.deleteMany({ where: { id: { in: documentsASupprimer.map((d) => d.id) } } });
    await Promise.all(documentsASupprimer.map((d) => supprimerFichier(d.cheminStockage)));
  }

  for (const bloc of nouveauxBlocs) {
    await prisma.blocCours.create({
      data: {
        chapitreId,
        type: bloc.type,
        ordre: bloc.ordre,
        contenuHtml: bloc.contenuHtml,
        documentId: bloc.documentId,
      },
    });
  }

  await prisma.journal.create({
    data: {
      utilisateurId: session.user.id,
      action: "MODIFICATION",
      entiteType: "Chapitre",
      entiteId: chapitreId,
      metadonnees: { nombreBlocs: nouveauxBlocs.length },
    },
  });

  revalidatePath(`/cours/${matiereId}/${chapitreId}`);
  redirect(`/cours/${matiereId}/${chapitreId}`);
}
