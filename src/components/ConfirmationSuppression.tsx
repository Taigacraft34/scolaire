"use client";

import { useState } from "react";
import { BoutonSoumission } from "./BoutonSoumission";

// Exige la saisie exacte d'un mot avant d'activer le bouton, pour eviter
// qu'une reinitialisation irreversible parte d'un simple clic accidentel.
export function ConfirmationSuppression({
  motAttendu,
  children,
}: {
  motAttendu: string;
  children: React.ReactNode;
}) {
  const [valeur, setValeur] = useState("");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500" htmlFor="confirmation">
          Tapez « {motAttendu} » pour confirmer
        </label>
        <input
          id="confirmation"
          name="confirmation"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          autoComplete="off"
          className="rounded border border-red-300 px-2 py-1 text-sm dark:border-red-900 dark:bg-zinc-900"
        />
      </div>
      <BoutonSoumission
        disabled={valeur !== motAttendu}
        texteChargement="Suppression…"
        className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </BoutonSoumission>
    </div>
  );
}
