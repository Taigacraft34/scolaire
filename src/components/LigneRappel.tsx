import { IconeChevronBas } from "@/components/Icone";
import { etiquette } from "@/lib/ui";

export interface RappelLigne {
  id: string;
  titre: string;
  description: string | null;
  matiere: string | null;
  heure: string;
}

// Une ligne de rappel dans la liste des devoirs : pas de case (il n'y a rien à
// cocher), une étiquette « Rappel » pour ne jamais la confondre avec un devoir,
// et la description qui se déplie quand il y en a une.
export function LigneRappel({ rappel }: { rappel: RappelLigne }) {
  const intitule = (
    <>
      <span className={etiquette + " mr-2 align-baseline"}>Rappel</span>
      {rappel.matiere && (
        <span className="mr-2 font-body text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue">
          {rappel.matiere}
        </span>
      )}
      {rappel.titre}
    </>
  );

  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute right-full top-[0.6rem] mr-[0.55rem] h-1.5 w-1.5 rounded-full bg-ink-blue/60"
      />
      {rappel.description ? (
        <details className="group">
          <summary className="flex min-h-[var(--carreau)] cursor-pointer list-none items-baseline gap-2 leading-[var(--carreau)] marker:hidden">
            <span className="min-w-0 flex-1 truncate text-ink">{intitule}</span>
            <span className="tabulaire shrink-0 font-mono text-xs text-ink-soft">{rappel.heure}</span>
            <IconeChevronBas className="shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
          </summary>
          <p className="whitespace-pre-wrap pb-[calc(var(--carreau)*0.5)] pl-1 pt-1 font-body text-sm leading-[var(--carreau)] text-ink-soft">
            {rappel.description}
          </p>
        </details>
      ) : (
        <div className="flex min-h-[var(--carreau)] items-baseline gap-2 leading-[var(--carreau)]">
          <span className="min-w-0 flex-1 truncate text-ink">{intitule}</span>
          <span className="tabulaire shrink-0 font-mono text-xs text-ink-soft">{rappel.heure}</span>
        </div>
      )}
    </li>
  );
}
