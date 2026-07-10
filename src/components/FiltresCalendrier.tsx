"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function FiltresCalendrier({
  matieres,
  matiereActuelle,
  typeActuel,
}: {
  matieres: string[];
  matiereActuelle: string;
  typeActuel: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function mettreAJour(cle: string, valeur: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valeur) params.set(cle, valeur);
    else params.delete(cle);
    router.push(`/calendrier?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={matiereActuelle}
        onChange={(e) => mettreAJour("matiere", e.target.value)}
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Toutes les matieres</option>
        {matieres.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={typeActuel}
        onChange={(e) => mettreAJour("type", e.target.value)}
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Devoirs et controles</option>
        <option value="devoir">Devoirs uniquement</option>
        <option value="controle">Controles uniquement</option>
      </select>
    </div>
  );
}
