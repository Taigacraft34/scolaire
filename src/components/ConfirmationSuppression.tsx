"use client";

import { useState } from "react";
import { BoutonSoumission } from "./BoutonSoumission";
import { label } from "@/lib/ui";

// Exige la saisie exacte d'un mot avant d'activer le bouton, contre le clic
// accidentel sur une action irréversible.
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
        <label className={label} htmlFor="confirmation">
          Tapez « {motAttendu} » pour confirmer
        </label>
        <input
          id="confirmation"
          name="confirmation"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          autoComplete="off"
          className="w-48 rounded-sm border border-bic-red/60 bg-paper px-2.5 py-1.5 font-mono text-sm text-ink outline-none focus:border-bic-red"
        />
      </div>
      <BoutonSoumission
        disabled={valeur !== motAttendu}
        texteChargement="Suppression…"
        className="inline-flex items-center rounded-sm bg-bic-red px-4 py-1.5 font-body text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none"
      >
        {children}
      </BoutonSoumission>
    </div>
  );
}
