export const LIBELLES_STATUT_DEVOIR: Record<string, string> = {
  A_FAIRE: "À faire",
  TERMINE: "Terminé",
};

export const LIBELLES_STATUT_SYNCHRONISATION: Record<string, string> = {
  EN_COURS: "En cours",
  SUCCES: "Succès",
  ECHEC: "Échec",
};

/**
 * Le statut d'un controle (a venir / passe) depend uniquement de sa date : on le
 * calcule a l'affichage plutot que de se fier a un champ stocke qui deviendrait
 * perime des que la date est depassee.
 */
export function libelleStatutControle(date: Date): string {
  return date.getTime() < Date.now() ? "Passé" : "À venir";
}
