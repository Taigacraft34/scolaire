---
version: 1
slug: "src-app-app-page-tsx"
primary_target: "src/app/(app)/page.tsx"
related_targets: ["src/app/globals.css","src/app/(app)/layout.tsx","src/app/(app)/devoirs/page.tsx","src/app/(app)/controles/page.tsx","src/app/(app)/notes/page.tsx","src/app/(app)/emploi-du-temps/page.tsx","src/app/(app)/calendrier/page.tsx","src/app/(app)/cours/page.tsx","src/app/(app)/parametres/page.tsx"]
---

# Surface brief — Plateforme scolaire (refonte complète)

**Scope:** the whole app — every route and shared shell. **Visitor mode:** Operate.
**Audience / job:** a French lycéen, several times a day, deciding what to do next and what to revise; on phone (hallway) and desktop (evening).
**Preserve:** all features, content, French accented copy, dark mode, PWA, page structure, Next 16 / Tailwind v4 / Prisma / RSC stack. Only the look changes.

## Direction contract

THESIS: The whole app is one continuous *seyès* page — the ruled sheet every French student writes homework on — not a dashboard of cards floating on a page-shaped background. It refuses the sidebar-plus-card-grid ed-tech dashboard.

OWN-WORLD: Bright Clairefontaine white. The 8mm seyès *carreau* is the only layout unit — every measure a multiple of it. One bold school-ink-blue margin rule down the left of every screen; faint blue-violet ruling behind content; type set on the baseline. Bic 4-colour semantics, strict: blue = structure, graphite = body, red = to-do / important / teacher's mark, green = done. Navigation is *classeur* intercalaire tabs. No shadows, no card borders over 1px, no coloured left-stripe accents — state is drawn *into* the page (a margin tick, a struck line, a red mark). Icons hand-inked on the grid. Dark mode = the same page at night under a desk lamp: deep ink-blue ground, luminous ruling, warm off-white ink.

STORY: The student reads their week like their own paper agenda — the next thing biggest, at the top of the page. They trust it because it looks like the cahier they already keep, and marking something done feels like ticking their own margin.

FIRST VIEWPORT (dashboard `/`): a full-viewport ruled page. Margin rule at 4 carreaux from the left; today's date stacked in the margin. Right of the margin, on the lines: a "Pour aujourd'hui" heading, then each obligation on its own ruled line — subject in small blue caps, the task in graphite, an empty checkbox in the margin gutter. The single most urgent line is set in Bic red. Below, lighter and tighter: "Demain", "Cette semaine"; the prochain contrôle as a torn-corner slip clipped to the page. Primary action sits in the margin gutter: tick the box → a green pen-stroke check is drawn onto the line.

FORM: "Le Cahier Seyès" — the seyès-ruled cahier. #1 of the resonance-ordered grounded list (the roll assigned #3, "L'Emploi du Temps"; the user pinned this pick). Seed key 6ce60b37.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Honest risk & counter

The seyès page is the reflexive "French school" move — as decoration it is a skin, not a system. Countered by: the 8mm carreau as the single enforced layout unit; Bic colours kept strictly semantic (never decorative); state drawn into the page rather than floated on a page-shaped background; and one real committed type voice, not a handwriting costume.

## Signature moment

Marking a devoir or contrôle done: a green Bic checkmark is drawn into the left margin beside its line (~200ms pen-stroke, exponential ease-out), the line takes a single green strike-through, and any linked item (the timetable badge, a linked contrôle, the grade cell) updates in the same beat.

## Cross-surface reach

Devoirs / Contrôles: ruled lists, urgent line in red, contrôle as a torn slip. Notes: the grade written large in the margin in Bic red, like a teacher's mark ("14/20"). Cours: the chapter as a filled page, blocs on the ruling. Emploi du temps: the timetable is literal carreaux, times on the horizontal rules, no left-stripe — subject shown as a small filled tab. Calendrier: a month as a grid of carreaux. Paramètres / Admin: forms written on ruled lines.

## Unresolved (decide in build)

- Type: aim for **Luciole** (French, OFL, legibility POV) for UI/body + **Spectral** (Paris foundry, Google-hosted) for display headings; tabular figures for grids. Fall back to a self-hosted neutral only if bundling blocks — never the platform system face.
- Exact school-ink-blue / ruling-violet / Bic red+green hex values.
- Whether intercalaire tabs live top (mobile) vs right edge (desktop).
