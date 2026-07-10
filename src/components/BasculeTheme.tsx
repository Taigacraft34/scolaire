"use client";

import { useSyncExternalStore } from "react";

function sinscrire(callback: () => void) {
  const observateur = new MutationObserver(callback);
  observateur.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observateur.disconnect();
}

function lireEtatClient() {
  return document.documentElement.classList.contains("dark");
}

function lireEtatServeur() {
  return false;
}

export function BasculeTheme() {
  const sombre = useSyncExternalStore(sinscrire, lireEtatClient, lireEtatServeur);

  function basculer() {
    const nouveauSombre = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nouveauSombre);
    try {
      localStorage.setItem("theme", nouveauSombre ? "dark" : "light");
    } catch {
      // localStorage indisponible (navigation privee, etc.) : le choix ne sera pas retenu.
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      title={sombre ? "Passer au theme clair" : "Passer au theme sombre"}
      className="text-sm hover:text-zinc-950 dark:hover:text-zinc-50"
    >
      {sombre ? "☀️" : "🌙"}
    </button>
  );
}
