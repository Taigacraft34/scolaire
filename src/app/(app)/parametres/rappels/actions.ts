"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { partiesFuseau, jourSemaineFuseau } from "@/lib/fuseau";
import { HEURE_RAPPEL_PAR_DEFAUT, heureRappelValide } from "@/lib/rappels";

const PAGE = "/parametres/rappels";

function erreur(message: string): never {
  redirect(`${PAGE}?erreur=${encodeURIComponent(message)}`);
}

// Lit et valide le formulaire (creation comme modification). La matiere doit
// appartenir a l'utilisateur connecte.
async function lireFormulaire(formData: FormData, utilisateurId: string) {
  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const heure = String(formData.get("heure") ?? "").trim() || HEURE_RAPPEL_PAR_DEFAUT;
  const matiereId = String(formData.get("matiereId") ?? "").trim() || null;
  const jours = [
    ...new Set(
      formData
        .getAll("jours")
        .map((v) => Number(v))
        .filter((j) => Number.isInteger(j) && j >= 1 && j <= 7),
    ),
  ].sort((a, b) => a - b);

  if (!titre) erreur("Le titre du rappel est requis.");
  if (jours.length === 0) erreur("Choisis au moins un jour de la semaine.");
  if (!heureRappelValide(heure)) erreur("L'heure du rappel est invalide.");

  if (matiereId) {
    const matiere = await prisma.matiere.findFirst({ where: { id: matiereId, utilisateurId } });
    if (!matiere) erreur("Matière introuvable.");
  }

  return { titre, description, heure, matiereId, jours };
}

// Si le rappel tombe aujourd'hui mais que son heure est deja passee, on le
// considere comme envoye pour aujourd'hui : sans ca, le creer a 20h pour un
// rappel de 7h le declencherait immediatement.
async function dernierEnvoiInitial(utilisateurId: string, jours: number[], heure: string) {
  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({
    where: { id: utilisateurId },
    select: { fuseauHoraire: true },
  });
  const maintenant = new Date();
  const { cleJour, minutes } = partiesFuseau(maintenant, utilisateur.fuseauHoraire);
  const [h, m] = heure.split(":").map(Number);
  const dejaPasse =
    jours.includes(jourSemaineFuseau(maintenant, utilisateur.fuseauHoraire)) && minutes >= h * 60 + m;
  return dejaPasse ? cleJour : null;
}

function revalider() {
  revalidatePath(PAGE);
  revalidatePath("/devoirs");
}

export async function creerRappel(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const donnees = await lireFormulaire(formData, session.user.id);

  await prisma.rappel.create({
    data: {
      ...donnees,
      utilisateurId: session.user.id,
      dernierEnvoiJour: await dernierEnvoiInitial(session.user.id, donnees.jours, donnees.heure),
    },
  });

  revalider();
  redirect(`${PAGE}?succes=1`);
}

export async function modifierRappel(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const id = String(formData.get("rappelId") ?? "").trim();
  const existant = await prisma.rappel.findFirst({ where: { id, utilisateurId: session.user.id } });
  if (!existant) redirect(PAGE);

  const donnees = await lireFormulaire(formData, session.user.id);
  const actif = formData.get("actif") === "1";

  // Un changement de jours/heure repart de zero ; sinon on garde le suivi
  // d'envoi pour ne pas renvoyer un rappel deja parti aujourd'hui.
  const planningModifie =
    donnees.heure !== existant.heure || donnees.jours.join() !== [...existant.jours].sort().join();

  await prisma.rappel.update({
    where: { id: existant.id },
    data: {
      ...donnees,
      actif,
      ...(planningModifie
        ? { dernierEnvoiJour: await dernierEnvoiInitial(session.user.id, donnees.jours, donnees.heure) }
        : {}),
    },
  });

  revalider();
  redirect(`${PAGE}?succes=1`);
}

export async function supprimerRappel(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const id = String(formData.get("rappelId") ?? "").trim();
  await prisma.rappel.deleteMany({ where: { id, utilisateurId: session.user.id } });

  revalider();
  redirect(PAGE);
}
