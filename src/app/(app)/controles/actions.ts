"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { trouverOuCreerMatiere } from "@/lib/matieres";
import {
  genererRappelsPourControle,
  supprimerRappelsDevoirNonEnvoyes,
} from "@/lib/notifications/rappels";

export async function creerControleManuel(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const matiereNom = String(formData.get("matiere") ?? "").trim();
  const dateBrute = String(formData.get("date") ?? "").trim();
  const chapitreLibre = String(formData.get("chapitre") ?? "").trim() || null;
  const commentaire = String(formData.get("commentaire") ?? "").trim() || null;
  const devoirId = String(formData.get("devoirId") ?? "").trim() || null;

  if (!matiereNom || !dateBrute) {
    redirect(`/controles?erreur=${encodeURIComponent("Matière et date sont requis.")}`);
  }

  let devoirSourceId: string | null = null;
  if (devoirId) {
    const devoir = await prisma.devoir.findFirst({
      where: { id: devoirId, utilisateurId: session.user.id, controleGenere: null },
    });
    if (!devoir) {
      redirect(`/controles?erreur=${encodeURIComponent("Le devoir choisi est introuvable ou déjà lié à un contrôle.")}`);
    }
    devoirSourceId = devoir.id;
  }

  const matiere = await trouverOuCreerMatiere(session.user.id, matiereNom);
  const date = new Date(dateBrute);

  const controle = await prisma.controle.create({
    data: {
      utilisateurId: session.user.id,
      matiereId: matiere.id,
      date,
      chapitreLibre,
      commentaire,
      type: "MANUEL",
      statut: date.getTime() < Date.now() ? "PASSE" : "A_VENIR",
      devoirSourceId,
    },
  });

  await genererRappelsPourControle(controle.id, session.user.id);
  // Le controle prend le relais : plus de rappels "devoir a faire" pour la source.
  if (devoirSourceId) await supprimerRappelsDevoirNonEnvoyes(devoirSourceId);

  revalidatePath("/controles");
  revalidatePath("/devoirs");
  redirect("/controles");
}

export async function modifierControle(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const controleId = String(formData.get("controleId") ?? "").trim();
  const matiereNom = String(formData.get("matiere") ?? "").trim();
  const dateBrute = String(formData.get("date") ?? "").trim();
  const chapitreLibre = String(formData.get("chapitre") ?? "").trim() || null;
  const commentaire = String(formData.get("commentaire") ?? "").trim() || null;

  if (!controleId) redirect("/controles");
  if (!matiereNom || !dateBrute) {
    redirect(`/controles?erreur=${encodeURIComponent("Matière et date sont requis.")}`);
  }

  const controle = await prisma.controle.findFirst({ where: { id: controleId, utilisateurId: session.user.id } });
  if (!controle) redirect("/controles");

  const matiere = await trouverOuCreerMatiere(session.user.id, matiereNom);
  const date = new Date(dateBrute);
  const dateChangee = date.getTime() !== controle.date.getTime();

  await prisma.controle.update({
    where: { id: controle.id },
    data: {
      matiereId: matiere.id,
      date,
      chapitreLibre,
      commentaire,
      statut: date.getTime() < Date.now() ? "PASSE" : "A_VENIR",
    },
  });

  // Les rappels sont calcules depuis la date : on reprogramme ceux pas encore envoyes.
  if (dateChangee) {
    await prisma.notification.deleteMany({ where: { controleId: controle.id, envoyee: false } });
    await genererRappelsPourControle(controle.id, session.user.id);
  }

  revalidatePath("/controles");
  revalidatePath("/emploi-du-temps");
  redirect(`/controles?focus=${controle.id}`);
}

export async function lierDevoirAuControle(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const controleId = String(formData.get("controleId") ?? "").trim();
  const devoirId = String(formData.get("devoirId") ?? "").trim();

  if (!controleId || !devoirId) {
    redirect(`/controles?erreur=${encodeURIComponent("Sélectionnez un devoir à lier.")}`);
  }

  const [controle, devoir] = await Promise.all([
    prisma.controle.findFirst({ where: { id: controleId, utilisateurId: session.user.id } }),
    prisma.devoir.findFirst({ where: { id: devoirId, utilisateurId: session.user.id, controleGenere: null } }),
  ]);

  if (!controle || !devoir) {
    redirect(`/controles?erreur=${encodeURIComponent("Contrôle ou devoir introuvable, ou devoir déjà lié.")}`);
  }

  await prisma.controle.update({ where: { id: controle.id }, data: { devoirSourceId: devoir.id } });
  await supprimerRappelsDevoirNonEnvoyes(devoir.id);

  revalidatePath("/controles");
  revalidatePath("/devoirs");
  redirect("/controles");
}

export async function lierChapitreAuControle(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const controleId = String(formData.get("controleId") ?? "").trim();
  const chapitreId = String(formData.get("chapitreId") ?? "").trim();

  if (!controleId || !chapitreId) {
    redirect(`/controles?erreur=${encodeURIComponent("Sélectionnez un chapitre à lier.")}`);
  }

  const [controle, chapitre] = await Promise.all([
    prisma.controle.findFirst({ where: { id: controleId, utilisateurId: session.user.id } }),
    prisma.chapitre.findFirst({ where: { id: chapitreId, utilisateurId: session.user.id } }),
  ]);

  if (!controle || !chapitre) {
    redirect(`/controles?erreur=${encodeURIComponent("Contrôle ou chapitre introuvable.")}`);
  }

  await prisma.controleChapitre.upsert({
    where: { controleId_chapitreId: { controleId: controle.id, chapitreId: chapitre.id } },
    update: {},
    create: { controleId: controle.id, chapitreId: chapitre.id },
  });

  revalidatePath("/controles");
  redirect("/controles");
}

export async function delierChapitreDuControle(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const controleId = String(formData.get("controleId") ?? "").trim();
  const chapitreId = String(formData.get("chapitreId") ?? "").trim();
  if (!controleId || !chapitreId) redirect("/controles");

  const controle = await prisma.controle.findFirst({ where: { id: controleId, utilisateurId: session.user.id } });
  if (!controle) redirect("/controles");

  await prisma.controleChapitre.deleteMany({ where: { controleId, chapitreId } });

  revalidatePath("/controles");
  redirect("/controles");
}

export async function supprimerControle(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const controleId = String(formData.get("controleId") ?? "").trim();
  if (!controleId) redirect("/controles");

  await prisma.controle.deleteMany({ where: { id: controleId, utilisateurId: session.user.id } });

  revalidatePath("/controles");
  revalidatePath("/devoirs");
  redirect("/controles");
}
