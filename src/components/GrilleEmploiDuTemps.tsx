"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { basculerStatutDevoir } from "@/app/(app)/devoirs/actions";
import { enregistrerActiviteSeance, supprimerActiviteSeance } from "@/app/(app)/emploi-du-temps/actions";
import { BoutonSoumission } from "@/components/BoutonSoumission";
import { IconeCroix } from "@/components/Icone";
import { boutonEncadre, boutonPrincipal, boutonRouge, boutonSecondaire, champ } from "@/lib/ui";

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

export interface ContenuSeanceGrille {
  id: string;
  titre: string;
  html: string;
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
  contenus: ContenuSeanceGrille[];
  contenuSynchronise: boolean;
  contenuManuelTexte: string | null;
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

function Marque({
  lettre,
  couleur,
  libelle,
}: {
  lettre: string;
  couleur: "rouge" | "vert" | "bleu";
  libelle: string;
}) {
  return (
    <span
      title={libelle || undefined}
      aria-label={libelle || undefined}
      aria-hidden={libelle ? undefined : true}
      className={
        "grid h-[1.05rem] w-[1.05rem] place-items-center rounded-full border border-current bg-paper font-mono text-xs font-bold " +
        (couleur === "rouge"
          ? "text-bic-red"
          : couleur === "vert"
            ? "text-bic-green"
            : "text-ink-blue")
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
  const [editionActiviteId, setEditionActiviteId] = useState<string | null>(null);

  const tousBlocs = useMemo(() => jours.flatMap((j) => j.blocs), [jours]);
  const blocActif = blocActifId ? (tousBlocs.find((b) => b.id === blocActifId) ?? null) : null;

  useEffect(() => {
    if (!blocActif) return;
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") fermerBloc();
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [blocActif]);

  function ouvrirBloc(bloc: BlocGrille) {
    // Aucune info sur le cours (ni devoir, ni contrôle, ni activité) : on
    // ouvre directement le champ de saisie plutôt que le bouton "+ Ajouter".
    const aucuneInfo = bloc.devoirs.length === 0 && bloc.controles.length === 0 && bloc.contenus.length === 0;
    setEditionActiviteId(aucuneInfo ? bloc.id : null);
    setBlocActifId(bloc.id);
  }

  function fermerBloc() {
    setEditionActiviteId(null);
    setBlocActifId(null);
  }

  const legende = (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-ink-soft">
      <span className="flex items-center gap-1.5">
        <Marque lettre="T" couleur="rouge" libelle="" /> devoir
      </span>
      <span className="flex items-center gap-1.5">
        <Marque lettre="C" couleur="rouge" libelle="" /> contrôle
      </span>
      <span className="flex items-center gap-1.5">
        <Marque lettre="A" couleur="bleu" libelle="" /> activité en séance
      </span>
      <span>· rouge : à faire · vert : fait</span>
    </p>
  );

  return (
    <div className="pleine-largeur-mobile flex flex-col gap-[calc(var(--carreau)*0.75)]">
      {/* Desktop : la grille horaire. */}
      <div className="hidden overflow-x-auto border border-ink-blue bg-paper sm:block">
        <div className="min-w-[720px]">
          <div className="flex border-b border-ink-blue">
            <div className="w-12 shrink-0" />
            {jours.map((j) => (
              <div
                key={j.cle}
                className="flex-1 border-l border-ruling px-2 py-1.5 text-center font-body text-xs font-bold uppercase tracking-wide text-ink-blue"
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
                  className="tabulaire absolute right-1 -translate-y-1/2 font-mono text-xs text-ink-soft"
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
                  const ma = bloc.contenus.length > 0;
                  const teinte = bloc.couleur ?? "var(--ink-blue)";
                  return (
                    <button
                      key={bloc.id}
                      type="button"
                      onClick={() => ouvrirBloc(bloc)}
                      className="absolute block cursor-pointer overflow-hidden border px-1.5 py-0.5 text-left font-body text-xs leading-tight transition-colors hover:bg-paper-2"
                      style={{
                        top: bloc.top,
                        height: bloc.height,
                        left: `calc(${bloc.leftPct}% + 1px)`,
                        width: `calc(${bloc.widthPct}% - 2px)`,
                        borderColor: `color-mix(in srgb, ${teinte} 60%, var(--ruling))`,
                        backgroundColor: bloc.annule ? "transparent" : "var(--paper)",
                      }}
                    >
                      <p
                        className={
                          "flex items-center gap-1 font-bold uppercase tracking-wide " +
                          (bloc.annule ? "text-ink-soft line-through" : "text-ink")
                        }
                      >
                        <span
                          aria-hidden
                          className="inline-block h-2 w-2 shrink-0 rounded-[1px]"
                          style={{ backgroundColor: teinte, opacity: bloc.annule ? 0.4 : 1 }}
                        />
                        <span className="truncate">{bloc.matiere}</span>
                      </p>
                      <p className="tabulaire font-mono text-xs text-ink-soft">
                        {bloc.labelDeb}–{bloc.labelFin}
                      </p>
                      {bloc.salle && <p className="truncate text-ink-soft">{bloc.salle}</p>}
                      {(md || mc || ma) && (
                        <span className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                          {mc && (
                            <Marque
                              lettre="C"
                              couleur={mc}
                              libelle={mc === "rouge" ? "Contrôle à venir" : "Contrôle passé"}
                            />
                          )}
                          {md && (
                            <Marque
                              lettre="T"
                              couleur={md}
                              libelle={md === "rouge" ? "Devoir à faire" : "Devoir fait"}
                            />
                          )}
                          {ma && (
                            <Marque lettre="A" couleur="bleu" libelle="Activité en séance renseignée" />
                          )}
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

      {/* Mobile : une liste par jour, des lignes pleine largeur qu'on peut viser
          au pouce. Chaque cours ouvre le même détail (devoir/contrôle/activité). */}
      <div className="flex flex-col gap-[var(--carreau)] border border-ink-blue bg-paper p-[calc(var(--carreau)*0.5)] sm:hidden">
        {jours.filter((j) => j.blocs.length > 0).map((j) => (
          <div key={j.cle} className="flex flex-col">
            <h3 className="mb-1 border-b border-ruling pb-1 font-body text-xs font-bold uppercase tracking-wide text-ink-blue">
              {j.libelle}
            </h3>
            <ul className="flex flex-col">
              {j.blocs.map((bloc) => {
                const md = marqueDevoir(bloc.devoirs);
                const mc = marqueControle(bloc.controles);
                const ma = bloc.contenus.length > 0;
                const teinte = bloc.couleur ?? "var(--ink-blue)";
                return (
                  <li key={bloc.id}>
                    <button
                      type="button"
                      onClick={() => ouvrirBloc(bloc)}
                      className="flex w-full cursor-pointer items-baseline gap-2 py-1.5 text-left font-body text-sm"
                    >
                      <span className="tabulaire w-12 shrink-0 font-mono text-xs text-ink-soft">
                        {bloc.labelDeb}
                      </span>
                      <span
                        className={
                          "min-w-0 flex-1 " + (bloc.annule ? "text-ink-soft line-through" : "text-ink")
                        }
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="inline-block h-2 w-2 shrink-0 rounded-[1px]"
                            style={{ backgroundColor: teinte, opacity: bloc.annule ? 0.4 : 1 }}
                          />
                          <span className="font-bold uppercase tracking-wide">{bloc.matiere}</span>
                        </span>
                        {bloc.salle ? <span className="text-ink-soft"> · {bloc.salle}</span> : null}
                      </span>
                      {mc && (
                        <Marque
                          lettre="C"
                          couleur={mc}
                          libelle={mc === "rouge" ? "Contrôle à venir" : "Contrôle passé"}
                        />
                      )}
                      {md && (
                        <Marque
                          lettre="T"
                          couleur={md}
                          libelle={md === "rouge" ? "Devoir à faire" : "Devoir fait"}
                        />
                      )}
                      {ma && <Marque lettre="A" couleur="bleu" libelle="Activité en séance renseignée" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {legende}

      {blocActif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--voile)" }}
          onClick={() => fermerBloc()}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto border border-ink-blue bg-paper p-4"
            style={{ boxShadow: "0.25rem 0.5rem 1.6rem rgb(20 20 40 / 0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-ruling pb-2">
              <div>
                <h3 className="font-display text-lg leading-snug text-ink">{blocActif.matiere}</h3>
                <p className="tabulaire font-mono text-xs text-ink-soft">
                  {blocActif.labelDeb}–{blocActif.labelFin}
                  {blocActif.salle ? ` · ${blocActif.salle}` : ""}
                  {blocActif.enseignant ? ` · ${blocActif.enseignant}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fermerBloc()}
                className="text-ink-soft hover:text-bic-red"
                aria-label="Fermer"
              >
                <IconeCroix />
              </button>
            </div>

            <div className="mb-2 border border-ruling p-2">
              <span className="inline-flex rounded-sm bg-ink-blue/10 px-1.5 py-0.5 font-body text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue">
                Activité en séance
              </span>

              {blocActif.contenuSynchronise ? (
                blocActif.contenus.map((contenu) => (
                  <div key={contenu.id} className="mt-2 first:mt-1.5">
                    {contenu.titre && (
                      <p className="font-body text-sm font-bold text-ink">{contenu.titre}</p>
                    )}
                    <div
                      className="mt-1 whitespace-pre-wrap font-body text-xs text-ink-soft [&_a]:text-ink-blue [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: contenu.html }}
                    />
                  </div>
                ))
              ) : editionActiviteId === blocActif.id ? (
                <form
                  action={enregistrerActiviteSeance}
                  onSubmit={() => setEditionActiviteId(null)}
                  className="mt-2 flex flex-col gap-2"
                >
                  <input type="hidden" name="seanceId" value={blocActif.id} />
                  <input type="hidden" name="retour" value={retour} />
                  <textarea
                    name="contenu"
                    rows={4}
                    defaultValue={blocActif.contenuManuelTexte ?? ""}
                    placeholder="Ce qui a été fait en cours…"
                    autoFocus
                    className={champ + " text-xs"}
                  />
                  <div className="flex gap-3">
                    <BoutonSoumission texteChargement="…" className={boutonPrincipal + " text-xs"}>
                      Enregistrer
                    </BoutonSoumission>
                    <button
                      type="button"
                      onClick={() => setEditionActiviteId(null)}
                      className={boutonEncadre + " text-xs"}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : blocActif.contenus.length > 0 ? (
                <div className="mt-2">
                  <p className="whitespace-pre-wrap font-body text-xs text-ink-soft">
                    {blocActif.contenuManuelTexte}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditionActiviteId(blocActif.id)}
                      className={boutonSecondaire + " text-xs"}
                    >
                      Modifier
                    </button>
                    <form action={supprimerActiviteSeance} className="contents">
                      <input type="hidden" name="seanceId" value={blocActif.id} />
                      <input type="hidden" name="retour" value={retour} />
                      <BoutonSoumission texteChargement="…" className={boutonRouge}>
                        Supprimer
                      </BoutonSoumission>
                    </form>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditionActiviteId(blocActif.id)}
                  className={boutonSecondaire + " mt-2 ml-1.5 text-xs"}
                >
                  + Ajouter une activité en séance
                </button>
              )}
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
    </div>
  );
}
