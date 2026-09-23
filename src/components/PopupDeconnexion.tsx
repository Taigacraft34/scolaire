"use client";

import { useEffect, useRef } from "react";
import { IconeCroix } from "@/components/Icone";
import { boutonPrincipal, boutonSecondaire } from "@/lib/ui";

// Affichée sur /connexion juste après « Quitter » : la session de l'app est
// fermée, mais pas celle de ZITADEL. Sans ça, « Se connecter » reconnecte le
// même compte sans rien demander, ce qui surprend sur un appareil partagé.
export function PopupDeconnexion() {
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogue.current?.showModal();
    // Retire ?deconnexion=1 de l'URL : un rechargement ne rouvre pas la pop-up.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return (
    <dialog
      ref={dialogue}
      aria-labelledby="titre-deconnexion"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-sm border border-ink-blue bg-paper p-[var(--carreau)] text-ink backdrop:bg-ink/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="titre-deconnexion" className="font-display text-xl font-semibold leading-tight">
          Tu es déconnecté de l’app
        </h2>
        <form method="dialog">
          <button type="submit" className="text-ink-soft hover:text-bic-red" aria-label="Fermer">
            <IconeCroix />
          </button>
        </form>
      </div>
      <p className="mt-2 font-body text-sm leading-[var(--carreau)] text-ink-soft">
        Ta session <strong className="text-ink">ZITADEL</strong> est toujours ouverte : « Se connecter » te
        reconnectera directement, sans mot de passe. Sur un appareil partagé, déconnecte-toi aussi de ZITADEL.
      </p>
      <div className="mt-[var(--carreau)] flex flex-wrap items-center gap-x-6 gap-y-3">
        <a href="/connexion/zitadel" className={boutonPrincipal}>
          Se déconnecter de ZITADEL
        </a>
        <form method="dialog">
          <button type="submit" className={boutonSecondaire}>
            Rester connecté à ZITADEL
          </button>
        </form>
      </div>
    </dialog>
  );
}
