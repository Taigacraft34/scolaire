---
target: tableau de bord (Le Cahier Seyes), 2e passe
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\Taiga\\Desktop\\web\\src\\app\\(app)\\page.tsx"
target_fingerprint: "sha256:68fbba4df39a90609aa8c2b907b1f204274775d8dab8c450815a304bbfed18a9"
target_path: "C:\\Users\\Taiga\\Desktop\\web\\src\\app\\(app)\\page.tsx"
timestamp: 2026-09-08T05-08-46Z
slug: src-app-app-page-tsx
---
# Critique — Tableau de bord « Le Cahier Seyès », 2e passe

Method: dual-agent (A: revue design · B: détecteur + navigateur) — run complet, non dégradé.

Cible : src/app/(app)/page.tsx · Mode : Operate · Après les correctifs P1/P2 de la passe précédente (26/40).

## Design Health Score — 28/40 (« Good », bas de fourchette · +2)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Ligne de fraîcheur de sync ajoutée ; mais les caps de liste (take: 10/30/8) silencieux, « En retard » sans compteur, la coche en attente ne fait que se désactiver. |
| 2 | Match System / Real World | 4 | Le point fort : français accentué, métaphore du cahier, « en retard / pour aujourd'hui / demain », « Aucun contrôle en vue. » |
| 3 | User Control and Freedom | 3 | Coche réversible ; suppressions en deux temps dans le monde, mais toujours définitives, sans undo (différé volontairement). |
| 4 | Consistency and Standards | 3 | La ligne du dashboard navigue ailleurs ; la ligne identique de /devoirs se déplie sur place. Formats de date : 02/09 / « jeudi 13 mars » / 08/09/2026. Deux patterns destructifs. |
| 5 | Error Prevention | 3 | Surface à faible risque ; zone tactile invisible agrandie ; coche réversible sans confirmation. |
| 6 | Recognition Rather Than Recall | 3 | Marques T/C ont gagné aria-label/title mais toujours aucune légende à l'écran ; « Auto », détection de mots-clés, obtention du token jamais expliqués. |
| 7 | Flexibility and Efficiency | 3 | Recherche deep-link + surlignage persistant ; pas de « tout marquer fait », pas de raccourcis, pas de filtre de triage. |
| 8 | Aesthetic and Minimalist Design | 3 | Sobre mais sous-informatif pour la largeur de colonne ; la réglure lit comme du bruit derrière du vide ; réglure quasi invisible en mode sombre. |
| 9 | Error Recovery | 2 | synchronisation.findFirst({ where: { statut: "SUCCES" } }) — une série de syncs en échec affiche quand même la dernière réussite comme si tout allait bien. |
| 10 | Help and Documentation | 1 | Aucune. Inchangé. |
| Total | | 28/40 | Good (bas de fourchette) |

## Design Specificity Verdict

Spécifique dans le vocabulaire et les gestes ; toujours interchangeable dans ce qu'il choisit de montrer et comment il le classe. Les correctifs P1/P2 ont été de vrais gains de qualité mais c'est de la réparation, pas la re-conception dont cette surface a encore besoin.

Revue design (A). Authored : le carreau imposé, le trait de marge à l'encre, la coche au stylo (trace-coche, respecte reduced-motion), le feuillet à coin corné, les intercalaires, une seule voix typo, src/lib/ui.ts comme fichier de vocabulaire unique. La nouvelle discipline du rouge et « Jamais synchronisé — configure ton token Scolengo » sont écrites pour la thèse « aucune surprise » de ce produit.

Toujours générique / échoue toujours son propre contrat :
- Contrat FIRST VIEWPORT non tenu. La date est toujours un <h1> normal dans la colonne de contenu ; la gouttière du dashboard reste vide sauf les cases. La ligne urgente reçoit font-display text-lg (1,125 rem) — un petit coup de pouce, pas les 1,85 rem que « la plus grosse » implique. ~60 % de vide vertical sur desktop, aucun point focal.
- Les jointures — la thèse du produit — absentes de la surface d'accueil. Principe PRODUCT.md n°3 : « Relier, pas seulement lister ». Le dashboard rend quatre groupes de todo plats et un feuillet. Pas d'emploi du temps du jour, pas de « prochain cours », pas de lien devoir→contrôle sur la ligne, pas de chapitres à réviser sur le feuillet. La seule jointure présente — la moyenne générale — est le texte le plus pâle, 12 px, en haut à droite.
- Classement interchangeable. « Aujourd'hui / À venir » en compartiments de dates, c'est la mise en page Todoist ; la réglure seyès est la seule chose qui la rend non générique, et sur cette page elle est surtout derrière du blanc.

Scan déterministe (B). impeccable detect --json sur 14 fichiers : exit 0, 1 seul finding, advisory — design-system-color sur GrilleEmploiDuTemps.tsx:217, le voile de la modale EDT rgb(12 14 26 / 0.55). B le juge faux positif : DESIGN.md ligne 199 documente cette valeur exacte en prose, mais le parseur de palette du détecteur ne lit que le bloc structuré. Le point de synthèse : le scanner n'a plus rien à dire. Tout ce qui reste est du jugement de composition, pas de l'hygiène de tokens.

Overlays visuels (B). Injection réussie, session Chrome authentifiée, en mode sombre. Live-server sur :8400 arrêté en fin de run (vérifié).

| Page | Total | Détail |
|---|---|---|
| / | 4 | cramped-padding x1, low-contrast x2, repeating-stripes-gradient x1 (FP = la réglure) |
| /devoirs | 11 | cramped-padding x1, low-contrast x9, stripes x1 |
| /emploi-du-temps | 16 | cramped-padding x1, low-contrast x14, stripes x1 |
| /calendrier | 7 | cramped-padding x1, text-overflow x5, stripes x1 |
| /notes | 3 | cramped-padding x1, low-contrast x1, stripes x1 |

- low-contrast : chaque instance = 4,49:1, il faut 4,5:1 — texte #9aa0b8 (--ink-soft sombre) sur #2c3660 (--ruling sombre). Marginal de 0,01. Une seule paire de tokens : éclaircir --ink-soft sombre d'un cran nettoie ~26 instances d'un coup.
- cramped-padding : un par page, le même élément — le conteneur d'en-tête partagé dans (app)/layout.tsx, contenu collé au border-bottom sans padding bas. Attrapé par le détecteur, pas isolé par la revue.
- text-overflow (/calendrier seul) : 5x p.truncate…text-xs débordent de 30 à 184 px. Portent .truncate donc coupés visuellement — FP par nature, mais le cas à 184 px dit que les cases de jour sont trop étroites. Le correctif P1 (min-w-0 overflow-hidden) a limité le débordement de grille sans régler la lisibilité.

## Overall Impression

La meilleure entrée que l'app ait jamais eue : « mardi 9 septembre » en Spectral + « Synchronisé il y a 2 h ». Puis l'œil se pose sur rien — pas d'ancre « prochaine chose », pas d'emploi du temps, et la ligne de sync rassurante peut mentir. Le dashboard a été rustiné trois fois (rouge, sync, case) mais jamais re-conçu. La plus grosse opportunité : en faire la seule surface où « cours → devoir dû pour ce cours » paie en un coup d'œil — y mettre enfin l'emploi du temps du jour, et utiliser la gouttière de marge pour autre chose que des cases.

## What's Working

1. La discipline du rouge est réelle maintenant. idAccent = (enRetard[0] ?? pourAuj[0])?.id, urgent confiné aux sections en-retard + aujourd'hui. La fausse alarme quotidienne a vraiment disparu. SlipControle imminent (<48 h) est une escalade propre.
2. La ligne de fraîcheur de sync. Une ligne, le bon poids, lien vers /parametres, distingue « jamais synchronisé » d'un horodatage relatif, voix du monde.
3. Zone tactile + libellés de CaseCoche. Le pseudo before: s'étend -left-[2.6rem] dans la gouttière vide pendant que la boîte visuelle reste à 1,15 rem ; aria-label par devoir remplace 8 boutons identiques.

## Priority Issues

### [P1] Le dashboard ne montre ni emploi du temps ni jointures — la thèse du produit est absente de sa page d'accueil
Pourquoi : principe n°3 (« Relier, pas lister »), le STORY (« ce qu'il faut réviser »), la jointure phare « cours → devoir dû pour ce cours ». L'écran de triage 10 s rend quatre groupes de todo plats et un feuillet. Tout ce qui rend ça non-générique vit sur d'autres onglets → le lycéen quitte le dashboard pour voir sa vraie journée.
Fix : une bande « Aujourd'hui » — les séances du jour en lignes réglées, l'heure dans la gouttière de marge, chaque séance portant son devoir/contrôle lié en ligne. Donner à SlipControle des étiquettes de chapitres liés (« à réviser : … »). Rendre le spawn devoir→contrôle sur la ligne.
Commande : /impeccable layout src/app/(app)/page.tsx

### [P1] Contrat FIRST VIEWPORT toujours non tenu — date pas dans la marge, « prochaine chose » pas la plus grosse
Pourquoi : le contrat est explicite ; la date est un <h1> normal dans la colonne, la ligne urgente n'a que text-lg. Aucun point focal, ~60 % de vide sur desktop.
Fix : déplacer la date dans la gouttière gauche (jour en mono / mois en Spectral, empilés). Libérer le haut de page pour l'unique obligation la plus urgente à vraie taille display (1,85 rem). Faire descendre « Demain / Cette semaine » en taille et poids.
Commande : /impeccable layout src/app/(app)/page.tsx

### [P1] Fausse confiance sur une sync périmée — « Synchronisé il y a 2 h » peut être un mensonge
Pourquoi : prisma.synchronisation.findFirst({ where: { statut: "SUCCES" }, … }) (page.tsx:69-73, code du correctif P2). Une série de syncs en échec affiche quand même le dernier horodatage de réussite comme sain. La promesse n°1 du produit est cassée en silence, et la ligne rassurante pousse à y croire davantage.
Fix : interroger la dernière sync quel que soit son statut ; si la plus récente a échoué, ou si la dernière réussite est plus vieille que la cadence, rendre la ligne en rouge Bic — « Dernière synchro en échec il y a 20 min » / « Rien reçu depuis 3 jours ».
Commande : /impeccable harden src/app/(app)/page.tsx

### [P2] « En retard » n'a pas de compteur et un cap silencieux à 10
Pourquoi : take: 10 (page.tsx:50) ; le titre ne porte aucun nombre alors que chaque titre de /devoirs en a un (· {count}). Un backlog de 14 s'affiche comme 10, sans « +4 » ni total — or l'ampleur du backlog est le nombre le plus utile d'un écran de triage.
Fix : titreSection + " · {count}" ; si capé, une ligne « voir tout » vers /devoirs.
Commande : /impeccable layout src/app/(app)/page.tsx

### [P2] Ligne d'obligation : naviguer-ailleurs vs déplier-sur-place, + affordance de repos faible
Pourquoi : la ligne du dashboard pointe vers /devoirs?focus= ; la ligne identique de /devoirs ouvre un <details>. Même ligne seyès, deux modèles mentaux. La ligne ne se souligne qu'au survol — au tactile rien ne signale que le texte est cliquable.
Fix : soit déplier en ligne sur le dashboard aussi (description + lien secondaire « ouvrir dans Devoirs »), soit garder la navigation mais ajouter un IconeChevronDroite persistant dans la gouttière droite.
Commande : /impeccable adapt src/components/LigneObligation.tsx

### [P3] Pas d'état optimiste sur le geste signature
Pourquoi : CaseCoche soumet une server action ; pendant pending le bouton se désactive et dessine le trait, mais la ligne ne se barre/grise pas avant le retour serveur — 1 à 3 s de « ça a marché ? » sur le wifi du lycée, sur le geste central du produit, en marchant.
Fix : useOptimistic — appliquer le barré vert + la chute au graphite immédiatement, réconcilier à la réponse.
Commande : /impeccable harden src/components/CaseCoche.tsx

## Persona Red Flags

Jordan (première fois) : « Jamais synchronisé — configure ton token Scolengo » pointe vers /parametres, un textarea JSON brut + lien CLI externe sans walkthrough — une impasse. Première vue post-setup = une section « En retard » pleine d'items rouges de l'historique MBN qui se lit « tu es déjà en échec ». Aucun état de bienvenue. Le coin corné du feuillet ne signale pas que c'est un lien.

Sam (accessibilité) : amélioré — aria-label distinct par case, aria-pressed. Restent : la puce rouge des lignes sans devoir (LigneObligation.tsx:33-36) est aria-hidden sans alternative texte. accent n'agrandit que le texte, aucun <strong> / emphase sémantique. Le lien moyenne coupe « 12,4 » et « /20 » sur trois spans. La réglure en mode sombre = perte du repère structurel pour la basse vision.

Casey (mobile) : après l'inset pl-[calc(var(--marge)+var(--carreau))] (~84 px sur un écran de 360), plus le préfixe capitales de matière, plus la date, le texte truncate de la tâche est écrasé à presque rien. La zone tactile de la case atteint -left-[2.6rem] contre une marge mobile de 3,5 rem — ~1 rem de dégagement, à vérifier sur les téléphones les plus étroits. Rangée de 7 intercalaires qui scrolle sans fondu de bord — « Emploi du temps » / « Administration » hors écran sans affordance.

Le lycéen dans le couloir : gains — le rouge est fiable, la ligne de sync est là. Pertes — (1) pas de « prochain cours », il ouvre quand même l'onglet EDT ou l'app officielle ; (2) marquer fait en marchant n'a aucun retour optimiste ; (3) un dashboard vide aujourd'hui ne lui donne rien à faire en 10 s ; (4) « En retard » sans compteur ne lui dit pas si c'est 2 ou 20.

## Minor Observations

- Dérive des formats de date : 02/09 (sans année) / « jeudi 13 mars » / 08/09/2026 / locale complète sur /controles.
- pourPlusTard renommé « Cette semaine et après » mais toujours .slice(0, 8) silencieux.
- De-dup « Autres contrôles » vs le feuillet : confirmé résolu (c.id !== prochainControle?.id).
- « Autres contrôles cette semaine » rend la puce rouge par défaut pour chaque contrôle quelle que soit sa proximité — un peu contre la règle du rouge resserrée.
- SlipControle est coincé entre « cette semaine » et « autres contrôles » — le contrôle le plus important est enterré au milieu du scroll.
- Mode sombre : --ruling #2c3660 sur --paper #151b2e — les lignes disparaissent presque. « Le Cahier Seyès » est en pratique un payoff mode-clair seulement. Assessment B le confirme : 26 findings low-contrast à 4,49:1, tous cette paire de tokens.
- cramped-padding sur l'en-tête de chaque page (contenu collé au filet du bas, (app)/layout.tsx) — attrapé par le détecteur.
- Le wordmark « Scolaire » est en dur dans layout.tsx:34 alors que PRODUCT.md dit le nom provisoire.
- 6 en retard + 3 aujourd'hui = 9 lignes rouges grasses — légitimement urgentes, mais leur propre forme de densité.

## Questions to Consider

1. Le dashboard est la seule surface où « cours → devoir dû pour ce cours » pourrait payer en un coup d'œil — et c'est la seule sans emploi du temps dessus. Pourquoi l'écran de triage t'oblige-t-il à le quitter pour trier ?
2. Si « aucune surprise » est la promesse n°1, pourquoi le dashboard est-il architecturalement incapable de te dire que la sync est cassée (where: { statut: "SUCCES" }) ?
3. Le contrat dit « la prochaine chose la plus grosse, en haut de page ». Aujourd'hui la plus grosse chose de la page est la date.
4. Trois critiques plus tard, le dashboard a été rustiné mais jamais re-conçu. « Operate » est-il lu comme « lister ce qui est dû » alors que le STORY demande « lire ta semaine comme ton agenda papier » ?
5. À quoi ressemblerait cette page si la gouttière de marge servait à autre chose que des cases à cocher ?
