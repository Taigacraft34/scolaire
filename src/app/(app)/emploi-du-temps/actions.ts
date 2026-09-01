"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { JourSemaine, TypeSemaineCreneau } from "@/generated/prisma/client";

const JOURS_VALIDES: JourSemaine[] = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
];
const TYPES_SEMAINE_VALIDES: TypeSemaineCreneau[] = ["CHAQUE_SEMAINE", "SIP", "SP", "S1Q"];

// Seuls le titulaire du compte, le gestionnaire (personne sans compte) ou un
// administrateur peuvent modifier un emploi du temps.
async function edtGerablePar(emploiDuTempsId: string, utilisateurId: string, role: "ADMIN" | "UTILISATEUR") {
  const edt = await prisma.emploiDuTemps.findUnique({ where: { id: emploiDuTempsId } });
  if (!edt) return null;
  if (role === "ADMIN" || edt.utilisateurId === utilisateurId || edt.gerePar === utilisateurId) return edt;
  return null;
}

export async function creerMonEmploiDuTemps() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const existant = await prisma.emploiDuTemps.findUnique({ where: { utilisateurId: session.user.id } });
  const edt = existant ?? (await prisma.emploiDuTemps.create({ data: { utilisateurId: session.user.id } }));

  revalidatePath("/emploi-du-temps");
  redirect(`/emploi-du-temps?edt=${edt.id}`);
}

export async function creerEmploiDuTempsPersonne(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) redirect(`/emploi-du-temps?erreur=${encodeURIComponent("Le nom est requis.")}`);

  const edt = await prisma.emploiDuTemps.create({
    data: { nomPersonne: nom, gerePar: session.user.id },
  });

  revalidatePath("/emploi-du-temps");
  redirect(`/emploi-du-temps?edt=${edt.id}`);
}

export async function supprimerEmploiDuTemps(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const emploiDuTempsId = String(formData.get("emploiDuTempsId") ?? "").trim();
  const edt = await edtGerablePar(emploiDuTempsId, session.user.id, session.user.role);
  if (!edt) redirect("/emploi-du-temps");

  await prisma.emploiDuTemps.delete({ where: { id: edt.id } });

  revalidatePath("/emploi-du-temps");
  redirect("/emploi-du-temps");
}

export async function creerCreneau(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const emploiDuTempsId = String(formData.get("emploiDuTempsId") ?? "").trim();
  const jour = String(formData.get("jour") ?? "").trim() as JourSemaine;
  const heureDebut = String(formData.get("heureDebut") ?? "").trim();
  const heureFin = String(formData.get("heureFin") ?? "").trim();
  const matiere = String(formData.get("matiere") ?? "").trim();
  const enseignant = String(formData.get("enseignant") ?? "").trim() || null;
  const salle = String(formData.get("salle") ?? "").trim() || null;
  const typeSemaine = String(formData.get("typeSemaine") ?? "CHAQUE_SEMAINE").trim() as TypeSemaineCreneau;
  const rangS1QBrut = String(formData.get("rangS1Q") ?? "").trim();

  const edt = await edtGerablePar(emploiDuTempsId, session.user.id, session.user.role);
  if (!edt) redirect("/emploi-du-temps");

  if (
    !JOURS_VALIDES.includes(jour) ||
    !heureDebut ||
    !heureFin ||
    !matiere ||
    !TYPES_SEMAINE_VALIDES.includes(typeSemaine)
  ) {
    redirect(
      `/emploi-du-temps?edt=${edt.id}&erreur=${encodeURIComponent("Jour, horaires, matiere et frequence sont requis.")}`,
    );
  }

  if (heureFin <= heureDebut) {
    redirect(
      `/emploi-du-temps?edt=${edt.id}&erreur=${encodeURIComponent("L'heure de fin doit etre apres l'heure de debut.")}`,
    );
  }

  let rangS1Q: number | null = null;
  if (typeSemaine === "S1Q") {
    const rang = parseInt(rangS1QBrut, 10);
    if (!Number.isInteger(rang) || rang < 1 || rang > 4) {
      redirect(
        `/emploi-du-temps?edt=${edt.id}&erreur=${encodeURIComponent("Le rang S1Q doit etre compris entre 1 et 4.")}`,
      );
    }
    rangS1Q = rang;
  }

  await prisma.creneauEdt.create({
    data: {
      emploiDuTempsId: edt.id,
      jour,
      heureDebut,
      heureFin,
      matiere,
      enseignant,
      salle,
      typeSemaine,
      rangS1Q,
    },
  });

  revalidatePath("/emploi-du-temps");
  redirect(`/emploi-du-temps?edt=${edt.id}`);
}

export async function supprimerCreneau(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const creneauId = String(formData.get("creneauId") ?? "").trim();
  const creneau = await prisma.creneauEdt.findUnique({ where: { id: creneauId } });
  if (!creneau) redirect("/emploi-du-temps");

  const edt = await edtGerablePar(creneau.emploiDuTempsId, session.user.id, session.user.role);
  if (!edt) redirect("/emploi-du-temps");

  await prisma.creneauEdt.delete({ where: { id: creneau.id } });

  revalidatePath("/emploi-du-temps");
  redirect(`/emploi-du-temps?edt=${edt.id}`);
}
