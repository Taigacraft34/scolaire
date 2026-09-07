"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { trouverOuCreerMatiere } from "@/lib/matieres";
import { synchroniserUtilisateur } from "@/lib/scolengo/sync";
import { getClientScolengo } from "@/lib/scolengo/client";
import { genererRappelsPourDevoir, supprimerRappelsDevoirNonEnvoyes } from "@/lib/notifications/rappels";

export async function lancerSynchronisation(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const dateDebutBrute = String(formData.get("dateDebut") ?? "").trim();
  const dateFinBrute = String(formData.get("dateFin") ?? "").trim();

  const options: { dateDebut?: Date; dateFin?: Date } = {};
  if (dateDebutBrute) options.dateDebut = new Date(dateDebutBrute);
  if (dateFinBrute) options.dateFin = new Date(dateFinBrute);

  try {
    await synchroniserUtilisateur(session.user.id, options);
  } catch {
    // L'echec est deja consigne dans Synchronisation/Journal ; on laisse la page l'afficher.
  }

  revalidatePath("/devoirs");
  revalidatePath("/controles");
  revalidatePath("/notes");
  redirect("/devoirs");
}

export async function creerDevoirManuel(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const matiereNom = String(formData.get("matiere") ?? "").trim();
  const titre = String(formData.get("titre") ?? "").trim();
  const dateBrute = String(formData.get("date") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!matiereNom || !titre || !dateBrute) {
    redirect(`/devoirs?erreur=${encodeURIComponent("Matière, titre et date sont requis.")}`);
  }

  const matiere = await trouverOuCreerMatiere(session.user.id, matiereNom);

  const devoir = await prisma.devoir.create({
    data: {
      utilisateurId: session.user.id,
      matiereId: matiere.id,
      titre,
      description,
      date: new Date(dateBrute),
      statut: "A_FAIRE",
      provenance: "MANUEL",
    },
  });

  await genererRappelsPourDevoir(devoir.id, session.user.id);

  revalidatePath("/devoirs");
  redirect("/devoirs");
}

export async function basculerStatutDevoir(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const devoirId = String(formData.get("devoirId") ?? "").trim();
  // Permet d'appeler l'action depuis une autre page (ex: emploi du temps) et d'y
  // revenir. On limite aux chemins internes.
  const retourBrut = String(formData.get("retour") ?? "").trim();
  const retour = retourBrut.startsWith("/") ? retourBrut : "/devoirs";

  const devoir = await prisma.devoir.findFirst({ where: { id: devoirId, utilisateurId: session.user.id } });
  if (!devoir) redirect(retour);

  const nouveauStatut = devoir.statut === "TERMINE" ? "A_FAIRE" : "TERMINE";

  if (devoir.provenance === "MBN" && devoir.externalId) {
    try {
      const client = await getClientScolengo(session.user.id);
      if (client) {
        await client.patchHomeworkAssignment(client.getTokenClaims().sub, devoir.externalId, {
          done: nouveauStatut === "TERMINE",
        });
      }
    } catch (e) {
      await prisma.journal.create({
        data: {
          utilisateurId: session.user.id,
          action: "ERREUR",
          entiteType: "Devoir",
          entiteId: devoir.id,
          metadonnees: { erreur: e instanceof Error ? e.message : String(e), contexte: "patchHomeworkAssignment" },
        },
      });
    }
  }

  await prisma.devoir.update({ where: { id: devoir.id }, data: { statut: nouveauStatut } });

  // Un devoir fait n'a plus besoin de rappels ; s'il repasse "a faire" on les
  // reprogramme (ceux dont l'echeance n'est pas deja passee).
  if (nouveauStatut === "TERMINE") {
    await supprimerRappelsDevoirNonEnvoyes(devoir.id);
  } else {
    await genererRappelsPourDevoir(devoir.id, session.user.id);
  }

  revalidatePath("/devoirs");
  revalidatePath("/emploi-du-temps");
  redirect(retour);
}

export async function supprimerDevoir(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const devoirId = String(formData.get("devoirId") ?? "").trim();
  if (!devoirId) redirect("/devoirs");

  await prisma.devoir.deleteMany({ where: { id: devoirId, utilisateurId: session.user.id } });

  revalidatePath("/devoirs");
  revalidatePath("/controles");
  redirect("/devoirs");
}
