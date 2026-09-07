"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function exigerAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}

export async function basculerActivationUtilisateur(formData: FormData) {
  const session = await exigerAdmin();
  const utilisateurId = String(formData.get("utilisateurId") ?? "").trim();
  if (!utilisateurId) redirect("/admin");

  if (utilisateurId === session.user.id) {
    redirect(`/admin?erreur=${encodeURIComponent("Vous ne pouvez pas desactiver votre propre compte.")}`);
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
  if (!utilisateur) redirect("/admin");

  await prisma.utilisateur.update({ where: { id: utilisateurId }, data: { actif: !utilisateur.actif } });

  await prisma.journal.create({
    data: {
      utilisateurId: session.user.id,
      action: utilisateur.actif ? "DESACTIVATION_UTILISATEUR" : "ACTIVATION_UTILISATEUR",
      entiteType: "Utilisateur",
      entiteId: utilisateurId,
      metadonnees: { cible: utilisateur.email },
    },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function autoriserEmail(formData: FormData) {
  await exigerAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "UTILISATEUR";

  if (!REGEX_EMAIL.test(email)) {
    redirect(`/admin?erreur=${encodeURIComponent("Adresse email invalide.")}`);
  }

  const compteExistant = await prisma.utilisateur.findUnique({ where: { email } });
  if (compteExistant) {
    redirect(`/admin?erreur=${encodeURIComponent("Cet email a déjà un compte sur la plateforme.")}`);
  }

  await prisma.emailAutorise.upsert({
    where: { email },
    update: { role },
    create: { email, role },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function revoquerAutorisation(formData: FormData) {
  await exigerAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin");

  await prisma.emailAutorise.deleteMany({ where: { id } });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function supprimerUtilisateur(formData: FormData) {
  const session = await exigerAdmin();
  const utilisateurId = String(formData.get("utilisateurId") ?? "").trim();
  if (!utilisateurId) redirect("/admin");

  if (utilisateurId === session.user.id) {
    redirect(`/admin?erreur=${encodeURIComponent("Vous ne pouvez pas supprimer votre propre compte.")}`);
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
  if (!utilisateur) redirect("/admin");

  await prisma.utilisateur.delete({ where: { id: utilisateurId } });

  await prisma.journal.create({
    data: {
      utilisateurId: session.user.id,
      action: "SUPPRESSION_UTILISATEUR",
      entiteType: "Utilisateur",
      entiteId: utilisateurId,
      metadonnees: { cible: utilisateur.email },
    },
  });

  revalidatePath("/admin");
  redirect("/admin");
}
