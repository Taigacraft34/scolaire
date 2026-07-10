"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function FiltresRecherche({
  matieres,
  qActuel,
  matiereActuelle,
  typeActuel,
  dateActuelle,
}: {
  matieres: string[];
  qActuel: string;
  matiereActuelle: string;
  typeActuel: string;
  dateActuelle: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(qActuel);
  const premierRendu = useRef(true);

  function mettreAJourChamp(cle: string, valeur: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valeur) params.set(cle, valeur);
    else params.delete(cle);
    router.push(`/recherche?${params.toString()}`);
  }

  // Recherche en direct pendant la frappe, avec un leger debounce pour eviter
  // une navigation a chaque caractere.
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const identifiant = setTimeout(() => {
      mettreAJourChamp("q", q);
    }, 300);
    return () => clearTimeout(identifiant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Mot-cle…"
        className="flex-1 min-w-40 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <select
        value={matiereActuelle}
        onChange={(e) => mettreAJourChamp("matiere", e.target.value)}
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
        onChange={(e) => mettreAJourChamp("type", e.target.value)}
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Tous les types</option>
        <option value="devoir">Devoirs</option>
        <option value="controle">Controles</option>
        <option value="note">Notes</option>
        <option value="chapitre">Chapitres</option>
      </select>
      <input
        type="date"
        value={dateActuelle}
        onChange={(e) => mettreAJourChamp("date", e.target.value)}
        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
    </div>
  );
}
