"use client";

import { useEffect } from "react";

// Quand on arrive sur une page depuis la barre de recherche (parametre ?focus=),
// on fait defiler jusqu'a l'element correspondant (id "element-<id>"), on ouvre
// son bloc de details s'il y en a un, et on l'entoure d'un cadre bleu qui reste
// tant que le parametre ?focus= est present.
export function MiseEnAvantRecherche({ focusId }: { focusId?: string }) {
  useEffect(() => {
    if (!focusId) return;

    const element = document.getElementById(`element-${focusId}`);
    if (!element) return;

    const details = element.querySelector("details");
    if (details) details.open = true;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("mise-en-avant");

    return () => element.classList.remove("mise-en-avant");
  }, [focusId]);

  return null;
}
