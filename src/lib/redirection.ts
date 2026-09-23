// Cible de redirection venant de la requete (?callbackUrl, champ "retour") :
// uniquement un chemin interne a l'app. "//site.fr" et "/\site.fr" commencent
// aussi par "/" mais les navigateurs les lisent comme une autre origine.
export function cheminInterne(valeur: unknown, defaut: string): string {
  if (typeof valeur !== "string") return defaut;
  const chemin = valeur.trim();
  if (!chemin.startsWith("/") || chemin.startsWith("//") || chemin.startsWith("/\\")) return defaut;
  // Caracteres de controle (tab, retour ligne) : ignores par les navigateurs
  // dans une URL, ils permettraient de reformer un "//".
  if (/[\u0000-\u001f\u007f]/.test(chemin)) return defaut;
  return chemin;
}
