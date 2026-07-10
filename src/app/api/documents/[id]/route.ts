import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Non autorise", { status: 401 });

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, utilisateurId: session.user.id },
  });
  if (!document) return new NextResponse("Introuvable", { status: 404 });

  try {
    const contenu = await readFile(document.cheminStockage);
    return new NextResponse(new Uint8Array(contenu), {
      headers: {
        "Content-Type": document.typeMime,
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.nomFichier)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Fichier introuvable sur le disque", { status: 404 });
  }
}
