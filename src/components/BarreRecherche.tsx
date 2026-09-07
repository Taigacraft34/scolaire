"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { IconeLoupe } from "@/components/Icone";

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

const ONGLETS: { cle: Onglet; titre: string }[] = [
  { cle: "tous", titre: "Tous" },
  { cle: "devoirs", titre: "Devoirs" },
  { cle: "controles", titre: "Contrôles" },
  { cle: "cours", titre: "Cours" },
];

export function BarreRecherche() {
  const [q, setQ] = useState("");
  const [donnees, setDonnees] = useState<Donnees>(DONNEES_VIDES);
  const [ouvert, setOuvert] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("tous");
  const [chargement, setChargement] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const listeId = useId();

  useEffect(() => {
    function surClic(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, []);

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
    { cle: "controles", titre: "Contrôles", items: donneesAffichees.controles },
    { cle: "cours", titre: "Cours", items: donneesAffichees.cours },
  ];
  const groupesAffiches = onglet === "tous" ? groupes : groupes.filter((g) => g.cle === onglet);

  function fermer() {
    setOuvert(false);
  }

  return (
    <div ref={conteneurRef} className="relative w-full sm:w-56">
      <label className="flex items-center gap-2 border-b border-ink-soft/50 py-1 font-body text-sm text-ink transition-colors focus-within:border-ink-blue">
        <IconeLoupe className="shrink-0 text-ink-soft" />
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
          placeholder="Chercher dans le cahier"
          className="w-full bg-transparent outline-none placeholder:text-ink-soft/70"
        />
      </label>

      {ouvert && (
        <div
          id={listeId}
          className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-sm border border-ink-blue bg-paper"
          style={{ boxShadow: "0.25rem 0.5rem 1.4rem rgb(20 20 40 / 0.16)" }}
        >
          <div className="flex gap-1 border-b border-ink-soft/25 px-2 pt-1.5">
            {ONGLETS.map(({ cle, titre }) => (
              <button
                key={cle}
                type="button"
                onClick={() => setOnglet(cle)}
                className={
                  "border-b-2 px-2 pb-1.5 font-body text-[0.72rem] font-bold uppercase tracking-wide transition-colors " +
                  (onglet === cle
                    ? "border-ink-blue text-ink-blue"
                    : "border-transparent text-ink-soft hover:text-ink")
                }
              >
                {titre}
                <span className="tabulaire ml-1 text-ink-soft/70">{comptes[cle]}</span>
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto px-3 py-2">
            {requeteVide ? (
              <p className="py-5 text-center font-body text-xs text-ink-soft">
                Le nom d&apos;un devoir, d&apos;un contrôle, d&apos;un cours, d&apos;une matière ou d&apos;un
                enseignant.
              </p>
            ) : chargement && comptes.tous === 0 ? (
              <p className="py-5 text-center font-body text-xs text-ink-soft">Recherche…</p>
            ) : comptes[onglet] === 0 ? (
              <p className="py-5 text-center font-body text-xs text-ink-soft">Aucun résultat.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {groupesAffiches.map(
                  (groupe) =>
                    groupe.items.length > 0 && (
                      <div key={groupe.cle} className="flex flex-col">
                        {onglet === "tous" && (
                          <p className="font-body text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-soft/80">
                            {groupe.titre}
                          </p>
                        )}
                        {groupe.items.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={fermer}
                            className="flex items-baseline justify-between gap-2 border-b border-ruling/60 py-1 font-body text-sm hover:bg-ink-blue/5"
                          >
                            <span className="min-w-0 truncate text-ink">
                              <span className="mr-1.5 text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue">
                                {item.matiere}
                              </span>
                              {item.titre}
                            </span>
                            {item.date && (
                              <span className="tabulaire shrink-0 font-mono text-xs text-ink-soft">
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
