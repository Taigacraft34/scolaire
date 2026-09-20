import { prisma } from "@/lib/prisma";
import type { CanalNotification } from "@/generated/prisma/client";
import { partiesFuseau, jourSemaineFuseau } from "@/lib/fuseau";
import { envoyerEmail } from "./email";
import { envoyerGotify, envoyerNtfy, envoyerPushover } from "./providers";

type UtilisateurNotifiable = {
  email: string;
  parametresNotif: { fournisseur: string; configuration: unknown }[];
};

// Envoie un message sur les canaux demandes : l'email de l'utilisateur et/ou
// chacun de ses fournisseurs mobiles actifs. Leve a la premiere erreur.
export async function envoyerSurCanaux(
  utilisateur: UtilisateurNotifiable,
  canaux: CanalNotification[],
  contenu: { titre: string; message: string },
) {
  if (canaux.includes("EMAIL")) {
    await envoyerEmail(utilisateur.email, contenu.titre, contenu.message);
  }

  if (canaux.includes("MOBILE")) {
    for (const param of utilisateur.parametresNotif) {
      const config = param.configuration as Record<string, string>;
      if (param.fournisseur === "NTFY") {
        await envoyerNtfy({ topic: config.topic, serveur: config.serveur }, contenu);
      } else if (param.fournisseur === "PUSHOVER") {
        await envoyerPushover({ userKey: config.userKey, appToken: config.appToken }, contenu);
      } else if (param.fournisseur === "GOTIFY") {
        await envoyerGotify({ serveur: config.serveur, token: config.token }, contenu);
      }
    }
  }
}

export async function traiterNotificationsDues() {
  const maintenant = new Date();

  const dues = await prisma.notification.findMany({
    where: {
      envoyee: false,
      OR: [
        { type: { not: "PERSONNALISE" }, dateEnvoiPrevue: { lte: maintenant } },
        { type: "PERSONNALISE", datePersonnalisee: { lte: maintenant } },
      ],
    },
    include: {
      controle: { include: { matiere: true } },
      devoir: { include: { matiere: true } },
      utilisateur: { include: { parametresNotif: { where: { actif: true } } } },
    },
    take: 200,
  });

  let envoyees = 0;
  const erreurs: string[] = [];

  for (const notif of dues) {
    const { controle, devoir, utilisateur } = notif;

    let titre: string;
    let message: string;

    if (devoir) {
      // Le devoir a ete fait (ou refait) entre-temps : le rappel n'a plus lieu
      // d'etre, on le retire sans rien envoyer.
      if (devoir.statut === "TERMINE") {
        await prisma.notification.delete({ where: { id: notif.id } });
        continue;
      }
      // Un rappel anticipe (J-14 a J-2) annonce le devoir a venir ; la veille
      // et le jour meme, il est deja temps de le faire.
      const rappelAnticipe = notif.type !== "VEILLE" && notif.type !== "MATIN_MEME";
      titre = rappelAnticipe
        ? `Rappel de devoirs : ${devoir.matiere.nom}`
        : `Devoir a faire : ${devoir.matiere.nom}`;
      message = `${devoir.matiere.nom} — ${devoir.titre}, à rendre le ${devoir.date.toLocaleDateString("fr-FR")}`;
    } else if (controle) {
      titre = `Contrôle : ${controle.matiere.nom}`;
      message = `${controle.matiere.nom}${controle.chapitreLibre ? " — " + controle.chapitreLibre : ""} le ${controle.date.toLocaleDateString("fr-FR")}`;
    } else {
      // Notification orpheline (controle/devoir supprime) : on la retire.
      await prisma.notification.delete({ where: { id: notif.id } });
      continue;
    }

    try {
      await envoyerSurCanaux(utilisateur, notif.canaux, { titre, message });

      await prisma.notification.update({
        where: { id: notif.id },
        data: { envoyee: true, envoyeeLe: new Date() },
      });
      envoyees++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      erreurs.push(`Notification ${notif.id}: ${msg}`);
      await prisma.journal.create({
        data: {
          utilisateurId: utilisateur.id,
          action: "ERREUR",
          entiteType: "Notification",
          entiteId: notif.id,
          metadonnees: { erreur: msg },
        },
      });
    }
  }

  const rappels = await traiterRappelsPersonnalises();

  return {
    envoyees: envoyees + rappels.envoyes,
    erreurs: [...erreurs, ...rappels.erreurs],
    total: dues.length + rappels.total,
  };
}

// Rappels personnalises : envoyes chaque jour choisi, une fois l'heure atteinte
// (dans le fuseau de l'utilisateur), sur les canaux de ses rappels de devoirs.
// Si l'envoi echoue, le jour n'est pas marque : la prochaine passe reessaie.
async function traiterRappelsPersonnalises() {
  const maintenant = new Date();

  const rappels = await prisma.rappel.findMany({
    where: { actif: true },
    include: {
      matiere: true,
      utilisateur: { include: { parametresNotif: { where: { actif: true } } } },
    },
    take: 500,
  });

  let envoyes = 0;
  let total = 0;
  const erreurs: string[] = [];

  for (const rappel of rappels) {
    const { utilisateur } = rappel;
    const { cleJour, minutes } = partiesFuseau(maintenant, utilisateur.fuseauHoraire);
    if (rappel.dernierEnvoiJour === cleJour) continue;
    if (!rappel.jours.includes(jourSemaineFuseau(maintenant, utilisateur.fuseauHoraire))) continue;

    const [h, m] = rappel.heure.split(":").map(Number);
    if (minutes < h * 60 + m) continue;

    total++;
    const titre = `Rappel : ${rappel.titre}`;
    const message = [rappel.matiere?.nom, rappel.description].filter(Boolean).join(" — ") || rappel.titre;

    try {
      await envoyerSurCanaux(utilisateur, utilisateur.canauxDevoirParDefaut, { titre, message });
      await prisma.rappel.update({ where: { id: rappel.id }, data: { dernierEnvoiJour: cleJour } });
      envoyes++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      erreurs.push(`Rappel ${rappel.id}: ${msg}`);
      await prisma.journal.create({
        data: {
          utilisateurId: utilisateur.id,
          action: "ERREUR",
          entiteType: "Rappel",
          entiteId: rappel.id,
          metadonnees: { erreur: msg },
        },
      });
    }
  }

  return { envoyes, erreurs, total };
}
