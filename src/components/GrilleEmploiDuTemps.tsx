"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { basculerStatutDevoir } from "@/app/(app)/devoirs/actions";
import { BoutonSoumission } from "@/components/BoutonSoumission";
import { IconeCroix } from "@/components/Icone";
import { boutonEncadre, boutonPrincipal, boutonSecondaire } from "@/lib/ui";

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

function marqueDevoir(devoirs: DevoirGrille[]): "rouge" | "vert" | null {
  if (devoirs.length === 0) return null;
  return devoirs.some((d) => d.statut === "A_FAIRE") ? "rouge" : "vert";
}

function marqueControle(controles: ControleGrille[]): "rouge" | "vert" | null {
  if (controles.length === 0) return null;
  return controles.some((c) => c.aVenir) ? "rouge" : "vert";
}

function Marque({ lettre, couleur }: { lettre: string; couleur: "rouge" | "vert" }) {
  return (
    <span
      className={
        "grid h-[0.95rem] w-[0.95rem] place-items-center rounded-full border border-current font-mono text-[0.6rem] font-bold " +
        (couleur === "rouge" ? "text-bic-red" : "text-bic-green")
      }
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
  const blocActif = blocActifId ? (tousBlocs.find((b) => b.id === blocActifId) ?? null) : null;

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
      <div className="overflow-x-auto border border-ink-blue bg-paper">
        <div className="min-w-[720px]">
          <div className="flex border-b border-ink-blue">
            <div className="w-12 shrink-0" />
            {jours.map((j) => (
              <div
                key={j.cle}
                className="flex-1 border-l border-ruling px-2 py-1.5 text-center font-body text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue"
              >
                {j.libelle}
              </div>
            ))}
          </div>

          <div className="carreaux flex" style={{ height: hauteur }}>
            <div className="relative w-12 shrink-0 border-r border-ruling">
              {lignes.map((l) => (
                <div
                  key={l.top}
                  className="tabulaire absolute right-1 -translate-y-1/2 font-mono text-[0.72rem] text-ink-soft"
                  style={{ top: l.top }}
                >
                  {l.label}
                </div>
              ))}
            </div>

            {jours.map((j) => (
              <div key={j.cle} className="relative flex-1 border-l border-ruling">
                {lignes.slice(1).map((l) => (
                  <div
                    key={l.top}
                    className="absolute inset-x-0 border-t border-ruling"
                    style={{ top: l.top }}
                  />
                ))}

                {j.blocs.map((bloc) => {
                  const md = marqueDevoir(bloc.devoirs);
                  const mc = marqueControle(bloc.controles);
                  const cliquable = bloc.devoirs.length > 0 || bloc.controles.length > 0;
                  const teinte = bloc.couleur ?? "var(--ink-blue)";
                  return (
                    <button
                      key={bloc.id}
                      type="button"
                      disabled={!cliquable}
                      onClick={() => cliquable && setBlocActifId(bloc.id)}
                      className={
                        "absolute block overflow-hidden px-1.5 pt-1 pb-0.5 text-left font-body text-[0.72rem] leading-tight transition-[filter] " +
                        (cliquable ? "cursor-pointer hover:brightness-[0.97] dark:hover:brightness-110" : "cursor-default")
                      }
                      style={{
                        top: bloc.top,
                        height: bloc.height,
                        left: `calc(${bloc.leftPct}% + 1px)`,
                        width: `calc(${bloc.widthPct}% - 2px)`,
                        border: `1px solid color-mix(in srgb, ${teinte} 55%, transparent)`,
                        backgroundColor: bloc.annule
                          ? "transparent"
                          : `color-mix(in srgb, ${teinte} 12%, var(--paper))`,
                      }}
                    >
                      <p
                        className={
                          bloc.annule
                            ? "font-bold uppercase tracking-wide text-ink-soft line-through"
                            : "font-bold uppercase tracking-wide"
                        }
                        style={bloc.annule ? undefined : { color: `color-mix(in srgb, ${teinte} 78%, var(--ink))` }}
                      >
                        {bloc.matiere}
                      </p>
                      <p className="tabulaire font-mono text-[0.62rem] text-ink-soft">
                        {bloc.labelDeb}–{bloc.labelFin}
                      </p>
                      {bloc.salle && <p className="text-ink-soft">{bloc.salle}</p>}
                      {(md || mc) && (
                        <span className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                          {mc && <Marque lettre="C" couleur={mc} />}
                          {md && <Marque lettre="T" couleur={md} />}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgb(12 14 26 / 0.55)" }}
          onClick={() => setBlocActifId(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto border border-ink-blue bg-paper p-4"
            style={{ boxShadow: "0.25rem 0.5rem 1.6rem rgb(20 20 40 / 0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-ruling pb-2">
              <div>
                <h3 className="font-display text-lg leading-tight text-ink">{blocActif.matiere}</h3>
                <p className="tabulaire font-mono text-xs text-ink-soft">
                  {blocActif.labelDeb}–{blocActif.labelFin}
                  {blocActif.salle ? ` · ${blocActif.salle}` : ""}
                  {blocActif.enseignant ? ` · ${blocActif.enseignant}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBlocActifId(null)}
                className="text-ink-soft hover:text-bic-red"
                aria-label="Fermer"
              >
                <IconeCroix />
              </button>
            </div>

            {blocActif.controles.map((controle) => (
              <div key={controle.id} className="mb-2 border border-ruling p-2">
                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                  <span
                    className={
                      "inline-flex rounded-sm px-1.5 py-0.5 font-body text-[0.72rem] font-bold uppercase tracking-wide " +
                      (controle.aVenir ? "bg-bic-red/12 text-bic-red" : "bg-ink-soft/15 text-ink-soft")
                    }
                  >
                    Contrôle {controle.aVenir ? "à venir" : "passé"}
                  </span>
                  <span className="tabulaire font-mono text-xs text-ink-soft">
                    {controle.dateLabel}
                    {controle.heure ? ` à ${controle.heure}` : ""}
                  </span>
                </div>
                <p className="font-body text-sm text-ink">{controle.intitule}</p>
                {controle.commentaire && (
                  <p className="mt-1 whitespace-pre-wrap font-body text-xs text-ink-soft">
                    {controle.commentaire}
                  </p>
                )}
                <Link href={`/controles?focus=${controle.id}`} className={boutonSecondaire + " mt-1.5 text-xs"}>
                  Ouvrir dans Contrôles
                </Link>
              </div>
            ))}

            {blocActif.devoirs.map((devoir) => (
              <div key={devoir.id} className="mb-2 border border-ruling p-2">
                <div className="mb-1 flex flex-wrap items-baseline gap-2">
                  <span
                    className={
                      "inline-flex rounded-sm px-1.5 py-0.5 font-body text-[0.72rem] font-bold uppercase tracking-wide " +
                      (devoir.statut === "A_FAIRE"
                        ? "bg-bic-red/12 text-bic-red"
                        : "bg-bic-green/12 text-bic-green")
                    }
                  >
                    {devoir.statut === "A_FAIRE" ? "À faire" : "Terminé"}
                  </span>
                  <span className="tabulaire font-mono text-xs text-ink-soft">
                    Pour le {devoir.dateLabel}
                  </span>
                </div>
                <p className="font-body text-sm font-bold text-ink">{devoir.titre}</p>
                {devoir.descriptionHtml ? (
                  <div
                    className="mt-1 whitespace-pre-wrap font-body text-xs text-ink-soft [&_a]:text-ink-blue [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: devoir.descriptionHtml }}
                  />
                ) : (
                  <p className="mt-1 font-body text-xs text-ink-soft">Aucune description.</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <form action={basculerStatutDevoir}>
                    <input type="hidden" name="devoirId" value={devoir.id} />
                    <input type="hidden" name="retour" value={retour} />
                    <BoutonSoumission
                      texteChargement="…"
                      className={devoir.statut === "TERMINE" ? boutonEncadre + " text-xs" : boutonPrincipal + " text-xs"}
                    >
                      {devoir.statut === "TERMINE" ? "Marquer non fait" : "Marquer terminé"}
                    </BoutonSoumission>
                  </form>
                  <Link href={`/devoirs?focus=${devoir.id}`} className={boutonSecondaire + " text-xs"}>
                    Ouvrir dans Devoirs
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
