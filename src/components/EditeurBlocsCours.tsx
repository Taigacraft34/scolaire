"use client";

import { useRef, useState } from "react";
import { boutonEncadre, boutonRouge } from "@/lib/ui";

type TypeBloc = "texte" | "fichier";

interface DocumentExistant {
  id: string;
  nomFichier: string;
  typeMime: string;
}

export interface BlocInitial {
  type: TypeBloc;
  contenuHtml?: string;
  document?: DocumentExistant;
}

interface Bloc {
  id: string;
  type: TypeBloc;
  contenuHtmlInitial?: string;
  documentExistant?: DocumentExistant;
}

let compteur = 0;
function idLocal() {
  compteur += 1;
  return `bloc-${compteur}`;
}

// Les quatre couleurs du Bic : bleu / graphite / rouge / vert.
const COULEURS = [
  { nom: "Graphite", valeur: "#2c2c34" },
  { nom: "Bleu", valeur: "#2540c8" },
  { nom: "Rouge", valeur: "#cf1f2e" },
  { nom: "Vert", valeur: "#1c7a45" },
];

function Grip() {
  return (
    <svg viewBox="0 0 8 16" width="8" height="16" fill="currentColor" aria-hidden>
      <circle cx="2" cy="3" r="1" />
      <circle cx="6" cy="3" r="1" />
      <circle cx="2" cy="8" r="1" />
      <circle cx="6" cy="8" r="1" />
      <circle cx="2" cy="13" r="1" />
      <circle cx="6" cy="13" r="1" />
    </svg>
  );
}

function BoutonBarreOutils({
  children,
  onClick,
  titre,
}: {
  children: React.ReactNode;
  onClick: () => void;
  titre: string;
}) {
  return (
    <button
      type="button"
      title={titre}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded-sm border border-ink-soft/45 px-2 py-0.5 font-body text-xs text-ink hover:border-ink-blue hover:text-ink-blue"
    >
      {children}
    </button>
  );
}

function BlocTexteRiche({ contenuHtmlInitial }: { contenuHtmlInitial?: string }) {
  const editableRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const synchroniser = () => {
    if (hiddenRef.current && editableRef.current) {
      hiddenRef.current.value = editableRef.current.innerHTML;
    }
  };

  const appliquer = (commande: string, valeur?: string) => {
    document.execCommand(commande, false, valeur);
    synchroniser();
  };

  return (
    <div className="flex-1">
      <div className="mb-1 flex flex-wrap items-center gap-1">
        <BoutonBarreOutils titre="Gras" onClick={() => appliquer("bold")}>
          <strong>G</strong>
        </BoutonBarreOutils>
        <BoutonBarreOutils titre="Italique" onClick={() => appliquer("italic")}>
          <em>I</em>
        </BoutonBarreOutils>
        <BoutonBarreOutils titre="Souligné" onClick={() => appliquer("underline")}>
          <span className="underline">S</span>
        </BoutonBarreOutils>
        <span className="mx-1 h-4 w-px bg-ink-soft/30" />
        <BoutonBarreOutils titre="Petit" onClick={() => appliquer("fontSize", "2")}>
          Petit
        </BoutonBarreOutils>
        <BoutonBarreOutils titre="Normal" onClick={() => appliquer("fontSize", "3")}>
          Normal
        </BoutonBarreOutils>
        <BoutonBarreOutils titre="Grand" onClick={() => appliquer("fontSize", "5")}>
          Grand
        </BoutonBarreOutils>
        <span className="mx-1 h-4 w-px bg-ink-soft/30" />
        {COULEURS.map((c) => (
          <button
            key={c.valeur}
            type="button"
            title={c.nom}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => appliquer("foreColor", c.valeur)}
            className="h-5 w-5 rounded-full border border-ink-soft/40"
            style={{ backgroundColor: c.valeur }}
          />
        ))}
      </div>
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onInput={synchroniser}
        onBlur={synchroniser}
        dangerouslySetInnerHTML={{ __html: contenuHtmlInitial ?? "" }}
        className="min-h-20 rounded-sm border border-ink-soft/45 bg-paper px-2 py-1 font-body text-sm leading-[var(--carreau)] text-ink outline-none focus:border-ink-blue"
      />
      <input type="hidden" name="blocTexteHtml" ref={hiddenRef} defaultValue={contenuHtmlInitial ?? ""} />
    </div>
  );
}

function BlocFichierChamp({ documentExistant }: { documentExistant?: DocumentExistant }) {
  return (
    <div className="flex-1">
      {documentExistant && (
        <p className="mb-1 font-body text-xs text-ink-soft">
          Fichier actuel : <span className="font-bold text-ink">{documentExistant.nomFichier}</span>
        </p>
      )}
      <input type="hidden" name="blocFichierExistantId" value={documentExistant?.id ?? ""} readOnly />
      <input
        type="file"
        name="blocFichier"
        className="w-full font-body text-xs text-ink-soft file:mr-2 file:rounded-sm file:border file:border-ink-soft/50 file:bg-transparent file:px-2 file:py-1 file:font-body file:text-xs file:font-bold file:text-ink"
      />
      {documentExistant && (
        <p className="mt-1 font-body text-xs text-ink-soft/70">Laisser vide pour conserver ce fichier.</p>
      )}
    </div>
  );
}

export function EditeurBlocsCours({ blocsInitiaux }: { blocsInitiaux?: BlocInitial[] }) {
  const [blocs, setBlocs] = useState<Bloc[]>(() =>
    blocsInitiaux && blocsInitiaux.length > 0
      ? blocsInitiaux.map((b) => ({
          id: idLocal(),
          type: b.type,
          contenuHtmlInitial: b.contenuHtml,
          documentExistant: b.document,
        }))
      : [{ id: "bloc-initial", type: "texte" }],
  );
  const idGlisse = useRef<string | null>(null);

  function ajouterBloc(type: TypeBloc) {
    setBlocs((b) => [...b, { id: idLocal(), type }]);
  }

  function supprimerBloc(id: string) {
    setBlocs((b) => (b.length > 1 ? b.filter((x) => x.id !== id) : b));
  }

  function deposerSur(idCible: string) {
    const idSource = idGlisse.current;
    idGlisse.current = null;
    if (!idSource || idSource === idCible) return;

    setBlocs((b) => {
      const indexSource = b.findIndex((x) => x.id === idSource);
      const indexCible = b.findIndex((x) => x.id === idCible);
      if (indexSource === -1 || indexCible === -1) return b;
      const copie = [...b];
      const [element] = copie.splice(indexSource, 1);
      copie.splice(indexCible, 0, element);
      return copie;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {blocs.map((bloc) => (
          <div
            key={bloc.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => deposerSur(bloc.id)}
            className="flex items-start gap-2 border border-ink-soft/25 bg-paper-2/50 p-2"
          >
            <span
              draggable
              onDragStart={() => {
                idGlisse.current = bloc.id;
              }}
              title="Glisser pour réordonner"
              className="cursor-grab select-none py-1.5 text-ink-soft"
            >
              <Grip />
            </span>

            <input type="hidden" name="blocType" value={bloc.type} />

            {bloc.type === "texte" ? (
              <BlocTexteRiche contenuHtmlInitial={bloc.contenuHtmlInitial} />
            ) : (
              <BlocFichierChamp documentExistant={bloc.documentExistant} />
            )}

            {blocs.length > 1 && (
              <button type="button" onClick={() => supprimerBloc(bloc.id)} className={boutonRouge}>
                Supprimer
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => ajouterBloc("texte")} className={boutonEncadre + " text-xs"}>
          + Texte
        </button>
        <button type="button" onClick={() => ajouterBloc("fichier")} className={boutonEncadre + " text-xs"}>
          + Fichier
        </button>
      </div>
    </div>
  );
}
