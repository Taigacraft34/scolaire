import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { prisma } from "@/lib/prisma";

// OIDC Back-Channel Logout : quand une session ZITADEL est fermee (bouton
// « Se deconnecter de ZITADEL », deconnexion depuis la console, autre app…),
// ZITADEL POSTe un logout_token a /api/zitadel/deconnexion. Les sessions de
// l'app etant des JWT sans etat, on ne peut pas les supprimer : on memorise
// la revocation, et le callback jwt (auth.ts) refuse la session a la requete
// suivante.

const EVENEMENT_DECONNEXION = "http://schemas.openid.net/event/backchannel-logout";
// Duree de vie d'une session de l'app (defaut Auth.js) : au-dela, un "sid"
// revoque ne peut plus correspondre a aucune session valide.
const DUREE_SESSION_MS = 30 * 24 * 3600 * 1000;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

async function clesZitadel() {
  if (jwks) return jwks;
  const issuer = process.env.ZITADEL_ISSUER;
  if (!issuer) throw new Error("ZITADEL_ISSUER n'est pas configure.");
  const decouverte = await fetch(new URL("/.well-known/openid-configuration", issuer));
  if (!decouverte.ok) throw new Error(`Decouverte OIDC : ${decouverte.status}`);
  const { jwks_uri } = (await decouverte.json()) as { jwks_uri: string };
  jwks = createRemoteJWKSet(new URL(jwks_uri));
  return jwks;
}

// Verifie le logout_token comme un id_token (signature, iss, aud, iat) plus
// les regles propres au back-channel (evenement, pas de nonce, sub ou sid).
export async function verifierLogoutToken(logoutToken: string): Promise<{ sub?: string; sid?: string }> {
  const { payload } = await jwtVerify(logoutToken, await clesZitadel(), {
    issuer: process.env.ZITADEL_ISSUER?.replace(/\/$/, ""),
    audience: process.env.ZITADEL_CLIENT_ID,
    maxTokenAge: "15m",
  });

  const evenements = (payload as JWTPayload & { events?: Record<string, unknown> }).events;
  if (!evenements || typeof evenements !== "object" || !(EVENEMENT_DECONNEXION in evenements)) {
    throw new Error("logout_token sans evenement backchannel-logout");
  }
  if ("nonce" in payload) throw new Error("logout_token ne doit pas porter de nonce");

  const sid = typeof payload.sid === "string" ? payload.sid : undefined;
  const sub = typeof payload.sub === "string" ? payload.sub : undefined;
  if (!sid && !sub) throw new Error("logout_token sans sub ni sid");
  return { sub, sid };
}

export async function revoquerSessions({ sub, sid }: { sub?: string; sid?: string }) {
  if (sid) {
    // Une session ZITADEL precise : les autres appareils restent connectes.
    await prisma.sessionZitadelRevoquee.upsert({ where: { sid }, update: {}, create: { sid } });
  } else if (sub) {
    // Pas de sid : on ne sait pas laquelle, toutes les sessions de ce compte tombent.
    await prisma.utilisateur.updateMany({ where: { zitadelSub: sub }, data: { sessionsRevoqueesLe: new Date() } });
  }

  await prisma.sessionZitadelRevoquee.deleteMany({
    where: { revoqueeLe: { lt: new Date(Date.now() - DUREE_SESSION_MS) } },
  });
}
