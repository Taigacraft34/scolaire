"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { basculerStatutDevoir } from "@/app/(app)/devoirs/actions";
import { BoutonSoumission } from "@/components/BoutonSoumission";

export interface DevoirGrille {
  id: string;
  titre: string;
  descriptionHtml: string | null;
  statut: "A_FAIRE" | "TERMINE";
  dateLabel: string;
}

export interface ControleGrille {
  id: string;
  intitule: string;
  commentaire: string | null;
  aVenir: boolean;
  dateLabel: string;
  heure: string | null;
}

export interface BlocGrille {
  id: string;
  matiere: string;
  salle: string | null;
  enseignant: string | null;
  couleur: string | null;
  annule: boolean;
  labelDeb: string;
  labelFin: string;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
  devoirs: DevoirGrille[];
  controles: ControleGrille[];
}

export interface JourGrille {
  cle: string;
  libelle: string;
  blocs: BlocGrille[];
}

function badgeDevoir(devoirs: DevoirGrille[]): "rouge" | "vert" | null {
  if (devoirs.length === 0) return null;
  return devoirs.some((d) => d.statut === "A_FAIRE") ? "rouge" : "vert";
}

function badgeControle(controles: ControleGrille[]): "rouge" | "vert" | null {
  if (controles.length === 0) return null;
  return controles.some((c) => c.aVenir) ? "rouge" : "vert";
}

function Pastille({ lettre, couleur }: { lettre: string; couleur: "rouge" | "vert" }) {
  return (
    <span
      className={`flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] font-bold text-white ${
        couleur === "rouge" ? "bg-red-500" : "bg-green-600"
      }`}
    >
      {lettre}
    </span>
  );
}

export function GrilleEmploiDuTemps({
  jours,
  lignes,
  hauteur,
  retour,
}: {
  jours: JourGrille[];
  lignes: { label: string; top: number }[];
  hauteur: number;
  retour: string;
}) {
  const [blocActifId, setBlocActifId] = useState<string | null>(null);

  const tousBlocs = useMemo(() => jours.flatMap((j) => j.blocs), [jours]);
  // On derive le bloc affiche des donnees a jour : apres avoir marque un devoir
  // fait/non fait, la modale reflete le nouvel etat sans etre rouverte.
  const blocActif = blocActifId
    ? (tousBlocs.find((b) => b.id === blocActifId) ?? null)
    : null;

  useEffect(() => {
    if (!blocActif) return;
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setBlocActifId(null);
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [blocActif]);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="min-w-[720px]">
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <div className="w-12 shrink-0" />
            {jours.map((j) => (
              <div
                key={j.cle}
                className="flex-1 border-l border-zinc-200 px-2 py-2 text-center text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
              >
                {j.libelle}
              </div>
            ))}
          </div>

          <div className="flex" style={{ height: hauteur }}>
            <div className="relative w-12 shrink-0">
              {lignes.map((l) => (
                <div
                  key={l.top}
                  className="absolute right-1 -translate-y-1/2 text-[0.7rem] text-zinc-400"
                  style={{ top: l.top }}
                >
                  {l.label}
                </div>
              ))}
            </div>

            {jours.map((j) => (
              <div key={j.cle} className="relative flex-1 border-l border-zinc-200 dark:border-zinc-800">
                {lignes.slice(1).map((l) => (
                  <div
                    key={l.top}
                    className="absolute inset-x-0 border-t border-zinc-100 dark:border-zinc-900"
                    style={{ top: l.top }}
                  />
                ))}

                {j.blocs.map((bloc) => {
                  const bd = badgeDevoir(bloc.devoirs);
                  const bc = badgeControle(bloc.controles);
                  const cliquable = bloc.devoirs.length > 0 || bloc.controles.length > 0;
                  return (
                    <button
                      key={bloc.id}
                      type="button"
                      disabled={!cliquable}
                      onClick={() => cliquable && setBlocActifId(bloc.id)}
                      className={`absolute block overflow-hidden rounded border-l-2 px-1.5 py-1 text-left text-[0.7rem] leading-tight ${
                        cliquable ? "cursor-pointer hover:brightness-95 dark:hover:brightness-125" : "cursor-default"
                      }`}
                      style={{
                        top: bloc.top,
                        height: bloc.height,
                        left: `calc(${bloc.leftPct}% + 2px)`,
                        width: `calc(${bloc.widthPct}% - 4px)`,
                        backgroundColor:
                          bloc.couleur && !bloc.annule ? `${bloc.couleur}22` : undefined,
                        borderLeftColor: bloc.couleur ?? "#60a5fa",
                      }}
                    >
                      <p
                        className={
                          bloc.annule
                            ? "font-medium text-zinc-400 line-through dark:text-zinc-500"
                            : "font-medium text-zinc-800 dark:text-zinc-100"
                        }
                      >
                        {bloc.matiere}
                      </p>
                      <p className="text-zinc-500">
                        {bloc.labelDeb}–{bloc.labelFin}
                      </p>
                      {bloc.salle && <p className="text-zinc-400">{bloc.salle}</p>}
                      {(bd || bc) && (
                        <span className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                          {bc && <Pastille lettre="C" couleur={bc} />}
                          {bd && <Pastille lettre="T" couleur={bd} />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {blocActif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setBlocActifId(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-zinc-300 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {blocActif.matiere}
                </h3>
                <p className="text-xs text-zinc-500">
                  {blocActif.labelDeb}–{blocActif.labelFin}
                  {blocActif.salle ? ` · ${blocActif.salle}` : ""}
                  {blocActif.enseignant ? ` · ${blocActif.enseignant}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBlocActifId(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {blocActif.controles.map((controle) => (
              <div
                key={controle.id}
                className="mb-2 rounded border border-zinc-200 p-2 dark:border-zinc-800"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.7rem] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Contrôle {controle.aVenir ? "à venir" : "passé"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {controle.dateLabel}
                    {controle.heure ? ` à ${controle.heure}` : ""}
                  </span>
                </div>
                <p className="text-sm text-zinc-800 dark:text-zinc-200">{controle.intitule}</p>
                {controle.commentaire && (
                  <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400">
                    {controle.commentaire}
                  </p>
                )}
                <Link
                  href={`/controles?focus=${controle.id}`}
                  className="mt-1 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Ouvrir dans Contrôles →
                </Link>
              </div>
            ))}

            {blocActif.devoirs.map((devoir) => (
              <div
                key={devoir.id}
                className="mb-2 rounded border border-zinc-200 p-2 dark:border-zinc-800"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                      devoir.statut === "A_FAIRE"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                    }`}
                  >
                    {devoir.statut === "A_FAIRE" ? "À faire" : "Terminé"}
                  </span>
                  <span className="text-xs text-zinc-500">Pour le {devoir.dateLabel}</span>
                </div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{devoir.titre}</p>
                {devoir.descriptionHtml ? (
                  <div
                    className="mt-1 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400"
                    dangerouslySetInnerHTML={{ __html: devoir.descriptionHtml }}
                  />
                ) : (
                  <p className="mt-1 text-xs text-zinc-500">Aucune description.</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <form action={basculerStatutDevoir}>
                    <input type="hidden" name="devoirId" value={devoir.id} />
                    <input type="hidden" name="retour" value={retour} />
                    <BoutonSoumission
                      texteChargement="…"
                      className={
                        devoir.statut === "TERMINE"
                          ? "rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          : "rounded-full bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                      }
                    >
                      {devoir.statut === "TERMINE" ? "Marquer non fait" : "Marquer terminé"}
                    </BoutonSoumission>
                  </form>
                  <Link
                    href={`/devoirs?focus=${devoir.id}`}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Ouvrir dans Devoirs →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
