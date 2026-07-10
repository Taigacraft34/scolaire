import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { construireExport, type PorteeExport } from "@/lib/export";

const PORTEES_VALIDES: PorteeExport[] = ["cours", "sans-cours", "tout"];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Non autorise", { status: 401 });

  const portee = new URL(request.url).searchParams.get("portee");
  if (!PORTEES_VALIDES.includes(portee as PorteeExport)) {
    return new NextResponse("Parametre 'portee' invalide (attendu: cours, sans-cours, tout)", { status: 400 });
  }

  const donnees = await construireExport(session.user.id, portee as PorteeExport);
  const nomFichier = `export-${portee}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(donnees, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
    },
  });
}
