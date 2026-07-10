"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enregistrerConfigScolengo, type ConfigScolengo } from "@/lib/scolengo/client";
import { envoyerEmail } from "@/lib/notifications/email";
import { envoyerGotify, envoyerNtfy, envoyerPushover } from "@/lib/notifications/providers";
import { synchroniserUtilisateur } from "@/lib/scolengo/sync";
import { supprimerFichier } from "@/lib/stockage";

export async function enregistrerTokenScolengo(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const brut = String(formData.get("configJson") ?? "").trim();

  let config: ConfigScolengo;
  try {
    config = JSON.parse(brut);
  } catch {
    redirect(`/parametres?erreur=${encodeURIComponent("Le JSON fourni est invalide.")}`);
  }

  if (!config?.tokenSet?.access_token || !config?.school?.id) {
    redirect(
      `/parametres?erreur=${encodeURIComponent("Configuration incomplete : tokenSet.access_token et school.id sont requis.")}`,
    );
  }

  await enregistrerConfigScolengo(session.user.id, config);
  revalidatePath("/parametres");
  redirect("/parametres?succes=1");
}

export async function mettreAJourPreferences(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const motsCles = String(formData.get("motsCles") ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  const fuseauHoraire = String(formData.get("fuseauHoraire") ?? "").trim() || "Europe/Paris";

  await prisma.utilisateur.update({
    where: { id: session.user.id },
    data: { motsClesControle: motsCles, fuseauHoraire },
  });

  revalidatePath("/parametres");
  redirect("/parametres?succes=1");
}

export async function mettreAJourRappels(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const rappelsParDefaut = formData.getAll("rappels").map((v) => String(v)) as (
    | "J_MOINS_7"
    | "J_MOINS_3"
    | "J_MOINS_2"
    | "VEILLE"
    | "MATIN_MEME"
  )[];
  const canauxParDefaut = formData.getAll("canaux").map((v) => String(v)) as ("EMAIL" | "MOBILE" | "NAVIGATEUR")[];

  await prisma.utilisateur.update({
    where: { id: session.user.id },
    data: { rappelsParDefaut, canauxParDefaut },
  });

  revalidatePath("/parametres");
  redirect("/parametres?succes=1");
}

export async function enregistrerNtfy(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const topic = String(formData.get("topic") ?? "").trim();
  const serveur = String(formData.get("serveur") ?? "").trim() || undefined;

  if (!topic) redirect(`/parametres?erreur=${encodeURIComponent("Le topic ntfy est requis.")}`);

  const existant = await prisma.parametreNotification.findFirst({
    where: { utilisateurId: session.user.id, fournisseur: "NTFY" },
  });

  if (existant) {
    await prisma.parametreNotification.update({
      where: { id: existant.id },
      data: { configuration: { topic, serveur }, actif: true },
    });
  } else {
    await prisma.parametreNotification.create({
      data: {
        utilisateurId: session.user.id,
        fournisseur: "NTFY",
        configuration: { topic, serveur },
        actif: true,
      },
    });
  }

  revalidatePath("/parametres");
  redirect("/parametres?succes=1");
}

export async function envoyerNotificationTest() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({ where: { id: session.user.id } });
  const parametresNotif = await prisma.parametreNotification.findMany({
    where: { utilisateurId: session.user.id, actif: true },
  });

  const titre = "Test de notification";
  const message =
    "Ceci est une notification de test envoyee depuis les parametres de la plateforme scolaire.";

  const reussites: string[] = [];
  const erreurs: string[] = [];

  try {
    await envoyerEmail(utilisateur.email, titre, message);
    reussites.push("Email");
  } catch (e) {
    erreurs.push(`Email : ${e instanceof Error ? e.message : String(e)}`);
  }

  for (const param of parametresNotif) {
    const config = param.configuration as Record<string, string>;
    try {
      if (param.fournisseur === "NTFY") {
        await envoyerNtfy({ topic: config.topic, serveur: config.serveur }, { titre, message });
      } else if (param.fournisseur === "PUSHOVER") {
        await envoyerPushover({ userKey: config.userKey, appToken: config.appToken }, { titre, message });
      } else if (param.fournisseur === "GOTIFY") {
        await envoyerGotify({ serveur: config.serveur, token: config.token }, { titre, message });
      }
      reussites.push(param.fournisseur);
    } catch (e) {
      erreurs.push(`${param.fournisseur} : ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (erreurs.length > 0) {
    redirect(
      `/parametres?erreur=${encodeURIComponent(
        `Echec pour ${erreurs.join(" | ")}${reussites.length > 0 ? ` (reussi : ${reussites.join(", ")})` : ""}`,
      )}`,
    );
  }

  redirect(`/parametres?succes=1&testOk=${encodeURIComponent(reussites.join(", "))}`);
}

export async function supprimerNtfy() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  await prisma.parametreNotification.deleteMany({
    where: { utilisateurId: session.user.id, fournisseur: "NTFY" },
  });

  revalidatePath("/parametres");
  redirect("/parametres");
}

export async function basculerModeDeveloppeur(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const active = formData.get("actif") === "1";

  await prisma.utilisateur.update({
    where: { id: session.user.id },
    data: { modeDeveloppeur: active },
  });

  revalidatePath("/parametres");
  revalidatePath("/devoirs");
  revalidatePath("/controles");
  revalidatePath("/notes");
  redirect("/parametres");
}

export async function mettreAJourFrequenceSynchronisation(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const brut = String(formData.get("frequence") ?? "MANUELLE");
  const frequence = (["MANUELLE", "HORAIRE", "TOUTES_LES_6H", "QUOTIDIENNE"] as const).includes(
    brut as "MANUELLE",
  )
    ? (brut as "MANUELLE" | "HORAIRE" | "TOUTES_LES_6H" | "QUOTIDIENNE")
    : "MANUELLE";

  await prisma.utilisateur.update({
    where: { id: session.user.id },
    data: { frequenceSynchronisation: frequence },
  });

  revalidatePath("/parametres");
  redirect("/parametres?succes=1");
}

// Reinitialise les donnees scolaires de l'utilisateur (matieres, chapitres de
// cours, devoirs, controles, notes, copies et documents associes). Le compte,
// la connexion MonBureauNumerique et les preferences de notification sont
// conserves. Necessite de saisir un mot de confirmation exact (defense contre
// un clic accidentel sur une action irreversible).
export async function reinitialiserDonnees(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "SUPPRIMER") {
    redirect(`/parametres?erreur=${encodeURIComponent("Confirmation invalide, rien n'a ete supprime.")}`);
  }

  const documents = await prisma.document.findMany({
    where: { utilisateurId: session.user.id },
    select: { cheminStockage: true },
  });

  const { count: matieresSupprimees } = await prisma.matiere.deleteMany({
    where: { utilisateurId: session.user.id },
  });

  for (const document of documents) {
    await supprimerFichier(document.cheminStockage);
  }

  await prisma.journal.create({
    data: {
      utilisateurId: session.user.id,
      action: "REINITIALISATION_DONNEES",
      metadonnees: { matieresSupprimees, documentsSupprimes: documents.length },
    },
  });

  revalidatePath("/");
  revalidatePath("/devoirs");
  revalidatePath("/controles");
  revalidatePath("/notes");
  revalidatePath("/cours");
  revalidatePath("/calendrier");
  revalidatePath("/parametres");
  redirect("/parametres?succes=1");
}

export async function lancerSynchronisationGenerale() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  try {
    await synchroniserUtilisateur(session.user.id);
  } catch {
    // L'echec est deja consigne dans Synchronisation/Journal.
  }

  revalidatePath("/parametres");
  revalidatePath("/devoirs");
  revalidatePath("/controles");
  revalidatePath("/notes");
  redirect("/parametres");
}
