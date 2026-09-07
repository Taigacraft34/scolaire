---
name: Plateforme scolaire
description: A quiet operator's console for a student's MonBureauNumérique life — homework, assessments, grades, timetable.
colors:
  ink: "#171717"
  paper: "#ffffff"
  ink-inverse: "#ededed"
  paper-inverse: "#0a0a0a"
  canvas: "#f4f4f5"
  canvas-inverse: "#000000"
  surface-raised-dark: "#09090b"
  hairline: "#d4d4d8"
  hairline-inverse: "#27272a"
  field-dark: "#18181b"
  muted: "#71717a"
  action: "#2563eb"
  action-hover: "#1d4ed8"
  focus: "#3b82f6"
  danger: "#dc2626"
  danger-quiet: "#ef4444"
  positive: "#16a34a"
  caution: "#d97706"
typography:
  display:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "normal"
  headline:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "normal"
  title:
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: "1.25rem"
    letterSpacing: "normal"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    letterSpacing: "normal"
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
    letterSpacing: "normal"
  mono:
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
    letterSpacing: "normal"
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "#383838"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "#3f3f46"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "0.5rem 1rem"
  button-action:
    backgroundColor: "{colors.action}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "0.5rem 1rem"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0.25rem 0.5rem"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "1rem"
  chip:
    backgroundColor: "{colors.canvas}"
    textColor: "#3f3f46"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
  nav-link:
    textColor: "#3f3f46"
    typography: "{typography.title}"
---

# Design System: Plateforme scolaire

## Overview

**Creative North Star: "The Quiet Console"**

This is an operator's dashboard reduced to signal. A French lycée student opens it
several times a day to answer one question — *what do I have to do next* — so the
interface earns its keep by getting out of the way. It is monochrome on purpose:
near-black ink on paper white, a full ramp of cool slate greys, and almost nothing
else. Colour is rationed so that when it appears — a red badge on an unfinished
assignment, an amber pill on an assessment that is still coming, a single blue
"mark done" — it *means* something and reads instantly. Restraint is the feature,
not a limitation.

The surface is flat and quiet at rest: cards are white (or near-black in dark
mode) held by a one-pixel hairline, corners softened to 8px, no shadow. Rhythm is
generous and consistent — a `1.5rem` gap between the stacked sections of every
page — while the content inside stays dense and scannable: `0.875rem` is the
workhorse size, tables and lists are tight, and hierarchy comes from weight and a
Geist-Sans heading rather than scale jumps. Both themes are first-class and
class-driven; the student toggles between them and the choice sticks.

The identity lives in the small, exact details — the pill geometry shared by every
button and every status chip, the left-border accent on a timetable lesson, the
persistent blue ring on a search result you jumped to — not in any decorative
gesture. Nothing here is trying to impress; it is trying to be legible at a glance
on a phone in a hallway between classes.

**Key Characteristics:**
- Monochrome slate-grey system; colour is semantic and rare.
- Flat surfaces, hairline borders, 8px card corners, fully-round buttons and chips.
- `0.875rem` body / `0.75rem` labels; dense content, roomy `1.5rem` section rhythm.
- Geist Sans for headings, system sans (Arial/Helvetica) for body, Geist Mono for code.
- Dark and light are equal, `.dark`-class driven, user-toggled and persisted.
- Touch-first: pill targets, `max-w-6xl` centered column, `sm:` is the primary breakpoint.

## Colors

A cool slate-grey monochrome. One accent (blue) for action and wayfinding; a
semantic trio (red / green / amber) for state. Nothing else.

### Primary
- **Ink** (`#171717`): the primary text colour in light mode and the fill of the
  primary button (`bg-foreground`). Not a grey — a near-black ink that gives crisp
  contrast against paper. Inverts to **Ink Inverse** (`#ededed`) in dark mode.
- **Blue Action** (`#2563eb`, Tailwind blue-600): the single non-semantic accent.
  Fills the contextual primary action (the small "Marquer terminé" button), colours
  every text link, and — as **Focus** (`#3b82f6`, blue-500) — draws the persistent
  ring around a search result you navigated to and the left border of a timetable
  lesson with no subject colour. Hover deepens to **Blue Action Hover**
  (`#1d4ed8`, blue-700).

### Neutral
- **Paper** (`#ffffff`) / **Paper Inverse** (`#0a0a0a`): the base surface and body
  background. Cards sit on this in light mode.
- **Canvas** (`#f4f4f5`, zinc-100) / **Canvas Inverse** (`#000000`): the page
  background *behind* the cards, one tonal step off Paper so white cards read as
  raised without a shadow. Dark mode goes to true black behind near-black cards.
- **Surface Raised (dark)** (`#09090b`, zinc-950): the card fill in dark mode.
- **Hairline** (`#d4d4d8`, zinc-300) / **Hairline Inverse** (`#27272a`, zinc-800):
  every border and divider. The system is held together by these one-pixel lines,
  not by elevation.
- **Field (dark)** (`#18181b`, zinc-900): input/select/textarea fill in dark mode.
- **Muted** (`#71717a`, zinc-500): secondary text, all field labels, timestamps,
  counts. The single most-used non-structural colour in the app.

### Semantic
- **Danger** (`#dc2626`, red-600): fill of the typed-confirmation delete button.
  **Danger Quiet** (`#ef4444`, red-500): destructive text links ("Supprimer",
  "Désactiver ntfy") and inline form errors; danger-zone card border is red-300 /
  red-900.
- **Positive** (`#16a34a`, green-600): the "done" state — the green **T** badge on
  a timetable lesson whose homework is finished, the "Terminé" chip.
- **Caution** (`#d97706`, amber-600): "still to come / attention" — the "Contrôle à
  venir" chip, the "no MBN token configured" notice (amber-50 / amber-950 panel).

### Named Rules
**The One Blue Rule.** Blue is action and wayfinding only — the contextual primary
button, links, the search-highlight ring, a lesson's default accent border. It is
never a background wash, never decorative, and never competes with the black
primary button for "the main thing to click".

**The Rationed Colour Rule.** On a resting screen, colour covers a few percent of
the pixels — badges, chips, one or two links. If a new screen needs a colour block
to work, the layout is wrong first.

## Typography

**Display Font:** Geist Sans (with `Arial, Helvetica, sans-serif` fallback) — headings only.
**Body Font:** system sans — `Arial, Helvetica, sans-serif`. Zero web-font cost for body copy; identical rendering everywhere.
**Mono Font:** Geist Mono (with `ui-monospace` fallback) — code and pasted config only.

**Character:** utilitarian and unfussy. Geist Sans gives page and section headings a
touch of contemporary precision; the Arial body keeps the reading surface neutral
and instantly familiar. There is no editorial voice in the type — it is signage.

### Hierarchy
- **Display** (Geist Sans, 600, `1.25rem` / `1.75rem`): the page title (`<h1>`), one
  per screen. A few dense views (print, sign-in) step up to `1.5rem`.
- **Headline** (Geist Sans, 600, `1.125rem` / `1.75rem`): a secondary in-page header,
  e.g. the "Semaine du…" bar above the timetable grid.
- **Title** (Geist Sans, 600, `0.875rem` / `1.25rem`, colour Muted-plus / zinc-700):
  section headings inside cards ("Ajouter un devoir", "Rappels de contrôles"). Small
  and quiet — it labels, it does not announce.
- **Body** (system sans, 400, `0.875rem` / `1.25rem`): the workhorse. Almost all
  interface text, list rows, form values. Base `1rem` exists but `0.875rem` is the
  default reach.
- **Label** (system sans, 400, `0.75rem`, colour Muted): every field label,
  timestamp, count, helper line. The stat-card variant adds `font-medium`,
  `uppercase`, and `tracking-wide`.

### Named Rules
**The Weight-Not-Size Rule.** Hierarchy is carried by font-weight (400 body → 600
headings) and the Geist/Arial switch, not by a big type scale. Display is only
`1.4×` body. Keep new headings in this narrow range.

**The Geist-Heading Rule.** New headings (`<h1>`, `<h2>` section titles) get
`font-sans` (Geist). Body, labels and controls stay on the system stack. Geist Mono
is for `<code>` / pasted JSON only. *(Implementation note: Geist is loaded via
`next/font` and exposed as `--font-geist-sans`; existing headings do not yet carry
`font-sans` — apply it on new work and when touching a heading.)*

## Layout

A single centred column, `max-w-6xl` (72rem), with `px-4` gutters and `py-6`
vertical padding; the sticky-feeling header uses the same `max-w-6xl` / `px-4` with
`py-3`. Every page is a vertical stack of sections at `flex flex-col gap-6`
(`1.5rem`) — this gap is the app's primary rhythm and is near-universal. Inside a
section, controls and rows sit at `gap-3` / `gap-4` (`0.75`–`1rem`); card padding
is `p-4` (`1rem`).

Content density is high within that roomy frame: list rows are `p-3` with
`divide-y` hairlines rather than gaps, forms wrap their fields with
`flex flex-wrap gap-3` and `min-w-40` so they reflow to one column on narrow
screens without a media query.

Responsive behaviour keys almost entirely on `sm:` (640px): stat cards go
`grid-cols-2` → `sm:grid-cols-4`, course cards `grid-cols-1` → `sm:grid-cols-2` →
`md:grid-cols-3`, the calendar is a fixed `grid-cols-7`, and the timetable is a
`grid-cols-1` stack that becomes a 5-column week at `sm:`. Wide, fixed-width views
(timetable grid, calendar) live inside `overflow-x-auto` with a `min-w-[720px]`
inner track so the page column itself never scrolls sideways. The print view
(`/cours/imprimer`) drops dark-mode classes and hides the header via
`print:hidden`.

## Elevation & Depth

Flat by default. Depth is conveyed by the one tonal step between Canvas (page) and
Paper (card) plus a hairline border — no resting shadow anywhere in the app. Shadow
appears only on surfaces that genuinely float above the page: the search dropdown
(`shadow-lg`) and the timetable lesson modal (`shadow-xl`), both also dimming the
page behind (`bg-black/40` for the modal). The search-highlight treatment
(`.mise-en-avant`) deliberately uses an `outline` + faint blue tint, not a shadow.

### Shadow Vocabulary
- **Floating panel** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` — Tailwind `shadow-lg`): dropdowns and popovers anchored to a trigger (the search results panel).
- **Dialog** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` — Tailwind `shadow-xl`): centred modals over a dimmed page (the lesson detail popup).

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest — hairline + tonal
background only. A shadow means "this element is floating above the page" (modal,
dropdown), never "this card is important". *(Provisional: the owner is open to a
single very soft resting shadow on primary cards later; if added, it becomes a
named token and applies uniformly, not per-card.)*

## Shapes

Two radii and a pill. Inputs, selects, textareas and small inline blocks (timetable
lessons) use `rounded` (`0.25rem` / 4px). Cards, sections, modals and the
search-highlight use `rounded-lg` (`0.5rem` / 8px). Every button and every status
chip is `rounded-full` — the pill is the single most recognisable shape in the
system and it is shared across primary, secondary, danger, action and filter
controls as well as subject tags and status badges.

Borders are always 1px and always a hairline grey; the only coloured border is the
`border-l-2` accent stripe on a timetable lesson (subject colour, or blue-400
fallback) and the red-tinted border on the danger-zone card. No gradients, no
clipping, no decorative geometry.

## Components

### Buttons
Every button is a full pill (`rounded-full`) at `text-sm font-medium`, with a
`0.2s` colour transition and no shadow.
- **Primary:** `bg-foreground text-background`, padding `0.5rem 1rem` (`px-4 py-2`).
  Near-black on paper in light mode, inverting in dark. Hover shifts the fill to
  `#383838` (light) / `#ccc` (dark). This is "the main action on the screen".
- **Secondary / ghost:** transparent fill, `text-zinc-700` / `dark:text-zinc-300`,
  `border border-zinc-300` / `dark:border-zinc-700`, same padding. Hover fills
  `bg-zinc-100` / `dark:bg-zinc-900`. Used for navigation-ish and low-stakes
  actions (week nav, "Voir les devoirs passés", export links).
- **Action (small):** `bg-blue-600 text-white`, padding `0.25rem 0.75rem`
  (`px-3 py-1`), `text-xs`. The contextual "do this now" — "Marquer terminé".
  Toggled-off state reverts to a small secondary pill.
- **Danger:** `bg-red-600 text-white` pill, only ever behind a typed-word
  confirmation. Destructive *links* are `text-xs text-red-500 hover:underline`
  with a native `confirm()`.
- **Pending state:** the label is replaced by a `1rem` spinner
  (`animate-spin rounded-full border-2 border-current border-t-transparent`) plus a
  loading word; the button is `disabled`.

### Chips / Tags
- **Style:** `rounded-full`, `text-xs`, padding `0.125rem 0.5rem` (`px-2 py-0.5`).
  Neutral tags are `bg-zinc-100 text-zinc-700` / `dark:bg-zinc-800 dark:text-zinc-300`.
- **Status variants:** tinted pairs — blue (`bg-blue-100 text-blue-700` /
  `dark:bg-blue-950 dark:text-blue-300`) for "Ajouté automatiquement", amber for
  "Contrôle à venir", red/green for devoir status.
- **Badge variant:** a `1rem` solid circle with a single letter (**T** homework,
  **C** assessment), `bg-red-500` (to do / upcoming) or `bg-green-600` (done /
  past), pinned bottom-right of a timetable lesson.

### Cards / Containers
- **Corner:** `rounded-lg` (8px).
- **Background:** `bg-white` / `dark:bg-zinc-950`.
- **Border:** `border border-zinc-300` / `dark:border-zinc-800` — always present,
  always 1px.
- **Shadow:** none (see Elevation).
- **Padding:** `p-4` (`1rem`); list-style cards drop padding and use `divide-y
  divide-zinc-100` / `dark:divide-zinc-900` rows at `p-3`.
- **Section header inside a card:** `<h2>` at Title spec, `mb-3`.

### Inputs / Fields
- **Style:** `rounded` (4px), `border border-zinc-300` / `dark:border-zinc-700`,
  fill `transparent` (light) / `bg-zinc-900` (dark), padding `0.25rem 0.5rem`
  (`px-2 py-1`), `text-sm`. Paired with a `text-xs text-zinc-500` label above.
- **Focus:** browser default on most fields; the search field is the exception —
  wrapped in a pill that does `focus-within:border-zinc-500`. *(Gap: no explicit
  `focus-visible` ring system — new work should add a consistent
  `focus-visible` treatment keyed on `{colors.focus}`.)*
- **Danger field:** the reset-confirmation input swaps to `border-red-300` /
  `dark:border-red-900`.
- **Disabled:** `disabled:opacity-50 disabled:cursor-not-allowed`.

### Navigation
The header is a single row: a wrapping link list on the left, a right cluster
(search field, theme toggle, account link, sign-out). Links are `text-sm
font-medium text-zinc-700` / `dark:text-zinc-300`, hover to `text-zinc-950` /
`dark:text-zinc-50`. No active-state styling — the app has no persistent
"current page" indicator in the nav. On narrow screens the link list wraps and the
right cluster drops below it; the search field goes full-width (`w-full sm:w-64`).

### Search field (signature)
A `rounded-full` bordered input with a leading magnifier glyph, `px-3 py-1.5`.
Focusing it opens an 8px-cornered dropdown (`shadow-lg`) with a 4-tab row (Tous /
Devoirs / Contrôles / Cours, each an icon + label + count) over a scrollable
result list; results show subject then title on two lines and deep-link with a
`?focus=` param that the target page turns into a persistent blue highlight ring.

### Timetable grid (signature)
Monday–Friday columns over an hour axis (`56px` per hour). Each lesson is an
absolutely-positioned block: `top` from start time, `height` proportional to
duration, `left`/`width` split into columns when lessons overlap. `rounded` (4px),
a `border-l-2` accent in the Scolengo subject colour (blue-400 fallback), a faint
tint of the same colour as fill, cancelled lessons struck through and greyed. A
homework/assessment badge sits bottom-right; clicking opens the lesson modal.

## Do's and Don'ts

### Do:
- **Do** stack every page as `flex flex-col gap-6` sections inside the
  `max-w-6xl` column.
- **Do** hold surfaces with a 1px hairline (`border-zinc-300` /
  `dark:border-zinc-800`) and the Canvas→Paper tonal step; keep them shadowless.
- **Do** make every button and every status chip a full pill (`rounded-full`);
  use `rounded-lg` for cards and `rounded` for fields.
- **Do** reserve `bg-foreground` (near-black pill) for the one primary action per
  view and `bg-blue-600` for the one contextual "do it now" action.
- **Do** label fields with `text-xs text-zinc-500` above the control, and keep
  body text at `text-sm`.
- **Do** put Geist (`font-sans`) on new headings; leave body and controls on the
  system stack.
- **Do** wrap fixed-width views (grids, calendars) in `overflow-x-auto` with a
  `min-w-[…]` inner track so the page never scrolls sideways.
- **Do** ship every new surface in both themes, driven by the `.dark` class, with
  a real dark value for every colour used.

### Don't:
- **Don't** use blue as a background wash, a section fill, or decoration — it is
  action and wayfinding only (The One Blue Rule).
- **Don't** add a resting shadow to a card to signal importance; a shadow means
  "floating above the page".
- **Don't** build hierarchy with big type — stay inside the `1×`–`1.4×` range and
  use weight plus the Geist/Arial switch (The Weight-Not-Size Rule).
- **Don't** introduce a fifth hue. Neutrals carry structure; red/green/amber carry
  state; blue carries action. That is the whole palette.
- **Don't** invent a new radius. Two values and a pill.
- **Don't** rely on colour alone for a state — pair it with a letter, label or
  icon (the T/C badges, the status chips).
- **Don't** add a "current page" highlight to the nav unless it is designed
  system-wide; today the nav has none.
