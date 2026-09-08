// Vocabulaire visuel du Cahier Seyès, en un seul endroit : toutes les pages y
// puisent, pour que chaque écran soit visiblement la même page réglée.
// Coins carrés (radius 2px), zéro ombre, la couleur reste sémantique.

// Bouton principal : l'encre bleue pleine, capitales, coin carré.
export const boutonPrincipal =
  "inline-flex items-center justify-center gap-1.5 rounded-sm bg-ink-blue px-4 py-1.5 " +
  "font-body text-sm font-bold uppercase tracking-wide text-paper " +
  "transition-colors hover:bg-ink-blue-strong disabled:opacity-40 disabled:pointer-events-none";

// Bouton secondaire : le texte à l'encre, souligné d'un trait qui épaissit.
export const boutonSecondaire =
  "inline-flex items-center gap-1.5 font-body text-sm font-bold text-ink-blue " +
  "underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] " +
  "hover:decoration-2 disabled:opacity-40 disabled:pointer-events-none";

// Bouton encadré : pour les actions neutres qui ont besoin d'une cible large.
export const boutonEncadre =
  "inline-flex items-center justify-center gap-1.5 rounded-sm border border-ink-soft/60 " +
  "px-3 py-1.5 font-body text-sm font-bold text-ink transition-colors " +
  "hover:border-ink-blue hover:text-ink-blue disabled:opacity-40 disabled:pointer-events-none";

// Action destructrice : au stylo rouge.
export const boutonRouge =
  "inline-flex items-center gap-1 font-body text-xs font-bold text-bic-red " +
  "underline decoration-1 underline-offset-4 hover:decoration-2";

// Champ de saisie / select / textarea : un cadre fin sur la page.
export const champ =
  "w-full rounded-sm border border-ink-soft/55 bg-paper px-2.5 py-1.5 font-body text-sm " +
  "text-ink placeholder:text-ink-soft/70 outline-none transition-colors " +
  "focus:border-ink-blue";

// Intitulé de champ : petit, à l'encre douce, au-dessus du champ.
export const label = "font-body text-xs font-bold uppercase tracking-wide text-ink-soft";

// Rangée de champs : empilée sur mobile, en ligne qui s'enroule au-delà.
export const rangeeChamps = "flex flex-col gap-3 sm:flex-row sm:flex-wrap";

// Un champ + son intitulé : pleine largeur sur mobile, flexible en ligne au-delà.
export const blocChamp = "flex flex-col gap-1 sm:min-w-40 sm:flex-1";

// Titre de page (h1) : deux carreaux de haut, posé sur la ligne.
export const titrePage =
  "font-display text-[1.85rem] font-semibold leading-[calc(var(--carreau)*2)] text-ink";

// Titre de section (h2) : petites capitales à l'encre, comme un intitulé écrit.
export const titreSection =
  "font-body text-xs font-bold uppercase tracking-[0.12em] text-ink-blue";

// Encart : une feuille posée sur la page (pas une carte à ombre). Fond très
// légèrement décalé, coin carré, filet fin.
export const encart = "rounded-sm border border-ink-soft/25 bg-paper-2/60 p-4";

// Étiquette de matière : un petit onglet rempli, capitales condensées.
export const etiquette =
  "inline-flex items-center rounded-sm bg-ink-blue/10 px-1.5 py-0.5 font-body " +
  "text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue";
