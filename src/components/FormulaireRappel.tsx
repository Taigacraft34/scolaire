import { BoutonSoumission } from "@/components/BoutonSoumission";
import { boutonPrincipal, champ, label } from "@/lib/ui";
import { HEURE_RAPPEL_PAR_DEFAUT, JOURS_SEMAINE } from "@/lib/rappels";

export interface RappelFormulaire {
  id: string;
  titre: string;
  description: string | null;
  jours: number[];
  heure: string;
  matiereId: string | null;
  actif: boolean;
}

// Formulaire de création (sans `rappel`) ou de modification d'un rappel : les
// deux partagent les mêmes champs, seule l'action serveur diffère.
export function FormulaireRappel({
  action,
  matieres,
  rappel,
  idPrefixe,
  texteBouton,
}: {
  action: (formData: FormData) => void | Promise<void>;
  matieres: { id: string; nom: string }[];
  rappel?: RappelFormulaire;
  idPrefixe: string;
  texteBouton: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      {rappel && <input type="hidden" name="rappelId" value={rappel.id} />}

      <div className="flex flex-col gap-1">
        <label className={label} htmlFor={`${idPrefixe}-titre`}>
          Titre
        </label>
        <input
          id={`${idPrefixe}-titre`}
          name="titre"
          required
          maxLength={120}
          defaultValue={rappel?.titre ?? ""}
          placeholder="ex : Sac de sport"
          className={champ}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={label} htmlFor={`${idPrefixe}-description`}>
          Description (optionnel)
        </label>
        <textarea
          id={`${idPrefixe}-description`}
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={rappel?.description ?? ""}
          className={champ}
        />
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className={label}>Jours à notifier</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {JOURS_SEMAINE.map((jour) => (
            <label key={jour.valeur} className="flex items-center gap-1 font-body text-sm text-ink">
              <input
                type="checkbox"
                name="jours"
                value={jour.valeur}
                defaultChecked={rappel?.jours.includes(jour.valeur) ?? false}
              />
              {jour.libelle}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-32 flex-col gap-1">
          <label className={label} htmlFor={`${idPrefixe}-heure`}>
            Heure d&apos;envoi
          </label>
          <input
            id={`${idPrefixe}-heure`}
            name="heure"
            type="time"
            required
            defaultValue={rappel?.heure ?? HEURE_RAPPEL_PAR_DEFAUT}
            className={champ}
          />
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <label className={label} htmlFor={`${idPrefixe}-matiere`}>
            Matière (optionnel)
          </label>
          <select
            id={`${idPrefixe}-matiere`}
            name="matiereId"
            defaultValue={rappel?.matiereId ?? ""}
            className={champ}
          >
            <option value="">Aucune matière</option>
            {matieres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rappel && (
        <label className="flex items-center gap-1 font-body text-sm text-ink">
          <input type="checkbox" name="actif" value="1" defaultChecked={rappel.actif} />
          Rappel actif
        </label>
      )}

      <BoutonSoumission className={boutonPrincipal + " self-start"}>{texteBouton}</BoutonSoumission>
    </form>
  );
}
