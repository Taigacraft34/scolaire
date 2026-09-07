"use client";

import { useState } from "react";

const CLASSE_CHAMP =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";

// Champ "Matiere" controle (select parmi les matieres existantes ou saisie
// libre d'une nouvelle). Sur certains mobiles, une option "Nouvelle matière"
// placee dans le <select> peut etre pre-selectionnee sans declencher d'evenement
// de changement : on utilise donc un bouton separe pour basculer.
export function SelecteurMatiereChamp({
  matieres,
  valeur,
  onChange,
}: {
  matieres: string[];
  valeur: string;
  onChange: (valeur: string) => void;
}) {
  const [nouvelle, setNouvelle] = useState(matieres.length === 0);

  function basculer() {
    setNouvelle((v) => !v);
    onChange("");
  }

  return (
    <div className="flex flex-1 min-w-40 flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500" htmlFor="matiere">
          Matière
        </label>
        {matieres.length > 0 && (
          <button type="button" onClick={basculer} className="text-xs text-zinc-500 underline">
            {nouvelle ? "Choisir dans la liste" : "+ Nouvelle matière"}
          </button>
        )}
      </div>
      {!nouvelle ? (
        <select
          id="matiere"
          name="matiere"
          required
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          className={CLASSE_CHAMP}
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
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nom de la matière"
          className={CLASSE_CHAMP}
        />
      )}
    </div>
  );
}
