"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { IconeChevronBas } from "@/components/Icone";
import { etiquette } from "@/lib/ui";

export interface RappelLigne {
  id: string;
  titre: string;
  description: string | null;
  matiere: string | null;
}

// Une ligne de rappel dans les listes de devoirs : pas de case (il n'y a rien à
// cocher), une étiquette « Rappel » pour ne jamais la confondre avec un devoir.
// Le titre est tronqué sur une ligne ; la ligne ne se déplie (avec son chevron)
// que s'il y a quelque chose à voir de plus : une description, ou un titre
// coupé (typiquement sur téléphone). Sinon c'est une simple ligne.
export function LigneRappel({ rappel }: { rappel: RappelLigne }) {
  const refTitre = useRef<HTMLSpanElement>(null);
  const [tronque, setTronque] = useState(false);
  const [ouvert, setOuvert] = useState(false);

  // On ne mesure que ligne repliée : dépliée, le titre passe à la ligne et
  // ne déborde plus, ce qui masquerait qu'il était tronqué.
  useLayoutEffect(() => {
    const titre = refTitre.current;
    if (!titre || ouvert) return;
    const mesurer = () => setTronque(titre.scrollWidth > titre.clientWidth);
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(titre);
    return () => observateur.disconnect();
  }, [ouvert, rappel.titre, rappel.matiere]);

  const depliable = tronque || !!rappel.description;

  const intitule = (
    <span
      ref={refTitre}
      className={
        "min-w-0 flex-1 text-ink " + (ouvert ? "whitespace-normal" : "truncate")
      }
    >
      <span className={etiquette + " mr-2 align-baseline"}>Rappel</span>
      {rappel.matiere && (
        <span className="mr-2 font-body text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue">
          {rappel.matiere}
        </span>
      )}
      {rappel.titre}
    </span>
  );

  // Toujours le même élément de ligne, dépliable ou non : en changer (div <->
  // button) recréerait le titre mesuré, et l'observateur resterait branché sur
  // l'ancien nœud détaché.
  const proprietesDepliable = depliable
    ? {
        role: "button",
        tabIndex: 0,
        "aria-expanded": ouvert,
        onClick: () => setOuvert((o) => !o),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOuvert((o) => !o);
          }
        },
      }
    : {};

  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute right-full top-[0.6rem] mr-[0.55rem] h-1.5 w-1.5 rounded-full bg-ink-blue/60"
      />
      <div
        {...proprietesDepliable}
        className={
          "flex min-h-[var(--carreau)] items-baseline gap-2 leading-[var(--carreau)] " +
          (depliable ? "cursor-pointer" : "")
        }
      >
        {intitule}
        {depliable && (
          <IconeChevronBas
            className={"shrink-0 text-ink-soft transition-transform " + (ouvert ? "rotate-180" : "")}
          />
        )}
      </div>
      {ouvert && rappel.description && (
        <p className="whitespace-pre-wrap pb-[calc(var(--carreau)*0.5)] pl-1 pt-1 font-body text-sm leading-[var(--carreau)] text-ink-soft">
          {rappel.description}
        </p>
      )}
    </li>
  );
}
