// Un seul endroit pour l'affichage des dates, pour que toute l'app parle le même
// format : « 02/09 » dans les listes serrées, « mardi 9 septembre » dans les
// titres et les feuillets, un délai relatif pour la fraîcheur.

export function dateCourte(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function dateMoyenne(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function dateLongue(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export function ilYa(quand: Date, maintenant: Date = new Date()): string {
  const min = Math.round((maintenant.getTime() - quand.getTime()) / 60_000);
  if (min < 2) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return j === 1 ? "hier" : `il y a ${j} jours`;
}
