import { cookies, headers } from "next/headers";
import { getToken } from "next-auth/jwt";

// Apres « Quitter », /connexion propose de fermer aussi la session ZITADEL.
// Pour que ZITADEL sache quel compte deconnecter sans rien demander, on lui
// passe l'id_token recu a la connexion (id_token_hint). La session de l'app
// etant detruite par signOut, l'id_token est recopie juste avant dans ce
// cookie ephemere, httpOnly, limite a /connexion ; il n'apparait jamais dans
// le HTML et n'est lu que par la route /connexion/zitadel.
const COOKIE_ID_TOKEN = "deconnexion-zitadel";
const securise = process.env.AUTH_URL?.startsWith("https://") ?? false;

export async function memoriserIdTokenPourDeconnexion() {
  const jeton = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    secureCookie: securise,
  });
  const idToken = typeof jeton?.idToken === "string" ? jeton.idToken : null;
  if (!idToken) return;

  (await cookies()).set(COOKIE_ID_TOKEN, idToken, {
    httpOnly: true,
    secure: securise,
    sameSite: "lax",
    path: "/connexion",
    maxAge: 15 * 60,
  });
}

// Lit puis efface le cookie : l'id_token ne sert qu'une fois.
export async function consommerIdTokenPourDeconnexion(): Promise<string | null> {
  const jar = await cookies();
  const idToken = jar.get(COOKIE_ID_TOKEN)?.value ?? null;
  jar.delete({ name: COOKIE_ID_TOKEN, path: "/connexion" });
  return idToken;
}

// Endpoint end_session de ZITADEL. Avec id_token_hint, ZITADEL ferme la
// session de ce compte precis ; sans (sessions ouvertes avant cette version),
// client_id suffit a valider la redirection de retour. Dans les deux cas,
// l'URI de retour doit etre declaree dans la console ZITADEL (Post Logout URIs).
export function urlDeconnexionZitadel(idToken: string | null): string | null {
  const issuer = process.env.ZITADEL_ISSUER;
  const clientId = process.env.ZITADEL_CLIENT_ID;
  const origine = process.env.AUTH_URL;
  if (!issuer || !clientId || !origine) return null;

  const url = new URL("/oidc/v1/end_session", issuer);
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("post_logout_redirect_uri", new URL("/connexion", origine).toString());
  return url.toString();
}
