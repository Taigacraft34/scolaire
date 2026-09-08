"use client";

import { useState } from "react";
import { champ as CLASSE_CHAMP, label as CLASSE_LABEL, blocChamp } from "@/lib/ui";

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
    <div className={blocChamp}>
      <div className="flex items-center justify-between gap-2">
        <label className={CLASSE_LABEL} htmlFor="matiere">
          Matière
        </label>
        {matieres.length > 0 && (
          <button
            type="button"
            onClick={basculer}
            className="hidden shrink-0 font-body text-[0.72rem] font-bold text-ink-blue underline decoration-1 underline-offset-2 hover:decoration-2 sm:inline-block"
          >
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
