"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enregistrerFichier, supprimerFichier } from "@/lib/stockage";

export async function ajouterCopie(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const noteId = String(formData.get("noteId") ?? "").trim();
  const commentaire = String(formData.get("commentaire") ?? "").trim() || null;

  const note = await prisma.note.findFirst({ where: { id: noteId, utilisateurId: session.user.id } });
  if (!note) redirect("/notes");

  const fichiers = formData.getAll("fichiers").filter((f): f is File => f instanceof File && f.size > 0);
  if (fichiers.length === 0) redirect(`/notes?erreur=${encodeURIComponent("Choisissez au moins un fichier.")}`);

  const copie = await prisma.copie.create({ data: { noteId: note.id, commentaire } });

  for (const fichier of fichiers) {
    const meta = await enregistrerFichier(fichier, session.user.id);
    await prisma.document.create({
      data: { utilisateurId: session.user.id, copieId: copie.id, ...meta },
    });
  }

  revalidatePath("/notes");
  redirect("/notes");
}

export async function supprimerCopie(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const copieId = String(formData.get("copieId") ?? "").trim();
  if (!copieId) redirect("/notes");

  const copie = await prisma.copie.findFirst({
    where: { id: copieId, note: { utilisateurId: session.user.id } },
    include: { documents: true },
  });
  if (!copie) redirect("/notes");

  await prisma.copie.delete({ where: { id: copie.id } });
  await Promise.all(copie.documents.map((d) => supprimerFichier(d.cheminStockage)));

  revalidatePath("/notes");
  redirect("/notes");
}
