"use client";

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
      className="text-xs text-red-500 hover:underline"
    >
      {libelle}
    </button>
  );
}
