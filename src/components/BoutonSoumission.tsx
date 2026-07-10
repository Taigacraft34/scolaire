"use client";

import { useFormStatus } from "react-dom";

// Doit etre rendu a l'interieur d'un <form> : useFormStatus lit l'etat du
// formulaire parent le plus proche pour afficher un indicateur pendant l'envoi.
export function BoutonSoumission({
  children,
  texteChargement = "En cours…",
  className,
}: {
  children: React.ReactNode;
  texteChargement?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {texteChargement}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
