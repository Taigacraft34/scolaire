import type { Synchronisation } from "@/generated/prisma/client";
import { lancerSynchronisation } from "@/app/(app)/devoirs/actions";
import { BoutonSoumission } from "@/components/BoutonSoumission";

export function FormulaireSynchronisation({ derniereSynchro }: { derniereSynchro: Synchronisation | null }) {
  return (
    <div className="flex flex-col gap-2">
      <form
        action={lancerSynchronisation}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500" htmlFor="dateDebut">
            Début (test)
          </label>
          <input
            type="date"
            id="dateDebut"
            name="dateDebut"
            className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500" htmlFor="dateFin">
            Fin (test)
          </label>
          <input
            type="date"
            id="dateFin"
            name="dateFin"
            className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <BoutonSoumission
          texteChargement="Synchronisation…"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Synchroniser
        </BoutonSoumission>
      </form>

      {derniereSynchro && (
        <p className="text-xs text-zinc-500">
          Dernière synchronisation : {derniereSynchro.demarreeLe.toLocaleString("fr-FR")} —{" "}
          {derniereSynchro.statut} ({derniereSynchro.elementsImportes} éléments importés)
          {derniereSynchro.erreurs && (
            <span className="mt-1 block whitespace-pre-wrap text-red-500">{derniereSynchro.erreurs}</span>
          )}
        </p>
      )}
    </div>
  );
}
