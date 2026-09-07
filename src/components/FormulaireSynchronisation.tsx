import type { Synchronisation } from "@/generated/prisma/client";
import { lancerSynchronisation } from "@/app/(app)/devoirs/actions";
import { BoutonSoumission } from "@/components/BoutonSoumission";
import { boutonPrincipal, champ, encart, label } from "@/lib/ui";

export function FormulaireSynchronisation({ derniereSynchro }: { derniereSynchro: Synchronisation | null }) {
  return (
    <div className="flex flex-col gap-2">
      <form action={lancerSynchronisation} className={encart + " flex flex-wrap items-end gap-3"}>
        <div className="flex flex-col gap-1">
          <label className={label} htmlFor="dateDebut">
            Début (test)
          </label>
          <input type="date" id="dateDebut" name="dateDebut" className={champ} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label} htmlFor="dateFin">
            Fin (test)
          </label>
          <input type="date" id="dateFin" name="dateFin" className={champ} />
        </div>
        <BoutonSoumission texteChargement="Synchronisation…" className={boutonPrincipal}>
          Synchroniser
        </BoutonSoumission>
      </form>

      {derniereSynchro && (
        <p className="font-body text-xs text-ink-soft">
          Dernière synchronisation :{" "}
          <span className="tabulaire font-mono">
            {derniereSynchro.demarreeLe.toLocaleString("fr-FR")}
          </span>{" "}
          — {derniereSynchro.statut} ({derniereSynchro.elementsImportes} éléments importés)
          {derniereSynchro.erreurs && (
            <span className="mt-1 block whitespace-pre-wrap text-bic-red">{derniereSynchro.erreurs}</span>
          )}
        </p>
      )}
    </div>
  );
}
