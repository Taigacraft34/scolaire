import type { Prisma } from "@/generated/prisma/client";

// Piece jointe MBN telle que stockee en base (JSON), sur un devoir ou dans un
// bloc "activite en seance". L'URL pointe vers MBN et exige le jeton Scolengo :
// elle ne part jamais au navigateur, qui passe par /api/pieces-jointes.
export interface PieceJointe {
  id: string;
  nom: string;
  typeMime: string | null;
  taille: number | null;
  url: string;
}

// Ce que le navigateur recoit : pas d'URL MBN, un lien vers le proxy.
export interface PieceJointeAffichee {
  id: string;
  nom: string;
  taille: number | null;
  lien: string;
}

export type SourcePieceJointe = "devoir" | "seance";

interface AttachmentScolengo {
  id: string;
  name: string | null;
  mimeType: string | null;
  size: number | null;
  url: string;
}

export function depuisScolengo(attachments: AttachmentScolengo[] | undefined): PieceJointe[] {
  return (attachments ?? [])
    .filter((a) => a.id && a.url)
    .map((a) => ({
      id: a.id,
      nom: a.name?.trim() || "Pièce jointe",
      typeMime: a.mimeType,
      taille: a.size,
      url: a.url,
    }));
}

export function lirePiecesJointes(valeur: Prisma.JsonValue | undefined): PieceJointe[] {
  if (!Array.isArray(valeur)) return [];
  return valeur.filter(
    (p) => !!p && typeof p === "object" && "id" in p && "url" in p && typeof p.url === "string",
  ) as unknown as PieceJointe[];
}

export function pourAffichage(
  pieces: PieceJointe[],
  source: SourcePieceJointe,
  sourceId: string,
): PieceJointeAffichee[] {
  return pieces.map((p) => ({
    id: p.id,
    nom: p.nom,
    taille: p.taille,
    lien: `/api/pieces-jointes/${source}/${sourceId}/${encodeURIComponent(p.id)}`,
  }));
}
