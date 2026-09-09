---
name: Le Cahier Seyès
description: A French lycéen's school life — homework, assessments, grades, timetable — written onto one continuous seyès-ruled page.
colors:
  paper: "#efe9d8"
  paper-2: "#e4ddc8"
  ink: "#2c2c34"
  ink-soft: "#63636f"
  ink-blue: "#2540c8"
  ink-blue-strong: "#1a2f9c"
  ruling: "#c6cef0"
  bic-red: "#cf1f2e"
  bic-green: "#1c7a45"
  surligneur: "#372ebe"
typography:
  display:
    fontFamily: "Spectral, Georgia, 'Times New Roman', serif"
    fontSize: "1.85rem"
    fontWeight: 600
    lineHeight: "3.5rem"
    letterSpacing: "normal"
  headline:
    fontFamily: "Spectral, Georgia, 'Times New Roman', serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.4"
    letterSpacing: "normal"
  title:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1.75rem"
    letterSpacing: "0.12em"
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.75rem"
    letterSpacing: "normal"
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1.75rem"
    letterSpacing: "0.05em"
  mono:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1.75rem"
    letterSpacing: "normal"
    fontFeature: "'tnum'"
rounded:
  sm: "2px"
spacing:
  carreau: "1.75rem"
  demi-carreau: "0.875rem"
  marge: "7rem"
  marge-mobile: "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.ink-blue-strong}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 0.75rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-blue}"
    typography: "{typography.label}"
    padding: "0"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.bic-red}"
    typography: "{typography.label}"
    padding: "0"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 0.625rem"
  card:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "1rem"
  chip:
    backgroundColor: "{colors.ink-blue}"
    textColor: "{colors.ink-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.125rem 0.375rem"
  nav-tab:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 0.75rem"
---

# Design System: Le Cahier Seyès

## Overview

**Creative North Star: "Le Cahier Seyès"**

The whole application is one continuous seyès-ruled page — the ruled sheet every French lycée student writes their homework on — not a dashboard of cards floating on a page-shaped background. A student opens it several times a day to decide what to do next and what to revise, and it earns trust by looking like the cahier they already keep: bright Clairefontaine-white ground, a bold school-ink-blue rule down the left margin, faint blue-violet ruling behind the content, and every line of type set down onto the baseline.

The 8mm carreau is the single layout unit. `--carreau` is `1.75rem` (28px); it is simultaneously the ruling pitch, the body line-height, and the module every gap, padding and measure is a multiple of. The left margin rule sits at four carreaux from the edge (`--marge`, halved to two on mobile). Colour follows strict Bic four-colour semantics and never decorates: ink-blue is structure, links, and the margin; graphite (`--ink`) is body text; Bic red is to-do / important / a teacher's mark / an error; Bic green is done. State is drawn *into* the page — a green pen-stroke check in the margin, a single strike-through, a red grade written large in the margin on the Notes page — rather than floated above it. Navigation is a row of classeur intercalaire tabs with the active tab joined to the page.

The system explicitly refuses the sidebar-plus-card-grid ed-tech dashboard, resting shadows, card borders over 1px, coloured left-stripe accents, and any glyph or emoji iconography (icons are an authored hand-inked SVG set, one ~1.6 stroke weight, round caps). Dark mode is the same page at night under a desk lamp: deep ink-blue ground (`--paper` `#151b2e`), luminous ruling, warm off-white ink; it is class-driven (`.dark`), user-toggled, and persisted.

**Key Characteristics:**
- One continuous ruled page; no floating card grid.
- The 8mm carreau (`1.75rem`) is the only layout unit — every measure is a multiple of it.
- Bold ink-blue margin rule at 4 carreaux left; faint blue-violet ruling behind content.
- Strict Bic four-colour semantics; colour is never decorative.
- Square corners (2px), 1px lines only, no resting shadows.
- Spectral serif for titles, Atkinson Hyperlegible for body, Fragment Mono for figures — all set on the carreau baseline.
- State is drawn into the page: margin tick, struck line, red teacher's mark.
- Dark mode is a first-class night version of the same page, `.dark`-driven and persisted.

## Colors

A bright paper ground carrying one blue voice for structure and a strict two-colour Bic pen for state. Everything else is graphite and ruling-violet.

### Primary
- **École Ink-Blue** (`#2540c8`): the structural voice — the left margin rule (`.cahier-marge::before`), every link, the active intercalaire tab, section headings (`titreSection`), the primary button fill, `::selection`, `caret-color`, `accent-color`, and the focus-visible outline. Deepens to **Ink-Blue Strong** (`#1a2f9c`) on primary-button hover and for the strongest headings in dark mode.

### Secondary (state — the Bic pen)
- **Bic Red** (`#cf1f2e`): to-do, the single most urgent line, "important", a teacher's mark, and form errors. The grade on the Notes page is written large in the margin in this colour, like a red pen.
- **Bic Green** (`#1c7a45`): done — the pen-stroke check drawn in the margin, the strike-through on a completed line, the "Terminé" state.

### Tertiary
- **Surligneur Blue-Violet** (`#372ebe`, exposed as `--tache` in RGB channels): only the search-highlight wash (`.mise-en-avant`) — a translucent highlighter bleed behind a jumped-to line plus an inked bracket in the margin. Never used opaque.

### Neutral
- **Clairefontaine Paper** (`#efe9d8`): the page ground — a warm, dimmed ivory rather than near-white, kept easy on the eyes at screen brightness. In dark mode, deep ink-blue `#151b2e`.
- **Page Fold** (`#e4ddc8`): a leaf laid on the page — the fill of an `encart`, an intercalaire tab at rest, a torn-corner slip. One faint step off paper; dark mode `#1c2440`.
- **Graphite** (`#2c2c34`): body text. Dark mode warm off-white `#e9e7dc`.
- **Soft Graphite** (`#63636f`): secondary text, field labels, timestamps, counts, resting field and tab borders (always at reduced opacity). Dark mode `#9aa0b8`.
- **Ruling Violet** (`#c6cef0`): the horizontal (and, on squared pages, vertical) ruling behind content, plus dividers and the scrollbar thumb. Dark mode `#2c3660`.

### Named Rules
**The Bic Four-Colour Rule.** Ink-blue = structure / links / margin. Graphite = body. Bic red = to-do / important / teacher's mark / error. Bic green = done. A new surface uses exactly these four roles; introducing a fifth hue is off-system. Subject colours from Scolengo are the one sanctioned exception and appear only as a 1px full border plus a ~12% tinted fill plus coloured caps — never a stripe.

**The Colour Is Never Decorative Rule.** If a colour on screen is not carrying one of the four semantic roles, it is a bug. Test: name the role of every non-graphite mark on the page. No answer means remove it.

## Typography

**Display Font:** Spectral (with `Georgia, "Times New Roman", serif`) — the parisian screen-serif voice of titles, "school textbook" register.
**Body Font:** Atkinson Hyperlegible (with `system-ui, sans-serif`) — chosen for pure legibility, the text a student reads ten times a day, set on the ruling.
**Mono Font:** Fragment Mono (with `ui-monospace, monospace`) — figures and codes: times, dates, grades, Scolengo abbreviations, aligned like written columns.

**Character:** a serious, unfussy schoolbook. Spectral gives page titles a printed-textbook weight; Atkinson keeps the reading surface calm and maximally legible; Fragment Mono lines figures up on the baseline as if hand-tabulated. There is one committed type voice, not a handwriting costume.

### Hierarchy
- **Display / Page Title** (Spectral, 600, `1.85rem`, line-height `calc(var(--carreau)*2)` = `3.5rem`): the `<h1>` on each page, occupying two carreaux; the header wordmark steps to `1.5rem` (`text-2xl`).
- **Headline** (Spectral, 600, `1.125rem`, tight leading): a slip or modal heading — the prochain-contrôle slip, the timetable lesson modal, a note's subject line.
- **Title / Section** (Atkinson, 700, `0.75rem`, `tracking-[0.12em]`, uppercase, ink-blue): section headings written as small inked capitals (`titreSection`). It labels, it does not announce.
- **Body** (Atkinson, 400, `1rem`, line-height `var(--carreau)`): the workhorse — every list line, form value, description. Always leaded to the carreau so text sits on the ruling.
- **Label** (Atkinson, 700, `0.75rem`, `tracking-wide`, uppercase, soft graphite): field labels, the etiquette subject tag, tab captions, "Prochain contrôle" kickers on the slip.
- **Mono / Figures** (Fragment Mono, 400, `0.75rem`, `font-variant-numeric: tabular-nums` via `.tabulaire`): all times, dates, coefficients, counts, and grades.

### Named Rules
**The Baseline Rule.** Body text is leaded to exactly `var(--carreau)` (`line-height: var(--carreau)`) so every line lands on the ruling. New text blocks inherit the carreau leading; never set an arbitrary line-height on reading copy.

**The Figures Are Tabular Rule.** Anything that is data — a time, a grade, a date, a count — is set in Fragment Mono with `.tabulaire` so columns align. Prose is never set in mono.

## Layout

One centred column, `max-w-[calc(var(--carreau)*46)]` (~46 carreaux), with horizontal padding of `var(--marge)` and the ruled `<main>` inset a further carreau past the margin rule (`pl-[calc(var(--marge)+var(--carreau))]`). The margin rule itself is drawn by `.cahier-marge::before` at `left: var(--marge)`; `--marge` is `calc(var(--carreau)*4)` and collapses to `calc(var(--carreau)*2)` at ≤640px.

Every page is a vertical stack at `gap-[var(--carreau)]`; sections stack internally with `mb-1` heading spacing and rely on ruling-violet `border-b` dividers rather than gaps between rows. The ruled ground is applied with `.regle` (horizontal ruling) on lined pages and `.carreaux` (horizontal + vertical) on the timetable and calendar. Card-like leaves (`encart`) use `p-4` (`1rem`).

Responsive behaviour is minimal: the margin halves at 640px; grids that must stay wide (the timetable week, the month calendar) live inside `overflow-x-auto` with a `min-w-[720px]` inner track so the page column never scrolls sideways; multi-column lists go `sm:grid-cols-2`. The print stylesheet strips `.regle` / `.carreaux` backgrounds and hides the margin rule and header.

### Named Rules
**The Carreau Rule.** `--carreau` (`1.75rem` / 28px) is the only layout unit. Every gap, padding, height, offset and max-width is a multiple or simple fraction of it (`calc(var(--carreau)*n)`). A raw px or rem value that is not a carreau multiple is off-system.

**The Margin Rule.** Every screen carries the ink-blue margin rule down the left at four carreaux (two on mobile). Primary actions and the date/marker gutter live in the space to its left; body content starts one carreau to its right.

## Elevation & Depth

No shadows on resting surfaces. Depth is the single faint tonal step from Paper to Page Fold (`--paper` → `--paper-2`) plus 1px ruling-violet or soft-graphite lines. A soft offset shadow appears only on genuinely floating slips: the search dropdown and the timetable lesson modal, each over a dimmed page for the modal. The `.mise-en-avant` search highlight uses a translucent highlighter box-shadow as a *marker bleed*, not as elevation.

### Shadow Vocabulary
- **Floating slip** (`box-shadow: 0.25rem 0.5rem 1.4rem rgb(20 20 40 / 0.16)`): a panel clipped to the page — the search results dropdown.
- **Lifted slip** (`box-shadow: 0.25rem 0.5rem 1.6rem rgb(20 20 40 / 0.2)`): a centred modal over a `rgb(12 14 26 / 0.55)` page dim — the timetable lesson detail.
- **Marker bleed** (`box-shadow: -0.35rem 0 0 rgb(var(--tache)/0.16), 0.35rem 0 0 rgb(var(--tache)/0.16)`): not elevation — extends the highlighter wash of `.mise-en-avant` past the text box.

### Named Rules
**The No Resting Shadow Rule.** A resting surface has no shadow — ever. A shadow means "this slip is floating above the page" (dropdown, modal). It is a warm near-black offset (down and right, like a lamp), never a symmetric ambient glow.

## Shapes

Square by intent: `--radius-sm`, `--radius` and `--radius-lg` are all `2px`, so every corner in the system reads as a cut edge, not a rounded one. The exceptions are drawn deliberately: the torn-corner clip on the prochain-contrôle slip (`clip-path` polygon plus a ruling-violet triangle), the pen-stroke check and the small circular subject/assessment marks (`rounded-full`, ~`0.95rem`).

Borders are always 1px. The only coloured borders are ink-blue (the timetable frame, the active intercalaire tab, a focused field, a floating slip) and the Scolengo subject colour as a full 1px box with tinted fill — never a left stripe. No gradients, no decorative geometry.

### Named Rules
**The 1px Line Rule.** Every border and divider is 1px. No coloured left-stripe accents anywhere — a subject or status is shown by a full box, a tinted fill, coloured caps, or a mark in the margin.

**The Square Corner Rule.** Radius is `2px` everywhere via the `rounded-sm` token. Don't introduce a new radius; the only round things are the pen check and the letter marks.

## Components

### Buttons
- **Shape:** square (`rounded-sm`, 2px); label typography (Atkinson 700, `text-sm`, uppercase, `tracking-wide`).
- **Primary** (`boutonPrincipal`): solid ink-blue fill, `text-paper`, padding `0.375rem 1rem` (`px-4 py-1.5`). Hover shifts the fill to Ink-Blue Strong (`transition-colors`). Disabled: `opacity-40`, no pointer events. This is "the main thing to do on this line".
- **Outline** (`boutonEncadre`): transparent fill, 1px soft-graphite border, `text-ink`, padding `0.375rem 0.75rem`. Hover moves border and text to ink-blue. For neutral actions that need a wide target.
- **Secondary** (`boutonSecondaire`): no box — ink-blue text with a 1px underline (`underline-offset-4`) that thickens to 2px on hover. A written cross-reference, not a button surface.
- **Destructive** (`boutonRouge`): no box — Bic-red `text-xs` bold text with a thickening underline, always behind a native `confirm()`.
- **Pending:** the submit component swaps the label for a short loading word and disables the control.

### Inputs / Fields
- **Style** (`champ`): `bg-paper`, 1px soft-graphite border at ~55% opacity, `rounded-sm`, padding `0.375rem 0.625rem` (`px-2.5 py-1.5`), `text-sm`. Paired with a `label` above (uppercase, `text-xs`, soft graphite).
- **Focus:** border moves to ink-blue (`focus:border-ink-blue`); the global `:focus-visible` adds a 2px ink-blue outline at 2px offset. The search field is a borderless underline that turns ink-blue on `focus-within`.
- **Error:** message in Bic red beneath / above the field; `caret-color` and checkbox `accent-color` are ink-blue.
- **File input:** native, with a `rounded-sm` bordered file button in label type.

### Leaves / Containers (`encart`)
- **Corner:** square (`rounded-sm`, 2px).
- **Background:** Page Fold (`bg-paper-2/60`) — a leaf laid on the page.
- **Border:** 1px soft-graphite at ~25% opacity.
- **Shadow:** none (see Elevation).
- **Padding:** `p-4` (`1rem`). Not a card — no elevation, no strong outline.

### Subject Tag (`etiquette`)
A small filled tab: `bg-ink-blue/10`, ink-blue text, `text-[0.72rem]` bold uppercase `tracking-wide`, `rounded-sm`, padding `0.125rem 0.375rem`. Used for a matière name inline and on documents.

### Navigation — Intercalaire Tabs (`Onglets`)
A horizontally scrollable row of classeur tabs sitting on an ink-blue base border (`-mb-px`). Each tab: `rounded-t-sm`, 1px border with no bottom edge, `px-3 py-1.5`, label type (`text-xs` bold uppercase). Active tab: ink-blue border, `bg-paper` fill, ink-blue text — visually joined to the page below. Inactive: soft-graphite border at ~35%, Page Fold fill, soft-graphite text darkening to graphite on hover. `aria-current="page"` on the active tab.

### Signature — The Margin Check (`CaseCoche` / `@keyframes trace-coche`)
The primary interaction. An empty `1.15rem` square checkbox sits in the margin gutter of every obligation line. On submit, a Bic-green checkmark is *drawn* along its path — `stroke-dasharray: 24; stroke-dashoffset: 24 → 0` over `0.22s cubic-bezier(.2,.8,.2,1)` — then the line itself takes a green `line-through` and drops to soft graphite. The server-returned state is authoritative. Honour `prefers-reduced-motion` (the global rule collapses the animation).

### Signature — The Ruled Obligation Line (`LigneObligation`)
One homework/assessment per ruled line, leaded to `var(--carreau)`: the checkbox or a `1.5px` Bic-red dot in the margin gutter, then the subject in small ink-blue caps (`text-[0.72rem]` bold uppercase), then the task in graphite, then an optional Fragment-Mono date at the right. The single most urgent line is set bold in Bic red; a done line is soft graphite with a Bic-green strike.

### Signature — The Contrôle Slip (`SlipControle`)
The next assessment on a torn-corner feuillet clipped to the page: Page Fold fill, 1px soft-graphite border going ink-blue on hover, a `clip-path` cut corner with a ruling-violet triangle behind it, a `max-w-[calc(var(--carreau)*13)]` measure. Label kicker, Spectral subject + chapter, Fragment-Mono date.

### Signature — The Timetable Grid (`GrilleEmploiDuTemps`)
Days as columns over an hour axis on a `.carreaux` squared ground, framed by a 1px ink-blue box. Each lesson is an absolutely-positioned block: `top`/`height` from time, `left`/`width` split on overlap, a **full 1px border** in `color-mix(subject 55%, transparent)` and a `color-mix(subject 12%, --paper)` fill — no stripe. Cancelled lessons are struck through and greyed. A `0.95rem` circular letter mark (`C` assessment, `T` homework) in Bic red (upcoming/to-do) or Bic green (done) sits bottom-right. Click opens the lifted-slip modal. Hover is a `brightness(0.97)` nudge (`1.1` in dark).

### Signature — The Search Highlight (`.mise-en-avant`)
A `?focus=` deep link lands on a line and marks it persistently: a translucent surligneur wash (`rgb(var(--tache)/0.16)`) behind the text with a marker-bleed box-shadow, plus an inked open bracket in the margin (`border: 2px solid var(--ink-blue); border-right: 0`). Persists while `?focus=` is in the URL.

### Icons (`Icone.tsx`)
An authored hand-inked SVG set on a 16px grid: `fill: none`, `stroke: currentColor`, `stroke-width: 1.6`, round caps and joins, sized in `em`. Strokes are drawn slightly loose, as if penned. No icon font, no emoji, no unicode glyphs.

## Do's and Don'ts

### Do:
- **Do** size every measure as a carreau multiple — `var(--carreau)`, `calc(var(--carreau)*n)`, or the `carreau` spacing token (The Carreau Rule).
- **Do** carry the ink-blue margin rule on every screen and keep the primary action / marker in the gutter left of it (The Margin Rule).
- **Do** lead body text to `var(--carreau)` so it sits on the ruling (The Baseline Rule).
- **Do** keep colour strictly semantic: ink-blue structure, graphite body, Bic red to-do/important/mark/error, Bic green done (The Bic Four-Colour Rule).
- **Do** draw state into the page — a margin check, a strike-through, a red grade in the margin — not onto a floated badge.
- **Do** set all times, dates, grades and counts in Fragment Mono with `.tabulaire`.
- **Do** use `.regle` for lined pages and `.carreaux` for the timetable and calendar.
- **Do** ship every surface in both themes via the `.dark` class, with a real night value for every colour used.
- **Do** use the authored `Icone` set at 1.6 stroke weight for every icon.

### Don't:
- **Don't** build a sidebar-plus-card-grid dashboard; the app is one continuous page.
- **Don't** put a shadow on a resting surface — a shadow means a slip is floating (The No Resting Shadow Rule).
- **Don't** use a border over 1px, or any coloured left-stripe accent; show a subject or status as a full box, tint, caps or margin mark (The 1px Line Rule).
- **Don't** introduce a new radius; corners are `2px` via `rounded-sm` (The Square Corner Rule).
- **Don't** introduce a fifth hue or use any colour decoratively (The Colour Is Never Decorative Rule).
- **Don't** use emoji, unicode symbols, or an icon font.
- **Don't** set reading copy in Fragment Mono or at an arbitrary line-height.
- **Don't** rely on colour alone for a state — pair it with the check mark, the strike, or a letter mark.

<!--
Not canonized: the dark `theme-color` meta value (`#141a2e` in src/app/layout.tsx) diverges from the
canonical dark `--paper` (`#151b2e` in globals.css). `--paper` is recorded as the single source of truth;
the meta hex is treated as an unratified approximation, not a second token.
-->
