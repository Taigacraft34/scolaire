"use client";

import { useRef, useState } from "react";

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

const COULEURS = [
  { nom: "Par défaut", valeur: "inherit" },
  { nom: "Rouge", valeur: "#dc2626" },
  { nom: "Bleu", valeur: "#2563eb" },
  { nom: "Vert", valeur: "#16a34a" },
  { nom: "Orange", valeur: "#ea580c" },
];

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
      className="rounded border border-zinc-300 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
        <BoutonBarreOutils titre="Souligne" onClick={() => appliquer("underline")}>
          <span className="underline">S</span>
        </BoutonBarreOutils>
        <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        <BoutonBarreOutils titre="Petit texte" onClick={() => appliquer("fontSize", "2")}>
          Petit
        </BoutonBarreOutils>
        <BoutonBarreOutils titre="Texte normal" onClick={() => appliquer("fontSize", "3")}>
          Normal
        </BoutonBarreOutils>
        <BoutonBarreOutils titre="Grand texte" onClick={() => appliquer("fontSize", "5")}>
          Grand
        </BoutonBarreOutils>
        <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
        {COULEURS.map((c) => (
          <button
            key={c.valeur}
            type="button"
            title={c.nom}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => appliquer("foreColor", c.valeur)}
            className="h-5 w-5 rounded-full border border-zinc-300 dark:border-zinc-600"
            style={{ backgroundColor: c.valeur === "inherit" ? "transparent" : c.valeur }}
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
        className="min-h-20 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
      />
      <input type="hidden" name="blocTexteHtml" ref={hiddenRef} defaultValue={contenuHtmlInitial ?? ""} />
    </div>
  );
}

function BlocFichierChamp({ documentExistant }: { documentExistant?: DocumentExistant }) {
  return (
    <div className="flex-1">
      {documentExistant && (
        <p className="mb-1 text-xs text-zinc-500">
          Fichier actuel : <span className="font-medium">{documentExistant.nomFichier}</span>
        </p>
      )}
      <input type="hidden" name="blocFichierExistantId" value={documentExistant?.id ?? ""} readOnly />
      <input type="file" name="blocFichier" className="w-full text-sm text-zinc-700 dark:text-zinc-300" />
      {documentExistant && (
        <p className="mt-1 text-xs text-zinc-400">Laisser vide pour conserver ce fichier.</p>
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
            className="flex items-start gap-2 rounded border border-zinc-300 bg-zinc-100 p-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <span
              draggable
              onDragStart={() => {
                idGlisse.current = bloc.id;
              }}
              title="Glisser pour réordonner"
              className="cursor-grab select-none px-1 py-1 text-zinc-400"
            >
              ⠿
            </span>

            <input type="hidden" name="blocType" value={bloc.type} />

            {bloc.type === "texte" ? (
              <BlocTexteRiche contenuHtmlInitial={bloc.contenuHtmlInitial} />
            ) : (
              <BlocFichierChamp documentExistant={bloc.documentExistant} />
            )}

            {blocs.length > 1 && (
              <button
                type="button"
                onClick={() => supprimerBloc(bloc.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Supprimer
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => ajouterBloc("texte")}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          + Texte
        </button>
        <button
          type="button"
          onClick={() => ajouterBloc("fichier")}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          + Fichier
        </button>
      </div>
    </div>
  );
}
