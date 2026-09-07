"use client";

import { useFormStatus } from "react-dom";
import { basculerStatutDevoir } from "@/app/(app)/devoirs/actions";

// La case dans la marge. Cocher un devoir y dessine un trait de stylo vert
// (le geste signature) ; le serveur renvoie l'état qui fait foi.
function Bouton({ coche }: { coche: boolean }) {
  const { pending } = useFormStatus();
  const trace = pending && !coche;

  return (
    <button
      type="submit"
      aria-pressed={coche}
      title={coche ? "Marquer non fait" : "Marquer terminé"}
      className="grid h-[1.15rem] w-[1.15rem] place-items-center rounded-sm border border-ink-soft/70 text-bic-green transition-colors hover:border-bic-green disabled:opacity-100"
      disabled={pending}
    >
      {(coche || trace) && (
        <svg viewBox="0 0 16 16" className="h-[0.95rem] w-[0.95rem]" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path
            d="M2.6 8.9c1.3.5 2.7 1.7 3.4 3 .9-3.4 3.2-6.6 6.6-8.7"
            style={
              trace
                ? { strokeDasharray: 24, strokeDashoffset: 24, animation: "trace-coche .22s cubic-bezier(.2,.8,.2,1) forwards" }
                : undefined
            }
          />
        </svg>
      )}
    </button>
  );
}

export function CaseCoche({
  coche,
  devoirId,
  retour,
}: {
  coche: boolean;
  devoirId: string;
  retour?: string;
}) {
  return (
    <form action={basculerStatutDevoir} className="contents">
      <input type="hidden" name="devoirId" value={devoirId} />
      {retour ? <input type="hidden" name="retour" value={retour} /> : null}
      <Bouton coche={coche} />
    </form>
  );
}
