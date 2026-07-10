"use client";

export function BoutonImprimer() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] print:hidden dark:hover:bg-[#ccc]"
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
