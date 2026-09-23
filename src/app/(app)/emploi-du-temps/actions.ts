"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cheminInterne } from "@/lib/redirection";

function retourValide(formData: FormData): string {
  return cheminInterne(formData.get("retour"), "/emploi-du-temps");
}

// Note personnelle sur une seance : n'est jamais touchee par la synchronisation
// et s'efface d'elle-meme dans l'affichage des qu'un contenu MBN existe.
export async function enregistrerActiviteSeance(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const seanceId = String(formData.get("seanceId") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();
  const retour = retourValide(formData);
  if (!seanceId) redirect(retour);

  await prisma.seanceEmploiDuTemps.updateMany({
    where: { id: seanceId, utilisateurId: session.user.id },
    data: { contenuManuel: contenu || null },
  });

  revalidatePath("/emploi-du-temps");
  redirect(retour);
}

export async function supprimerActiviteSeance(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const seanceId = String(formData.get("seanceId") ?? "").trim();
  const retour = retourValide(formData);
  if (!seanceId) redirect(retour);

  await prisma.seanceEmploiDuTemps.updateMany({
    where: { id: seanceId, utilisateurId: session.user.id },
    data: { contenuManuel: null },
  });

  revalidatePath("/emploi-du-temps");
  redirect(retour);
}
