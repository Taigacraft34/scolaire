# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: the developer, a French lycée student, plus a small closed circle of
classmates, siblings or friends at school — a handful of accounts, not open
registration. Accounts exist only after an administrator whitelists an email;
there is no self sign-up. Everyone authenticates through ZITADEL (OIDC). One
account holds the `ADMIN` role and manages the whitelist, user activation and the
activity/sync logs.

Usage happens on both phone and computer: near-daily to check what homework is
due, weekly to plan and revise. The phone is a first-class surface — the app is
an installable PWA (`standalone`, portrait).

## Product Purpose

A personal dashboard that pulls a student's MonBureauNumérique (Scolengo /
Skolengo) data — homework, grades, timetable — into one place and adds what the
official MBN app does poorly or not at all. Success is the student opening this
instead of the official app to know what to do next, and never being surprised by
an assessment.

Four confirmed reasons it exists (all four selected by the user):

- **Reminder notifications** — MBN has none. Configurable reminders (email +
  mobile via ntfy / Pushover / Gotify) fire before homework is due and before
  assessments, at user-chosen offsets (2 weeks / 1 week / 3 days / 2 days before,
  the evening before at 18h, the morning of at 6h30).
- **Assessment detection** — homework whose title/description matches
  user-configurable keywords ("contrôle", "évaluation", "DS", "interro"…)
  automatically spawns a tracked *contrôle*, which can be linked to course
  chapters and to the grade it eventually receives.
- **Course library** — personal course notes: subjects → chapters → ordered
  content blocks (rich text or attached files), with a print-optimised
  "all courses" PDF view.
- **Unified view** — homework, assessments, grades, timetable and a month
  calendar in one coherent interface, cross-linked (a timetable lesson shows a
  badge and popup for its homework/assessment; an assessment links to its
  chapters and grade).

## Positioning

The leverage is the **combination**: this is the only place where MBN's synced
facts (homework, grades, agenda) sit next to the student's own artefacts (course
notes, keyword rules, reminder preferences) and are joined automatically —
homework → detected assessment → linked chapters → resulting grade, and timetable
lesson → the homework due for that exact lesson. The official MBN app owns the
source data but has none of these joins, no reminders and no personal notes; a
generic homework/reminder app has the joins but not the authoritative MBN sync.
Assessment auto-detection from homework keywords, and lesson↔homework matching
(same subject, same day, nearest start time), are mechanisms a neighbouring
product could not copy without also owning the MBN integration.

## Operating Context

- **Data source** — the Scolengo API, authenticated with a token the user obtains
  via the external `scolengo-token` utility and pastes into Settings (stored
  AES-256-GCM encrypted). Sync pulls homework (+ assessment detection), grades
  (via evaluation periods) and the agenda (dated lessons) for a window of roughly
  2 weeks back to 2 months ahead.
- **Sync cadence** — manual, or automatic (hourly / every 6h / daily) driven by an
  external cron job hitting `/api/synchronisation/verifier` with a shared-secret
  bearer token. A second cron hits `/api/notifications/verifier` to dispatch due
  reminders. Scheduling both is the operator's responsibility.
- **Rituals** — checking "what's for tomorrow" on the phone; marking homework done
  (which also patches `done` back to MBN); reviewing upcoming assessments and
  their linked chapters before revising; consulting the weekly timetable grid;
  occasionally taking or importing course notes.
- **School data shape** — French lycée: heavily abbreviated Scolengo subject
  labels ("MATHEMATIQUES", "PHYSIQUE-CHIMIE", "AGL. SECT. EUR. MA.",
  "T.P. SC. VIE TERRE"), real teacher names, split-group lessons that overlap in
  time, week-relative scheduling.

## Capabilities and Constraints

**Confirmed capabilities**

- Homework: synced + manual; grouped by due date (Pour aujourd'hui / demain /
  plus tard); past homework hidden behind a toggle; mark done/undone from the
  homework list or the timetable popup; status round-trips to MBN.
- Assessments (*contrôles*): auto-detected or manual; linked to a source
  homework, to course chapters (many-to-many), and to a grade (auto-linked on
  same subject + same day); "à venir / passé" derived from date, never stored.
- Grades (*notes*): list, weighted average per subject, per-grade "copies" with
  file attachments.
- Courses: subject → chapter → ordered blocks (`TEXTE` rich HTML sanitised to
  bold/italic/underline/colour/size, or `FICHIER`); drag-reorder; printable view.
- Timetable: read-only, synced from the MBN agenda only (no manual entry);
  Monday–Friday time-grid, lessons positioned by start time with height ∝
  duration, overlapping lessons side by side; cancelled lessons struck through;
  subject colour from Scolengo.
- Calendar: month grid of homework + assessments with subject/type filters.
- Global search: header search bar on every page, over homework, assessments and
  courses, matching titles, descriptions, teacher names and subject names;
  results deep-link and highlight the target.
- Notifications: per-type reminder offsets and channels, configured separately
  for homework and assessments; email via SMTP; mobile via ntfy (set up
  in-app), Pushover or Gotify.
- Settings: Scolengo token, sync frequency, detection keywords, timezone, JSON
  data export (attachments inlined), destructive "reset my data".
- Admin: email whitelist, user activation/deletion, sync + event logs.
- Developer mode: reveals a date-ranged manual sync form on the Devoirs /
  Contrôles / Notes pages.

**Technical constraints (existing codebase — do not fight the stack)**

- Next.js 16 App Router — this fork carries breaking changes vs. public Next;
  guides live in `node_modules/next/dist/docs/`. React 19, server components +
  server actions, Turbopack.
- Prisma 7 + PostgreSQL; schema in `prisma/schema.prisma`, generated client in
  `src/generated/prisma`; migrations applied with `prisma migrate deploy`.
- Auth.js (NextAuth v5 beta) with ZITADEL, JWT sessions; middleware in
  `src/proxy.ts` gates every route and re-reads the user from DB each request.
- Tailwind v4 (`@import "tailwindcss"`, `@custom-variant dark`), zinc-based
  utility styling, Geist sans/mono via `next/font`.
- Dark mode is class-based (`.dark` on `<html>`), user-toggled, persisted to
  `localStorage`, applied pre-render by an inline script.
- Scolengo timestamps are UTC; the app renders times in the user's
  `fuseauHoraire` (default `Europe/Paris`).
- File uploads go through server actions (50 MB body limit) to disk storage
  (`src/lib/stockage.ts`); documents served via `/api/documents/[id]`.

## Brand Commitments

- **Name** — currently "Scolaire" / "Plateforme scolaire" in code (`<title>`,
  manifest, PWA short name), **but not final: the user intends to rename it
  later.** Treat the current name as provisional; do not entrench it or build a
  wordmark around it.
- **Language** — French, and correctly accented throughout. A recent pass
  accented all user-facing text; new copy must follow.
- **Voice** — plain, direct, unfussy; short labels, no marketing tone. This is an
  Operate surface used daily.
- **Platform reach** — phone usage is first-class alongside desktop; installable
  PWA (`standalone`, portrait, maskable icons, theme colour `#0f172a`).
- **Assets** — `public/icons/icon-192.png`, `icon-512.png`,
  `public/manifest.json`. No logo or wordmark asset beyond the icons. No other
  binding brand references.

## Evidence on Hand

- A live Scolengo integration against a real French lycée account: ~183 real
  timetable lessons, real subjects and teacher names, real homework and grades.
  New work can assume realistic synced content exists.
- No testimonials, customers, press, benchmarks, pricing or public-launch
  material exist — this is a private tool for a small circle. Do not fabricate
  any.
- No committed marketing or landing surface. The product is entirely
  Operate / Read app UI today.

## Product Principles

1. **MBN is the source of truth; this app is the layer that makes it usable.**
   Synced data is authoritative and re-syncable; never make an MBN fact
   un-recoverable, and round-trip user changes (done state) back to MBN where the
   API allows.
2. **"What do I need to do next" answered in one glance.** The daily job is
   triage — the homepage, homework groups, timetable badges and calendar exist to
   surface the next obligation without navigation.
3. **Join, don't just list.** The value is the automatic links
   (homework → assessment → chapters → grade, lesson → homework). Preserve and
   deepen the joins; don't ship isolated lists.
4. **No surprise assessments.** Detection plus configurable multi-offset
   reminders are the core promise; changes must keep an unmarked
   assessment/homework impossible to forget.
5. **Small, trusted, low-ceremony.** A handful of whitelisted users who know each
   other — favour directness and speed over onboarding, permission granularity or
   defensive UX.

## Accessibility & Inclusion

No formal accessibility standard is imposed. Baseline expectations only: full
French localisation with correct accents, legible dark and light themes, and
touch-friendly targets given first-class phone use.
