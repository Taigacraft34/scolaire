"use client";

import { useMemo, useState } from "react";

interface DevoirOption {
  id: string;
  matiereNom: string;
  libelle: string;
}

// Sur certains mobiles, une option "Nouvelle matiere" placee dans le <select>
// peut etre pre-selectionnee automatiquement (ex: liste vide) sans qu'un
// evenement de changement ne se declenche, ce qui empeche de jamais basculer
// vers le champ texte. On utilise donc un bouton separe, plus fiable.
// Le devoir associe propose est filtre en direct selon la matiere active.
export function SelecteurMatiereDevoir({
  matieres,
  devoirs,
}: {
  matieres: string[];
  devoirs: DevoirOption[];
}) {
  const [nouvelle, setNouvelle] = useState(matieres.length === 0);
  const [matiereSelect, setMatiereSelect] = useState("");
  const [matiereTexte, setMatiereTexte] = useState("");

  const matiereActuelle = nouvelle ? matiereTexte : matiereSelect;

  const devoirsFiltres = useMemo(() => {
    const saisie = matiereActuelle.trim().toLowerCase();
    if (!saisie) return [];
    return devoirs.filter((d) => d.matiereNom.toLowerCase() === saisie);
  }, [devoirs, matiereActuelle]);

  return (
    <>
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
            value={matiereSelect}
            onChange={(e) => setMatiereSelect(e.target.value)}
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
            value={matiereTexte}
            onChange={(e) => setMatiereTexte(e.target.value)}
            placeholder="Nom de la matiere"
            className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        )}
      </div>

      <div className="flex flex-1 min-w-40 flex-col gap-1">
        <label className="text-xs text-zinc-500" htmlFor="devoirId">
          Devoir associe (optionnel)
        </label>
        <select
          id="devoirId"
          name="devoirId"
          defaultValue=""
          disabled={devoirsFiltres.length === 0}
          className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">{matiereActuelle.trim() ? "Aucun" : "Choisissez d'abord une matiere"}</option>
          {devoirsFiltres.map((devoir) => (
            <option key={devoir.id} value={devoir.id}>
              {devoir.libelle}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
