import Link from "next/link";
import { IconeChevronDroite } from "@/components/Icone";

// Une séance de la journée, écrite sur la réglure : l'heure dans la gouttière de
// marge, la matière en petites capitales, la salle au graphite doux. Si un
// devoir est dû ou un contrôle a lieu pendant ce cours, une marque « T »/« C »
// et la ligne devient un lien vers l'échéance.
export function LigneSeance({
  heure,
  matiere,
  salle,
  annule = false,
  marque,
  href,
}: {
  heure: string;
  matiere: string;
  salle?: string | null;
  annule?: boolean;
  marque?: { lettre: "T" | "C"; couleur: "rouge" | "vert" };
  href?: string;
}) {
  const contenu = (
    <>
      <span
        className={
          "min-w-0 flex-1 truncate " + (annule ? "text-ink-soft line-through" : "text-ink")
        }
      >
        <span className="mr-2 align-baseline font-body text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue">
          {matiere}
        </span>
        {salle ? <span className="align-baseline text-ink-soft">{salle}</span> : null}
      </span>
      {marque ? (
        <span
          aria-hidden
          className={
            "grid h-[1.05rem] w-[1.05rem] shrink-0 place-items-center rounded-full border border-current bg-paper font-mono text-xs font-bold " +
            (marque.couleur === "rouge" ? "text-bic-red" : "text-bic-green")
          }
        >
          {marque.lettre}
        </span>
      ) : null}
      {href ? (
        <IconeChevronDroite className="shrink-0 text-ink-soft/70" />
      ) : null}
    </>
  );

  return (
    <li className="relative flex min-h-[var(--carreau)] items-baseline gap-2 leading-[var(--carreau)]">
      <span className="tabulaire absolute right-full top-[0.1rem] mr-[calc(var(--carreau)+0.3rem)] font-mono text-xs text-ink-soft">
        {heure}
      </span>
      {href ? (
        <Link href={href} className="flex flex-1 items-baseline gap-2 hover:underline decoration-1 underline-offset-2">
          {contenu}
        </Link>
      ) : (
        contenu
      )}
    </li>
  );
}
