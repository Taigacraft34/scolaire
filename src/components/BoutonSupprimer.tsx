"use client";

import { useEffect, useRef, useState } from "react";
import { IconeCorbeille } from "@/components/Icone";
import { BoutonSoumission } from "@/components/BoutonSoumission";
import { boutonRouge } from "@/lib/ui";

// Suppression en deux temps, dans le monde de la page (pas de confirm() natif) :
// un premier clic arme, un second confirme. « Annuler » ou un clic ailleurs
// désarme. La suppression reste définitive — à manier avec soin.
export function BoutonSupprimer({
  libelle = "Supprimer",
  invite = "Confirmer la suppression ?",
}: {
  libelle?: string;
  invite?: string;
}) {
  const [arme, setArme] = useState(false);
  const zone = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!arme) return;
    function dehors(e: PointerEvent) {
      if (zone.current && !zone.current.contains(e.target as Node)) setArme(false);
    }
    function echap(e: KeyboardEvent) {
      if (e.key === "Escape") setArme(false);
    }
    document.addEventListener("pointerdown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [arme]);

  if (!arme) {
    return (
      <button type="button" onClick={() => setArme(true)} className={boutonRouge}>
        <IconeCorbeille />
        {libelle}
      </button>
    );
  }

  return (
    <span ref={zone} className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-body text-xs font-bold uppercase tracking-wide text-bic-red">
        {invite}
      </span>
      <BoutonSoumission
        texteChargement="Suppression…"
        className="inline-flex items-center gap-1.5 rounded-sm bg-bic-red px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
      >
        <IconeCorbeille />
        Supprimer
      </BoutonSoumission>
      <button
        type="button"
        onClick={() => setArme(false)}
        className="font-body text-xs font-bold text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
      >
        Annuler
      </button>
    </span>
  );
}
