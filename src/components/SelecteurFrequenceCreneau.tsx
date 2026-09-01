"use client";

import { useState } from "react";
import { LIBELLES_TYPE_SEMAINE } from "@/lib/emploiDuTemps";

// Le rang S1Q (1 a 4) n'a de sens que si la frequence choisie est S1Q : on
// l'affiche uniquement dans ce cas, comme pour le choix matiere/nouvelle matiere.
export function SelecteurFrequenceCreneau() {
  const [typeSemaine, setTypeSemaine] = useState<string>("CHAQUE_SEMAINE");

  return (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500" htmlFor="typeSemaine">
          Frequence
        </label>
        <select
          id="typeSemaine"
          name="typeSemaine"
          value={typeSemaine}
          onChange={(e) => setTypeSemaine(e.target.value)}
          className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {Object.entries(LIBELLES_TYPE_SEMAINE).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </select>
      </div>
      {typeSemaine === "S1Q" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500" htmlFor="rangS1Q">
            Semaine (1 a 4)
          </label>
          <select
            id="rangS1Q"
            name="rangS1Q"
            required
            defaultValue=""
            className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="" disabled>
              Choisir…
            </option>
            {[1, 2, 3, 4].map((rang) => (
              <option key={rang} value={rang}>
                {rang}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
