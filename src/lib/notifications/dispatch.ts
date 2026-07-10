import { prisma } from "@/lib/prisma";
import { envoyerEmail } from "./email";
import { envoyerGotify, envoyerNtfy, envoyerPushover } from "./providers";

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
      utilisateur: { include: { parametresNotif: { where: { actif: true } } } },
    },
    take: 200,
  });

  let envoyees = 0;
  const erreurs: string[] = [];

  for (const notif of dues) {
    const { controle, utilisateur } = notif;
    const titre = `Controle : ${controle.matiere.nom}`;
    const message = `${controle.matiere.nom}${controle.chapitreLibre ? " — " + controle.chapitreLibre : ""} le ${controle.date.toLocaleDateString(
      "fr-FR",
    )}${controle.heure ? " a " + controle.heure : ""}`;

    try {
      if (notif.canaux.includes("EMAIL")) {
        await envoyerEmail(utilisateur.email, titre, message);
      }

      if (notif.canaux.includes("MOBILE")) {
        for (const param of utilisateur.parametresNotif) {
          const config = param.configuration as Record<string, string>;
          if (param.fournisseur === "NTFY") {
            await envoyerNtfy({ topic: config.topic, serveur: config.serveur }, { titre, message });
          } else if (param.fournisseur === "PUSHOVER") {
            await envoyerPushover(
              { userKey: config.userKey, appToken: config.appToken },
              { titre, message },
            );
          } else if (param.fournisseur === "GOTIFY") {
            await envoyerGotify({ serveur: config.serveur, token: config.token }, { titre, message });
          }
        }
      }

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

  return { envoyees, erreurs, total: dues.length };
}
