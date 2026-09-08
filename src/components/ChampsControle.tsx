"use client";

import { useMemo, useState } from "react";
import { SelecteurMatiereChamp } from "./SelecteurMatiereChamp";
import { formatDateInput, prochaineDateCours, type SeanceMinimale } from "@/lib/prochainCours";
import { champ as CLASSE_CHAMP, label as CLASSE_LABEL, blocChamp } from "@/lib/ui";

interface DevoirOption {
  id: string;
  matiereNom: string;
  libelle: string;
  date: string; // "YYYY-MM-DD"
}

// Champs "Matiere / Devoir associe / Date" du formulaire d'ajout de controle.
// - choisir une matiere pre-remplit la date avec celle du prochain cours de
//   cette matiere (les cours du jour meme sont ignores) ;
// - associer un devoir pre-remplit la date avec celle du devoir.
// La date reste toujours modifiable a la main.
export function ChampsControle({
  matieres,
  devoirs,
  seances,
}: {
  matieres: string[];
  devoirs: DevoirOption[];
  seances: SeanceMinimale[];
}) {
  const [matiere, setMatiere] = useState("");
  const [devoirId, setDevoirId] = useState("");
  const [date, setDate] = useState("");
  const [dateModifiee, setDateModifiee] = useState(false);

  const devoirsFiltres = useMemo(() => {
    const saisie = matiere.trim().toLowerCase();
    if (!saisie) return [];
    return devoirs.filter((d) => d.matiereNom.toLowerCase() === saisie);
  }, [devoirs, matiere]);

  function appliquerDateAuto(matiereCourante: string, devoirIdCourant: string) {
    if (dateModifiee) return;
    if (devoirIdCourant) {
      const devoir = devoirs.find((d) => d.id === devoirIdCourant);
      if (devoir) {
        setDate(devoir.date);
        return;
      }
    }
    const prochaine = prochaineDateCours(seances, matiereCourante);
    setDate(prochaine ? formatDateInput(prochaine) : "");
  }

  function changerMatiere(nom: string) {
    setMatiere(nom);
    const devoirEncoreValide = devoirs.some(
      (d) => d.id === devoirId && d.matiereNom.toLowerCase() === nom.trim().toLowerCase(),
    );
    const devoirIdRetenu = devoirEncoreValide ? devoirId : "";
    if (!devoirEncoreValide) setDevoirId("");
    appliquerDateAuto(nom, devoirIdRetenu);
  }

  function changerDevoir(id: string) {
    setDevoirId(id);
    appliquerDateAuto(matiere, id);
  }

  return (
    <>
      <SelecteurMatiereChamp matieres={matieres} valeur={matiere} onChange={changerMatiere} />

      <div className={blocChamp}>
        <label className={CLASSE_LABEL} htmlFor="devoirId">
          Devoir associé (optionnel)
        </label>
        <select
          id="devoirId"
          name="devoirId"
          value={devoirId}
          onChange={(e) => changerDevoir(e.target.value)}
          disabled={devoirsFiltres.length === 0}
          className={CLASSE_CHAMP}
        >
          <option value="">{matiere.trim() ? "Aucun" : "Choisissez d'abord une matiere"}</option>
          {devoirsFiltres.map((devoir) => (
            <option key={devoir.id} value={devoir.id}>
              {devoir.libelle}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 sm:min-w-[9rem]">
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
    </>
  );
}
