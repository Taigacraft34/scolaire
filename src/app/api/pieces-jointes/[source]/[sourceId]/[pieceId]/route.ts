import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { lirePiecesJointes, type PieceJointe } from "@/lib/piecesJointes";
import { avecVerrouScolengo, getClientScolengo } from "@/lib/scolengo/client";

// Les fichiers MBN exigent le jeton Scolengo : on les relaie sans les stocker.
// L'URL telechargee est toujours celle enregistree par la synchronisation sur
// un devoir ou une seance de l'utilisateur connecte, jamais une URL fournie
// par le navigateur (sinon le jeton pourrait partir vers n'importe quel hote).
async function trouverPiece(
  utilisateurId: string,
  source: string,
  sourceId: string,
  pieceId: string,
): Promise<PieceJointe | null> {
  if (source === "devoir") {
    const devoir = await prisma.devoir.findFirst({
      where: { id: sourceId, utilisateurId },
      select: { piecesJointes: true },
    });
    return lirePiecesJointes(devoir?.piecesJointes).find((p) => p.id === pieceId) ?? null;
  }

  if (source === "seance") {
    const seance = await prisma.seanceEmploiDuTemps.findFirst({
      where: { id: sourceId, utilisateurId },
      select: { contenuSeance: true },
    });
    if (!Array.isArray(seance?.contenuSeance)) return null;
    for (const bloc of seance.contenuSeance) {
      if (!bloc || typeof bloc !== "object" || !("piecesJointes" in bloc)) continue;
      const piece = lirePiecesJointes(bloc.piecesJointes).find((p) => p.id === pieceId);
      if (piece) return piece;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ source: string; sourceId: string; pieceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Non autorise", { status: 401 });
  const utilisateurId = session.user.id;

  const { source, sourceId, pieceId } = await params;
  const piece = await trouverPiece(utilisateurId, source, sourceId, decodeURIComponent(pieceId));
  if (!piece) return new NextResponse("Introuvable", { status: 404 });

  try {
    // Verrou : le telechargement peut declencher un rafraichissement du jeton.
    const flux = await avecVerrouScolengo(utilisateurId, async () => {
      const client = await getClientScolengo(utilisateurId);
      if (!client) throw new Error("Aucun token Scolengo n'est configure.");
      return client.downloadAttachment({
        id: piece.id,
        name: piece.nom,
        mimeType: piece.typeMime,
        mimeTypeLabel: null,
        size: piece.taille,
        url: piece.url,
        alternativeText: null,
      });
    });

    return new NextResponse(Readable.toWeb(flux as Readable) as ReadableStream, {
      headers: {
        "Content-Type": piece.typeMime ?? "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(piece.nom)}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error(`Echec du telechargement de la piece jointe ${piece.id} :`, e);
    return new NextResponse("Impossible de recuperer le fichier sur MonBureauNumerique", { status: 502 });
  }
}
