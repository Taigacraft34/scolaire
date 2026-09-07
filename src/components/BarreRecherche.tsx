"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

type Resultat = {
  id: string;
  titre: string;
  matiere: string;
  date?: string;
  href: string;
};

type Donnees = {
  devoirs: Resultat[];
  controles: Resultat[];
  cours: Resultat[];
};

type Onglet = "tous" | "devoirs" | "controles" | "cours";

const DONNEES_VIDES: Donnees = { devoirs: [], controles: [], cours: [] };

function IconeLoupe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" height="1em" width="1em" aria-hidden {...props}>
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
    </svg>
  );
}

function IconeDevoir(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" height="1em" width="1em" aria-hidden {...props}>
      <path d="M5 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M6 4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5" />
    </svg>
  );
}

function IconeControle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" height="1em" width="1em" aria-hidden {...props}>
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
      <path d="M2.5 4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5zM9 8a1 1 0 0 1 1-1h5v2h-5a1 1 0 0 1-1-1m-8 2h4a1 1 0 1 1 0 2H1z" />
    </svg>
  );
}

function IconeCours(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" height="1em" width="1em" aria-hidden {...props}>
      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492z" />
    </svg>
  );
}

const ONGLETS: { cle: Onglet; titre: string; Icone: typeof IconeLoupe }[] = [
  { cle: "tous", titre: "Tous", Icone: IconeLoupe },
  { cle: "devoirs", titre: "Devoirs", Icone: IconeDevoir },
  { cle: "controles", titre: "Controles", Icone: IconeControle },
  { cle: "cours", titre: "Cours", Icone: IconeCours },
];

export function BarreRecherche() {
  const [q, setQ] = useState("");
  const [donnees, setDonnees] = useState<Donnees>(DONNEES_VIDES);
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [chargement, setChargement] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const listeId = useId();

  // Ferme la popup au clic exterieur.
  useEffect(() => {
    function surClic(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, []);

  // Recherche en direct avec un leger debounce.
  useEffect(() => {
    const requete = q.trim();
    if (requete.length < 1) return;

    const controleur = new AbortController();
    const identifiant = setTimeout(async () => {
      setChargement(true);
      try {
        const reponse = await fetch(`/api/recherche?q=${encodeURIComponent(requete)}`, {
          signal: controleur.signal,
        });
        if (!reponse.ok) throw new Error("Erreur de recherche");
        const json = (await reponse.json()) as Donnees;
        setDonnees({
          devoirs: json.devoirs ?? [],
          controles: json.controles ?? [],
          cours: json.cours ?? [],
        });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setDonnees(DONNEES_VIDES);
      } finally {
        setChargement(false);
      }
    }, 300);

    return () => {
      clearTimeout(identifiant);
      controleur.abort();
    };
  }, [q]);

  const requeteVide = q.trim().length < 1;
  const donneesAffichees = requeteVide ? DONNEES_VIDES : donnees;

  const comptes: Record<Onglet, number> = {
    tous:
      donneesAffichees.devoirs.length +
      donneesAffichees.controles.length +
      donneesAffichees.cours.length,
    devoirs: donneesAffichees.devoirs.length,
    controles: donneesAffichees.controles.length,
    cours: donneesAffichees.cours.length,
  };

  const groupes: { cle: Exclude<Onglet, "tous">; titre: string; items: Resultat[] }[] = [
    { cle: "devoirs", titre: "Devoirs", items: donneesAffichees.devoirs },
    { cle: "controles", titre: "Controles", items: donneesAffichees.controles },
    { cle: "cours", titre: "Cours", items: donneesAffichees.cours },
  ];
  const groupesAffiches = onglet === "tous" ? groupes : groupes.filter((g) => g.cle === onglet);

  function fermer() {
    setOuvert(false);
  }

  return (
    <div ref={conteneurRef} className="relative w-full sm:w-64">
      <label className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-600 focus-within:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <IconeLoupe className="shrink-0 text-zinc-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOuvert(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOuvert(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Rechercher"
          className="w-full bg-transparent outline-none placeholder:text-zinc-400"
        />
      </label>

      {ouvert && (
        <div
          id={listeId}
          className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
        >
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            {ONGLETS.map(({ cle, titre, Icone }) => (
              <button
                key={cle}
                type="button"
                onClick={() => setOnglet(cle)}
                className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-xs transition-colors ${
                  onglet === cle
                    ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <Icone className="text-sm" />
                <span>{titre}</span>
                <span className="text-[0.65rem] text-zinc-400">{comptes[cle]}</span>
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {requeteVide ? (
              <p className="px-2 py-6 text-center text-xs text-zinc-500">
                Tapez le nom d&apos;un devoir, d&apos;un controle, d&apos;un cours, d&apos;une matiere
                ou d&apos;un enseignant.
              </p>
            ) : chargement && comptes.tous === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-zinc-500">Recherche…</p>
            ) : comptes[onglet] === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-zinc-500">Aucun resultat.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {groupesAffiches.map(
                  (groupe) =>
                    groupe.items.length > 0 && (
                      <div key={groupe.cle} className="flex flex-col gap-1">
                        {onglet === "tous" && (
                          <p className="px-2 text-[0.7rem] font-semibold uppercase tracking-wide text-zinc-400">
                            {groupe.titre}
                          </p>
                        )}
                        {groupe.items.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={fermer}
                            className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <span className="min-w-0 truncate text-zinc-800 dark:text-zinc-200">
                              <span className="text-zinc-500">{item.matiere}</span>
                              {" — "}
                              {item.titre}
                            </span>
                            {item.date && (
                              <span className="shrink-0 text-xs text-zinc-500">
                                {new Date(item.date).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    ),
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
