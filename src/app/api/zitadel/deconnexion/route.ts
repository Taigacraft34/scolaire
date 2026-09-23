import { NextResponse } from "next/server";
import { revoquerSessions, verifierLogoutToken } from "@/lib/deconnexionBackChannel";

// Back-Channel Logout URI a declarer dans la console ZITADEL. Appelee par
// ZITADEL (pas par un navigateur) : publique dans proxy.ts, l'authenticite
// vient de la signature du logout_token.
export async function POST(request: Request) {
  const enTetes = { "Cache-Control": "no-store" };

  let logoutToken: string | null = null;
  try {
    logoutToken = (await request.formData()).get("logout_token")?.toString() ?? null;
  } catch {
    // Corps illisible : traite comme absent.
  }
  if (!logoutToken) return new NextResponse("logout_token manquant", { status: 400, headers: enTetes });

  try {
    const cible = await verifierLogoutToken(logoutToken);
    await revoquerSessions(cible);
    return new NextResponse(null, { status: 200, headers: enTetes });
  } catch (e) {
    console.error("Deconnexion back-channel refusee :", e instanceof Error ? e.message : e);
    return new NextResponse("logout_token invalide", { status: 400, headers: enTetes });
  }
}
