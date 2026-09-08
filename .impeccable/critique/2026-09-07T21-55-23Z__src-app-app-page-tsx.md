---
target: tableau de bord (redesign Le Cahier Seyes)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\Taiga\\Desktop\\web\\src\\app\\(app)\\page.tsx"
target_fingerprint: "sha256:83e47501105c5cd76f96b498fe77ec568c5f1f6958266a958b05d2d1a85963f2"
target_path: "C:\\Users\\Taiga\\Desktop\\web\\src\\app\\(app)\\page.tsx"
timestamp: 2026-09-07T21-55-23Z
slug: src-app-app-page-tsx
---
# Critique — « Le Cahier Seyès » (cible : le tableau de bord, src/app/(app)/page.tsx)

Method: dual-agent (A: abf1db5e67695c9c6 · B: a7b1c0d2d86255537)

## Design Health Score — 26/40 (Acceptable, bas de fourchette)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Pas de fraîcheur de sync sur le tableau de bord ; CaseCoche en attente ne fait que se désactiver ; débordement onglets mobile sans indicateur. |
| 2 | Match System / Real World | 4 | Le point fort : français accentué, métaphore du cahier tenue. |
| 3 | User Control and Freedom | 3 | Coche réversible ; mais suppressions définitives derrière confirm(), aucun undo. |
| 4 | Consistency and Standards | 3 | Formats de date variables ; ligne dashboard = naviguer / ligne /devoirs = déplier ; confirm() vs mot tapé ; onglet « Bord » vs « Tableau de bord ». |
| 5 | Error Prevention | 3 | Mot tapé pour le reset ; confirm() ailleurs ; erreurs de formulaire en haut de section pas à côté du champ. |
| 6 | Recognition Rather Than Recall | 2 | Marques T/C de l'EDT sans légende ; étiquette « Auto » inexpliquée ; couleurs de matière EDT contre la sémantique Bic. |
| 7 | Flexibility and Efficiency | 3 | Recherche deep-link + surlignage efficace ; aucun raccourci, pas de « tout cocher ». |
| 8 | Aesthetic and Minimalist Design | 3 | POV sobre ; mais réglure = bruit sur pages denses ; dashboard sous-informatif. |
| 9 | Error Recovery | 2 | Erreurs = chaînes ?erreur= génériques. |
| 10 | Help and Documentation | 1 | Aucune. Connexion Scolengo = textarea JSON brut. T/C, mots-clés, « Auto » jamais expliqués. |

## Design Specificity Verdict

Spécifique dans son vocabulaire et ses gestes signature ; générique dans l'architecture des pages et dans le peu qu'il investit dans les jointures (la thèse du produit).

Système, pas déco : --carreau est une vraie unité imposée (pas de la décoration) ; le geste signature (coche verte qui se dessine, trace-coche, barré vert, prefers-reduced-motion) ; feuillet corné, EDT en carreaux, intercalaires, une seule voix typo.

Peau, pas système : (1) uniformité structurelle — toutes les pages = « un h1 + une pile de titreSection sur des lignes réglées », y compris le dashboard dont le job est différent ; (2) le dashboard ne respecte pas son contrat FIRST VIEWPORT (date pas dans la marge, urgent seulement recoloré jamais agrandi, ~70% vide desktop) ; (3) la « page continue » est un dégradé réglé derrière un layout sectionné classique (en-tête non réglé séparé, encart p-4 non-carreau) ; (4) les jointures rendues comme les éléments les plus petits et pâles.

Deterministic scan : 6 findings toutes advisory (exit 0). 4x design-system-font-size (text-[0.62rem]/0.6rem calendrier + GrilleEmploiDuTemps), 1x color (rgb(12 14 26 / 0.55) voile modale), 1x radius. DESIGN.md vérifié à jour. Ces advisories = au pire une lacune de doc : le sidecar design.json spécifie ces valeurs exactes, mais pas le frontmatter DESIGN.md.

Visual overlays : injecté sur /, /devoirs, /emploi-du-temps, /notes, /calendrier (live-server arrêté en fin de run). /emploi-du-temps ~57 findings (low-contrast x31, undersized-ui-text x25) ; /calendrier 29 (undersized x18 + tiny x6, text-overflow x2, tight-leading) ; /devoirs 12 (low-contrast x10 = 3.8:1 ink-soft sur ruling). repeating-stripes-gradient sur body = la réglure = faux positif.

## What's Working

1. Le geste signature (CaseCoche + trace-coche, barré vert, chute au graphite, reduced-motion global) — on coche sa propre marge.
2. Le système de tokens impose vraiment le monde (--carreau triple emploi, radius 2px, ui.ts fichier de vocabulaire unique, icônes tracées main sans emoji).
3. La recherche efficace et dans le ton (debounce, annulable, onglets + compteurs, deep-link ?focus= vers surlignage persistant).

## Priority Issues

### [P1] La teinte par matière de l'EDT : illisible ET ment sur l'état
Quoi : color-mix(matière 55%) bordure + color-mix(matière 12%, --paper) fond + texte color-mix(matière 78%, --ink). MATHEMATIQUES = bloc rouge, ENSEIGN.SCIENT = blocs verts. Contrastes : cyan #0ad1d2/#dffdfb = 1.8:1, #8aa6c7/#f2f7fa 2.3:1.
Pourquoi : surface consultée 2x/jour ; rouge = urgent, vert = fait -> un bloc de cours rouge se lit comme une alerte. Échoue WCAG.
Fix : supprimer le fond teinté ; matière = petite etiquette remplie dans le bloc (le contrat le dit) ; bordure neutre 1px ; rouge/vert réservés aux marques T/C + annulé.
Commande : /impeccable layout src/app/(app)/emploi-du-temps

### [P1] La case à cocher de la marge : cible 18px ET posée sur le trait de marge
Quoi : CaseCoche = grid h-[1.15rem] w-[1.15rem] (~18px) dans marge mobile de 56px, pour l'action n°1 d'un produit mobile-first. Positionnée right-full mr-2.5 elle atterrit par-dessus .cahier-marge::before.
Pourquoi : ratée en marchant (min tactile ~44px) ; sabote l'élément structurel le plus clair du monde sur chaque ligne.
Fix : zone de clic >=44x44 (padding ou ::before) en gardant la boîte visuelle 1.15rem ; décaler la case dans la gouttière à gauche du trait.
Commande : /impeccable adapt sur CaseCoche.tsx / LigneObligation.tsx / layout.tsx

### [P1] Texte sous-dimensionné et débordant sur les surfaces en grille
Quoi : text-[0.62rem] rend à 9.92px (sous le plancher 11px) — plages horaires EDT, noms de matière calendrier, titres de devoirs. Sur /calendrier, p.truncate.text-[0.62rem].leading-tight déborde sa boîte de 126px et 68px malgré .truncate (parent ne borne pas la largeur) + leading-tight (1.25 < 1.3).
Pourquoi : accessibilité + le lycéen doit lire ces libellés d'un coup d'œil ; le débordement casse la grille.
Fix : plancher text-xs (0.75rem) pour tout texte à lire ; min-w-0 sur la case calendrier ET ses enfants flex ; leading-snug.
Commande : /impeccable adapt (plancher typo) + /impeccable layout (débordement calendrier)

### [P2] Le tableau de bord ne fait pas son job (contrat FIRST VIEWPORT non tenu + fatigue du rouge)
Quoi : date = h1 normal pas « stacked in the margin » ; item urgent seulement recoloré jamais agrandi ; idUrgent = (pourAuj[0] ?? pourDemain[0]) -> quand rien aujourd'hui, le premier item de demain devient rouge vif même banal -> ligne rouge d'alarme quasi tous les jours ; ~70% vide desktop ; pas de ligne de sync ; rien sur les contrôles quand aucun en vue.
Pourquoi : surface ouverte 5x/jour pour triage 10s, ni ne guide l'œil ni n'inspire confiance ; « Aucune surprise » tombe si le rouge crie au loup.
Fix : date empilée dans la gouttière ; prochain devoir en taille display (Spectral 1.85rem+) ; rouge restreint à vraiment urgent (dû aujourd'hui / en retard / contrôle < 48h) ; ligne de sync + « Aucun contrôle en vue ».
Commande : /impeccable layout src/app/(app)/page.tsx

### [P2] Les actions destructrices cassent le monde et n'ont pas de filet
Quoi : BoutonSupprimer -> confirm() natif, suppression définitive, aucun undo, sur devoirs/contrôles/copies. Incohérent avec la confirmation par mot tapé du reset — l'action plus destructrice a le garde-fou plus faible.
Pourquoi : dialogue système brut dans un monde peaufiné ; irréversible ; items manuels perdus.
Fix : réutiliser ConfirmationSuppression pour les suppressions unitaires + « Annuler » de quelques secondes.
Commande : /impeccable harden sur les composants de suppression

## Persona Red Flags

Jordan (première fois) : connexion Scolengo = textarea JSON brut + lien CLI externe, aucun walkthrough. Dashboard : « MATHEMATIQUES Exercices » rouge gras sans date -> lu comme en retard. EDT : cercles T/C 15px sans légende. « Auto » inexpliqué.

Sam (accessibilité) : chaque CaseCoche s'annonce à l'identique (title=Marquer terminé, pas de nom de devoir) -> 8 boutons indiscernables. GrilleEmploiDuTemps : libellés pâles color-mix échouent le contraste ; séances sans devoir = button disabled donc salle/prof ni focusables ni lisibles. BasculeTheme n'a qu'un title. Positif : note aria-hidden + sr-only ; reduced-motion global.

Casey (mobile) : case 18px dans 56px ; après inset 84px il reste ~200px pour LigneObligation -> le titre truncate à presque rien. Onglets overflow-x sans fondu de bord -> « Emploi du temps »/« Administration » hors écran sans affordance. Note dans la marge chevauche le trait + serre le bord ~32px.

Lycéen dans le couloir (persona projet) : la ligne « Demain » est la faussement-rouge -> le rouge ne dit rien de l'urgence réelle. Pas d'horodatage sync sur le dashboard. Aucune ligne contrôle quand rien prévu -> ambigu. Cocher = tap précis sur 18px en marchant.

## Minor Observations

- Dérive des formats de date (09/09 vs 16/09/2026 vs jour complet vs 08/09/2026).
- Mode sombre : réglure et feuillets disparaissent (--ruling #2c3660 sur --paper #151b2e) — perd l'identité de page réglée.
- « Aujourd'hui » du calendrier = disque rouge plein = 5e rôle du rouge Bic, au milieu des puces rouges de contrôles.
- Dashboard « Contrôles de la semaine » ne s'affiche que si > 1, et le premier item = aussi le SlipControle au-dessus -> doublon.
- Recherche déclenchée dès 1 caractère.
- .regle background-position calc(--carreau * -0.28) = fudge fragile au changement de métrique/zoom ; sombre = texte au-dessus de la réglure.
- encart p-4 (16px) non-carreau -> texte formulaire non aligné sur la réglure (visible /parametres).
- disposerJournee force hauteur mini 25 min -> séances courtes toutes même hauteur.
- DESIGN.md : ajouter au frontmatter le palier < 0.75rem et la couleur de voile de modale (6 advisories du détecteur).
- Onglet « Bord » : abréviation étrange.
- cramped-padding signalé sur l'en-tête de chaque page.

## Questions to Consider

1. Pourquoi le dashboard est-il la page la plus vide ET structurellement identique à /devoirs ?
2. Pourquoi chaque jointure (la thèse du produit) est-elle l'élément le plus petit et pâle de sa page ?
3. Combien de sens un seul rouge Bic peut-il porter (à faire, urgent, note du prof, erreur, aujourd'hui, matière EDT) avant qu'un coup d'œil ne dise plus rien ?
4. Si on ne voit pas les lignes en mode sombre, est-ce encore Le Cahier Seyès ?
5. Que dit la couture confirm()-Chrome sur ce qui est réel et ce qui est peint par-dessus ?
