"use client";

import { IconeCorbeille } from "@/components/Icone";
import { boutonRouge } from "@/lib/ui";

export function BoutonSupprimer({
  libelle = "Supprimer",
  confirmation = "Supprimer définitivement cet élément ?",
}: {
  libelle?: string;
  confirmation?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmation)) e.preventDefault();
      }}
      className={boutonRouge}
    >
      <IconeCorbeille />
      {libelle}
    </button>
  );
}
