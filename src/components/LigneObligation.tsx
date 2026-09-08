"use client";

import { useOptimistic } from "react";
import Link from "next/link";
import { CaseCoche } from "@/components/CaseCoche";
import { IconeChevronDroite } from "@/components/Icone";

// Une ligne écrite sur la réglure : la case dans la marge, la matière en petites
// capitales bleues, l'intitulé au graphite, un chevron dans la gouttière droite
// (la ligne mène toujours à sa page). `accent` réserve l'intitulé en grand à la
// seule échéance qui compte maintenant ; `attenue` fait reculer les sections
// « demain » / « plus tard ». La coche barre la ligne sans attendre le serveur.
export function LigneObligation({
  matiere,
  intitule,
  date,
  href,
  urgent = false,
  accent = false,
  attenue = false,
  devoir,
  retour,
}: {
  matiere: string;
  intitule: string;
  date?: string;
  href: string;
  urgent?: boolean;
  accent?: boolean;
  attenue?: boolean;
  devoir?: { id: string; coche: boolean };
  retour?: string;
}) {
  const [coche, setCoche] = useOptimistic(devoir?.coche ?? false);

  return (
    <li
      className={
        "relative flex items-baseline gap-2 " +
        (accent
          ? "min-h-[calc(var(--carreau)*2)] leading-[calc(var(--carreau)*2)]"
          : "min-h-[var(--carreau)] leading-[var(--carreau)]")
      }
    >
      {devoir ? (
        <span
          className={
            "absolute right-full mr-1 " + (accent ? "top-[0.7rem]" : "top-[0.15rem]")
          }
        >
          <CaseCoche
            coche={coche}
            devoirId={devoir.id}
            retour={retour}
            intitule={intitule}
            onBascule={() => setCoche((c) => !c)}
          />
        </span>
      ) : (
        <span
          aria-hidden
          className={
            "absolute right-full mr-[0.55rem] h-1.5 w-1.5 rounded-full " +
            (urgent ? "bg-bic-red" : "bg-ink-soft/50") +
            (accent ? " top-[1.05rem]" : " top-[0.4rem]")
          }
        />
      )}
      <Link
        href={href}
        className={
          "min-w-0 flex-1 truncate decoration-1 underline-offset-2 hover:underline " +
          (coche
            ? "text-ink-soft line-through decoration-bic-green"
            : urgent
              ? "font-bold text-bic-red"
              : attenue
                ? "text-ink-soft"
                : "text-ink")
        }
      >
        {urgent && !coche ? <span className="sr-only">Urgent. </span> : null}
        <span
          className={
            "mr-2 align-baseline font-body text-[0.72rem] font-bold uppercase tracking-wide " +
            (urgent && !coche ? "text-bic-red" : attenue ? "text-ink-blue/70" : "text-ink-blue")
          }
        >
          {matiere}
        </span>
        <span className={accent ? "align-baseline font-display text-[1.85rem]" : "align-baseline"}>
          {intitule}
        </span>
      </Link>
      {date ? (
        <span className="tabulaire shrink-0 font-mono text-xs text-ink-soft">{date}</span>
      ) : null}
      <IconeChevronDroite className={"shrink-0 " + (attenue ? "text-ink-soft/50" : "text-ink-soft/70")} />
    </li>
  );
}
