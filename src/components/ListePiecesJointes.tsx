import { IconeTrombone } from "@/components/Icone";
import type { PieceJointeAffichee } from "@/lib/piecesJointes";

function tailleLisible(octets: number | null): string | null {
  if (!octets) return null;
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

// Pièces jointes déposées par le prof sur MBN : ouvertes dans un nouvel onglet
// via le proxy (le fichier reste sur MBN).
export function ListePiecesJointes({ pieces, className = "" }: { pieces: PieceJointeAffichee[]; className?: string }) {
  if (pieces.length === 0) return null;
  return (
    <ul className={"flex flex-col gap-0.5 " + className}>
      {pieces.map((piece) => {
        const taille = tailleLisible(piece.taille);
        return (
          <li key={piece.id} className="flex min-w-0 items-baseline gap-1.5 font-body text-xs">
            <IconeTrombone className="shrink-0 translate-y-[0.1rem] text-ink-soft" />
            <a
              href={piece.lien}
              target="_blank"
              rel="noopener"
              className="min-w-0 truncate text-ink-blue underline decoration-ink-blue/40 underline-offset-2 hover:decoration-ink-blue"
            >
              {piece.nom}
            </a>
            {taille && <span className="tabulaire shrink-0 font-mono text-ink-soft">{taille}</span>}
          </li>
        );
      })}
    </ul>
  );
}
