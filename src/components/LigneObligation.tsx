import Link from "next/link";
import { CaseCoche } from "@/components/CaseCoche";

// Une ligne écrite sur la réglure : la case dans la marge, la matière en petites
// capitales bleues, l'intitulé au graphite. Rouge = la chose la plus urgente.
export function LigneObligation({
  matiere,
  intitule,
  date,
  href,
  urgent = false,
  devoir,
  retour,
}: {
  matiere: string;
  intitule: string;
  date?: string;
  href: string;
  urgent?: boolean;
  devoir?: { id: string; coche: boolean };
  retour?: string;
}) {
  return (
    <li className="relative flex min-h-[var(--carreau)] items-baseline gap-2 leading-[var(--carreau)]">
      {devoir ? (
        <span className="absolute right-full top-[0.15rem] mr-2.5">
          <CaseCoche coche={devoir.coche} devoirId={devoir.id} retour={retour} />
        </span>
      ) : (
        <span
          aria-hidden
          className="absolute right-full top-[0.4rem] mr-2.5 h-1.5 w-1.5 rounded-full bg-bic-red"
        />
      )}
      <Link
        href={href}
        className={
          "min-w-0 flex-1 truncate decoration-1 underline-offset-2 hover:underline " +
          (devoir?.coche
            ? "text-ink-soft line-through decoration-bic-green"
            : urgent
              ? "font-bold text-bic-red"
              : "text-ink")
        }
      >
        <span
          className={
            "mr-2 font-body text-[0.72rem] font-bold uppercase tracking-wide " +
            (urgent && !devoir?.coche ? "text-bic-red" : "text-ink-blue")
          }
        >
          {matiere}
        </span>
        {intitule}
      </Link>
      {date ? (
        <span className="tabulaire shrink-0 font-mono text-xs text-ink-soft">{date}</span>
      ) : null}
    </li>
  );
}
