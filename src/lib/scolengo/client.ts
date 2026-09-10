import { cache } from "react";
import { Skolengo } from "scolengo-api";
import { chiffrer, dechiffrer } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

// Alias local pour eviter de dependre d'un chemin d'import profond dans scolengo-api,
// dont les types ne sont pas re-exportes depuis le point d'entree du package.
export type ConfigScolengo = Parameters<typeof Skolengo.fromConfigObject>[0];

// Verrou en memoire, par utilisateur : serialise tout usage du client Scolengo
// (synchronisation planifiee, synchronisation manuelle, patch d'un devoir...).
// L'access token dure 24h mais le refresh token (21 jours) n'est utilisable
// qu'une fois : si deux appels concurrents pour le meme utilisateur lisent le
// meme refresh token perime et tentent chacun de le rafraichir, le serveur
// Scolengo detecte la reutilisation et revoque toute la famille de jetons -
// il faut alors reconfigurer un nouveau token a la main. Ce verrou empeche
// deux operations sur le meme utilisateur de jamais se chevaucher.
const verrousUtilisateur = new Map<string, Promise<unknown>>();

export async function avecVerrouScolengo<T>(utilisateurId: string, tache: () => Promise<T>): Promise<T> {
  const precedent = verrousUtilisateur.get(utilisateurId) ?? Promise.resolve();
  const courant = precedent.catch(() => {}).then(tache);
  verrousUtilisateur.set(utilisateurId, courant);
  try {
    return await courant;
  } finally {
    if (verrousUtilisateur.get(utilisateurId) === courant) {
      verrousUtilisateur.delete(utilisateurId);
    }
  }
}

export async function getClientScolengo(utilisateurId: string) {
  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({ where: { id: utilisateurId } });
  if (!utilisateur.scolengoTokenChiffre) return null;

  const config: ConfigScolengo = JSON.parse(dechiffrer(utilisateur.scolengoTokenChiffre));

  return Skolengo.fromConfigObject(config, {
    onTokenRefresh: (tokenSet) => {
      const nouvelleConfig: ConfigScolengo = { ...config, tokenSet };
      // Fire-and-forget assume : une erreur ici ne doit pas planter tout le
      // process (rejet de promesse non gere), seulement rester en log.
      prisma.utilisateur
        .update({
          where: { id: utilisateurId },
          data: { scolengoTokenChiffre: chiffrer(JSON.stringify(nouvelleConfig)) },
        })
        .catch((e) => {
          console.error(`Echec de l'enregistrement du token rafraichi (utilisateur ${utilisateurId}) :`, e);
        });
    },
  });
}

export async function enregistrerConfigScolengo(utilisateurId: string, config: ConfigScolengo) {
  await prisma.utilisateur.update({
    where: { id: utilisateurId },
    data: { scolengoTokenChiffre: chiffrer(JSON.stringify(config)) },
  });
}

// Le nom de l'etablissement est deja present dans le token stocke (config.school) ;
// pas besoin d'un appel reseau ni d'instancier le client Skolengo pour le lire.
// Mis en cache par requete (react cache) : utilise a la fois par le titre
// d'onglet (generateMetadata) et par l'en-tete, sur le meme rendu.
export const obtenirNomEtablissement = cache(async (utilisateurId: string): Promise<string | null> => {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: { scolengoTokenChiffre: true },
  });
  if (!utilisateur?.scolengoTokenChiffre) return null;

  try {
    const config: ConfigScolengo = JSON.parse(dechiffrer(utilisateur.scolengoTokenChiffre));
    return config.school?.name ?? null;
  } catch {
    return null;
  }
});
