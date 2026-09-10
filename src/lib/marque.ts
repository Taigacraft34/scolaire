import { obtenirNomEtablissement } from "@/lib/scolengo/client";
import { estEnModeStreamer } from "@/lib/modeStreamer";

// Nom de l'application. Provisoire (cf. PRODUCT.md) — centralisé ici pour qu'un
// changement de nom ne touche qu'un fichier.
export const NOM_APP = "Scolaire";

// Nom affiché (en-tête, titre d'onglet) : celui de l'établissement connecté
// quand on peut le lire depuis le token Scolengo stocké, sinon NOM_APP. Masqué
// en mode streamer (le nom de l'établissement est une information
// personnelle).
export async function nomAffiche(utilisateurId: string | undefined): Promise<string> {
  if (!utilisateurId) return NOM_APP;
  if (await estEnModeStreamer(utilisateurId)) return NOM_APP;
  return (await obtenirNomEtablissement(utilisateurId)) ?? NOM_APP;
}
