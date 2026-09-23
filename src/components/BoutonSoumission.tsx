"use client";

import { useFormStatus } from "react-dom";

// Doit etre rendu a l'interieur d'un <form> : useFormStatus lit l'etat du
// formulaire parent le plus proche pour afficher un indicateur pendant l'envoi.
export function BoutonSoumission({
  children,
  texteChargement = "En cours…",
  className,
  disabled = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  texteChargement?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} aria-label={ariaLabel} className={className}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          {/* spinner-anime : exempte explicitement de la règle globale
              prefers-reduced-motion (voir globals.css) - trop petit et
              fonctionnel pour le mouvement que cette préférence vise à
              éviter, et sans lui rien n'indique qu'une action est en cours. */}
          <span className="spinner-anime h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {texteChargement}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
