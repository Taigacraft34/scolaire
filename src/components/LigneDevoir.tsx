"use client";

import { useOptimistic } from "react";
import { CaseCoche } from "@/components/CaseCoche";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { IconeChevronBas } from "@/components/Icone";
import { ListePiecesJointes } from "@/components/ListePiecesJointes";
import type { PieceJointeAffichee } from "@/lib/piecesJointes";
import { supprimerDevoir } from "@/app/(app)/devoirs/actions";

export interface DevoirLigne {
  id: string;
  titre: string;
  fait: boolean;
  descriptionHtml: string | null;
  piecesJointes: PieceJointeAffichee[];
  matiere: string;
  dateLabel: string;
}

// Une ligne de la page Devoirs : la case dans la marge (barre la ligne sans
// attendre le serveur), l'intitulé qui se déplie sur la description.
export function LigneDevoir({ devoir, urgent = false }: { devoir: DevoirLigne; urgent?: boolean }) {
  const [fait, setFait] = useOptimistic(devoir.fait);

  return (
    <li id={`element-${devoir.id}`} className="relative">
      <details className="group">
        <summary className="flex min-h-[var(--carreau)] cursor-pointer list-none items-baseline gap-2 leading-[var(--carreau)] marker:hidden">
          <span className="absolute right-full top-[0.15rem] mr-1">
            <CaseCoche
              coche={fait}
              devoirId={devoir.id}
              retour="/devoirs"
              intitule={devoir.titre}
              onBascule={() => setFait((f) => !f)}
            />
          </span>
          <span
            className={
              "min-w-0 flex-1 truncate group-open:overflow-visible group-open:whitespace-normal " +
              (fait
                ? "text-ink-soft line-through decoration-bic-green"
                : urgent
                  ? "font-bold text-bic-red"
                  : "text-ink")
            }
          >
            <span
              className={
                "mr-2 font-body text-[0.72rem] font-bold uppercase tracking-wide " +
                (urgent && !fait ? "text-bic-red" : "text-ink-blue")
              }
            >
              {devoir.matiere}
            </span>
            {devoir.titre}
          </span>
          <span className="tabulaire shrink-0 font-mono text-xs text-ink-soft">{devoir.dateLabel}</span>
          <IconeChevronBas className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
        </summary>
        <div className="pb-[calc(var(--carreau)*0.5)] pl-1 pt-1">
          {devoir.descriptionHtml ? (
            <div
              className="whitespace-pre-wrap font-body text-sm leading-[var(--carreau)] text-ink-soft [&_a]:text-ink-blue [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: devoir.descriptionHtml }}
            />
          ) : (
            <p className="font-body text-sm leading-[var(--carreau)] text-ink-soft">Aucune description.</p>
          )}
          <ListePiecesJointes pieces={devoir.piecesJointes} className="mt-1" />
          <form action={supprimerDevoir} className="mt-1">
            <input type="hidden" name="devoirId" value={devoir.id} />
            <BoutonSupprimer libelle="Supprimer le devoir" />
          </form>
        </div>
      </details>
    </li>
  );
}
