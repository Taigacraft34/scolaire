import Link from "next/link";
import { signIn } from "@/auth";
import { AnnotationMarge, FeuilleSeule } from "@/components/FeuilleSeule";
import { BoutonSoumission } from "@/components/BoutonSoumission";
import { boutonPrincipal, boutonSecondaire } from "@/lib/ui";

export const metadata = { title: "Connexion impossible" };

// Remplace la page d'erreur par defaut d'Auth.js (pages.error dans auth.ts),
// dont le bouton "Sign in" pointait vers ".../error?error=AccessDenied/signin".
// Auth.js y redirige avec ?error=<code> : AccessDenied quand le callback
// signIn refuse (email non autorise, compte desactive), Configuration pour un
// probleme cote serveur, Verification pour un lien expire, sinon Default.
const MESSAGES: Record<string, { annotation: string; titre: string; texte: string }> = {
  AccessDenied: {
    annotation: "Accès refusé",
    titre: "Ce compte n'a pas accès",
    texte:
      "Le compte ZITADEL utilisé n'est pas autorisé sur cette plateforme, ou il a été désactivé. " +
      "Connecte-toi avec un autre compte, ou demande à un administrateur d'autoriser ton adresse email.",
  },
  Configuration: {
    annotation: "Erreur serveur",
    titre: "La connexion n'a pas abouti",
    texte: "Un problème de configuration empêche la connexion. Réessaie dans quelques instants ; si ça persiste, préviens un administrateur.",
  },
  Verification: {
    annotation: "Lien expiré",
    titre: "Ce lien n'est plus valable",
    texte: "Le lien de connexion a expiré ou a déjà été utilisé. Relance une connexion.",
  },
};

const MESSAGE_PAR_DEFAUT = {
  annotation: "Erreur",
  titre: "La connexion n'a pas abouti",
  texte: "Une erreur inattendue s'est produite pendant la connexion. Réessaie.",
};

export default async function PageErreurConnexion({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = (error && MESSAGES[error]) || MESSAGE_PAR_DEFAUT;
  const accesRefuse = error === "AccessDenied";

  return (
    <FeuilleSeule>
      <h1 className="font-display text-4xl font-semibold leading-tight text-ink">
        <AnnotationMarge>{message.annotation}</AnnotationMarge>
        <span className="block">{message.titre}</span>
      </h1>
      <p className="font-body text-sm leading-[var(--carreau)] text-ink-soft">{message.texte}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <form
          action={async () => {
            "use server";
            // Accès refusé : ZITADEL a encore sa session, une simple reconnexion
            // renverrait le meme compte. "select_account" force le choix du compte.
            await signIn("zitadel", { redirectTo: "/" }, accesRefuse ? { prompt: "select_account" } : undefined);
          }}
        >
          <BoutonSoumission texteChargement="Connexion…" className={boutonPrincipal + " px-6 py-2.5"}>
            {accesRefuse ? "Utiliser un autre compte" : "Réessayer"}
          </BoutonSoumission>
        </form>
        <Link href="/connexion" className={boutonSecondaire}>
          Retour à la connexion
        </Link>
      </div>
    </FeuilleSeule>
  );
}
