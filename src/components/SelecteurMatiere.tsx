"use client";

import { useState } from "react";

// Sur certains mobiles, une option "Nouvelle matiere" placee dans le <select>
// peut etre pre-selectionnee automatiquement (ex: liste vide) sans qu'un
// evenement de changement ne se declenche, ce qui empeche de jamais basculer
// vers le champ texte. On utilise donc un bouton separe, plus fiable.
export function SelecteurMatiere({ matieres }: { matieres: string[] }) {
  const [nouvelle, setNouvelle] = useState(matieres.length === 0);

  return (
    <div className="flex flex-1 min-w-40 flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500" htmlFor="matiere">
          Matiere
        </label>
        {matieres.length > 0 && (
          <button
            type="button"
            onClick={() => setNouvelle((v) => !v)}
            className="text-xs text-zinc-500 underline"
          >
            {nouvelle ? "Choisir dans la liste" : "+ Nouvelle matiere"}
          </button>
        )}
      </div>
      {!nouvelle ? (
        <select
          id="matiere"
          name="matiere"
          required
          defaultValue=""
          className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Choisir…
          </option>
          {matieres.map((nom) => (
            <option key={nom} value={nom}>
              {nom}
            </option>
          ))}
        </select>
      ) : (
        <input
          id="matiere"
          name="matiere"
          required
          autoFocus={matieres.length > 0}
          placeholder="Nom de la matiere"
          className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      )}
    </div>
  );
}
