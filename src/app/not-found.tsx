import Link from "next/link";
import { AnnotationMarge, FeuilleSeule } from "@/components/FeuilleSeule";
import { boutonPrincipal, boutonSecondaire } from "@/lib/ui";

export const metadata = { title: "Page introuvable" };

export default function PageIntrouvable() {
  return (
    <FeuilleSeule>
      <h1 className="font-display text-4xl font-semibold leading-tight text-ink">
        <AnnotationMarge>404</AnnotationMarge>
        <span className="block">Page introuvable</span>
      </h1>
      <p className="font-body text-sm leading-[var(--carreau)] text-ink-soft">
        Cette page n’existe pas, ou plus. Le lien est peut-être incomplet, ou l’élément a été supprimé.
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/" className={boutonPrincipal + " px-6 py-2.5"}>
          Retour à l’accueil
        </Link>
        <Link href="/devoirs" className={boutonSecondaire}>
          Voir les devoirs
        </Link>
      </div>
    </FeuilleSeule>
  );
}
