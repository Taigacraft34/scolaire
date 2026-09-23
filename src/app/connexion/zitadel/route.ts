import { NextResponse } from "next/server";
import { consommerIdTokenPourDeconnexion, urlDeconnexionZitadel } from "@/lib/deconnexionZitadel";

// Bouton « Se déconnecter de ZITADEL » de la pop-up de /connexion : redirige
// vers la fin de session ZITADEL, avec l'id_token memorise a la deconnexion.
export async function GET(request: Request) {
  const idToken = await consommerIdTokenPourDeconnexion();
  const url = urlDeconnexionZitadel(idToken);
  return NextResponse.redirect(url ?? new URL("/connexion", request.url));
}
