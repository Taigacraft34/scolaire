"use client";

import { useState } from "react";
import { SelecteurMatiereChamp } from "./SelecteurMatiereChamp";
import { BoutonSoumission } from "./BoutonSoumission";
import { modifierControle } from "@/app/(app)/controles/actions";
import { blocChamp, boutonPrincipal, champ, label, rangeeChamps } from "@/lib/ui";

export interface ControleModifiable {
  id: string;
  matiere: string;
  date: string; // "YYYY-MM-DD"
  chapitre: string | null;
  commentaire: string | null;
}

// Modification d'un contrôle sur place : un lien « Modifier » qui déplie le
// formulaire pré-rempli sous la ligne.
export function ModifierControle({
  controle,
  matieres,
}: {
  controle: ControleModifiable;
  matieres: string[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [matiere, setMatiere] = useState(controle.matiere);

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="self-start font-body text-xs font-bold text-ink-blue underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        Modifier
      </button>
    );
  }

  const p = (nom: string) => `${nom}-${controle.id}`;

  return (
    <form action={modifierControle} className="mt-1 flex flex-col gap-3 rounded-sm border border-ink-soft/25 bg-paper-2/60 p-3">
      <input type="hidden" name="controleId" value={controle.id} />
      <div className={rangeeChamps}>
        <SelecteurMatiereChamp
          id={p("matiere")}
          matieres={matieres.includes(controle.matiere) ? matieres : [controle.matiere, ...matieres]}
          valeur={matiere}
          onChange={setMatiere}
        />
        <div className="flex flex-col gap-1 sm:min-w-[9rem]">
          <label className={label} htmlFor={p("date")}>
            Date
          </label>
          <input type="date" id={p("date")} name="date" required defaultValue={controle.date} className={champ} />
        </div>
        <div className={blocChamp}>
          <label className={label} htmlFor={p("chapitre")}>
            Chapitre
          </label>
          <input id={p("chapitre")} name="chapitre" defaultValue={controle.chapitre ?? ""} className={champ} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className={label} htmlFor={p("commentaire")}>
          Commentaire
        </label>
        <textarea
          id={p("commentaire")}
          name="commentaire"
          rows={2}
          defaultValue={controle.commentaire ?? ""}
          className={champ}
        />
      </div>
      <div className="flex items-center gap-4">
        <BoutonSoumission texteChargement="Enregistrement…" className={boutonPrincipal}>
          Enregistrer
        </BoutonSoumission>
        <button
          type="button"
          onClick={() => {
            setOuvert(false);
            setMatiere(controle.matiere);
          }}
          className="font-body text-xs font-bold text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
