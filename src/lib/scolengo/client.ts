import { Skolengo } from "scolengo-api";
import { chiffrer, dechiffrer } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

// Alias local pour eviter de dependre d'un chemin d'import profond dans scolengo-api,
// dont les types ne sont pas re-exportes depuis le point d'entree du package.
export type ConfigScolengo = Parameters<typeof Skolengo.fromConfigObject>[0];

export async function getClientScolengo(utilisateurId: string) {
  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({ where: { id: utilisateurId } });
  if (!utilisateur.scolengoTokenChiffre) return null;

  const config: ConfigScolengo = JSON.parse(dechiffrer(utilisateur.scolengoTokenChiffre));

  return Skolengo.fromConfigObject(config, {
    onTokenRefresh: (tokenSet) => {
      const nouvelleConfig: ConfigScolengo = { ...config, tokenSet };
      void prisma.utilisateur.update({
        where: { id: utilisateurId },
        data: { scolengoTokenChiffre: chiffrer(JSON.stringify(nouvelleConfig)) },
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
export async function obtenirNomEtablissement(utilisateurId: string): Promise<string | null> {
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
}
