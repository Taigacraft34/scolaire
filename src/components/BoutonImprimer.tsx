"use client";

import { IconeImprimante } from "@/components/Icone";

export function BoutonImprimer() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-sm bg-[#2540c8] px-4 py-1.5 font-body text-sm font-bold uppercase tracking-wide text-white print:hidden"
    >
      <IconeImprimante /> Imprimer / PDF
    </button>
  );
}
