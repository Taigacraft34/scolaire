"use client";

import { useState } from "react";
import { SelecteurMatiereChamp } from "./SelecteurMatiereChamp";
import { formatDateInput, prochaineDateCours, type SeanceMinimale } from "@/lib/prochainCours";
import { champ as CLASSE_CHAMP, label as CLASSE_LABEL } from "@/lib/ui";

// Ligne "Matiere / Titre / Date" du formulaire d'ajout de devoir. Choisir une
// matiere pre-remplit la date avec celle du prochain cours de cette matiere
// (les cours du jour meme sont ignores) ; la date reste modifiable.
export function ChampsDevoir({
  matieres,
  seances,
}: {
  matieres: string[];
  seances: SeanceMinimale[];
}) {
  const [matiere, setMatiere] = useState("");
  const [date, setDate] = useState("");
  const [dateModifiee, setDateModifiee] = useState(false);

  function changerMatiere(nom: string) {
    setMatiere(nom);
    if (dateModifiee) return;
    const prochaine = prochaineDateCours(seances, nom);
    setDate(prochaine ? formatDateInput(prochaine) : "");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <SelecteurMatiereChamp matieres={matieres} valeur={matiere} onChange={changerMatiere} />
      <div className="flex flex-1 min-w-40 flex-col gap-1">
        <label className={CLASSE_LABEL} htmlFor="titre">
          Titre
        </label>
        <input id="titre" name="titre" required className={CLASSE_CHAMP} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={CLASSE_LABEL} htmlFor="date">
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          required
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setDateModifiee(true);
          }}
          className={CLASSE_CHAMP}
        />
      </div>
    </div>
  );
}
