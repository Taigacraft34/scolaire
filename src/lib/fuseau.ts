// Heure "murale" d'une date dans le fuseau de l'utilisateur. Les dates Scolengo
// sont stockées en UTC ; pour aligner une grille horaire ou lister les cours du
// jour, on veut l'heure locale affichée, pas l'heure serveur.
export function partiesFuseau(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const val = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const h = Number(val("hour"));
  const m = Number(val("minute"));
  return {
    minutes: h * 60 + m,
    label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    cleJour: `${val("year")}-${val("month")}-${val("day")}`,
  };
}

// Jour de la semaine d'une date dans le fuseau de l'utilisateur, numéroté
// comme les rappels : 1 = lundi ... 7 = dimanche.
export function jourSemaineFuseau(date: Date, timeZone: string): number {
  const court = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  const index = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(court);
  return index + 1;
}
