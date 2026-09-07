import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ajouterJours, debutSemaine } from "@/lib/calendrier";
import { JOURS_ORDRE, LIBELLES_JOUR, LIBELLES_TYPE_SEMAINE, creneauVisiblePourSemaine } from "@/lib/emploiDuTemps";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { SelecteurFrequenceCreneau } from "@/components/SelecteurFrequenceCreneau";
import {
  creerCreneau,
  creerEmploiDuTempsPersonne,
  creerMonEmploiDuTemps,
  supprimerCreneau,
  supprimerEmploiDuTemps,
} from "./actions";

function formatDateParam(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

export default async function PageEmploiDuTemps({
  searchParams,
}: {
  searchParams: Promise<{ edt?: string; semaine?: string; erreur?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const role = session!.user.role;
  const { edt: edtIdParam, semaine: semaineParam, erreur } = await searchParams;

  const tousLesEdt = await prisma.emploiDuTemps.findMany({
    include: { utilisateur: { select: { id: true, nom: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const edtSelectionne =
    tousLesEdt.find((e) => e.id === edtIdParam) ??
    tousLesEdt.find((e) => e.utilisateurId === utilisateurId) ??
    tousLesEdt[0] ??
    null;

  const creneaux = edtSelectionne
    ? await prisma.creneauEdt.findMany({
        where: { emploiDuTempsId: edtSelectionne.id },
        orderBy: [{ jour: "asc" }, { heureDebut: "asc" }],
      })
    : [];

  // Suggestions pour le champ "Matiere" : reprendre exactement les noms des
  // matieres existantes facilite le rapprochement automatique de date sur les
  // pages Devoirs et Controles.
  const nomsMatieres = (
    await prisma.matiere.findMany({
      where: { utilisateurId },
      orderBy: { nom: "asc" },
      select: { nom: true },
    })
  ).map((m) => m.nom);

  const peutGerer =
    !!edtSelectionne &&
    (role === "ADMIN" ||
      edtSelectionne.utilisateurId === utilisateurId ||
      edtSelectionne.gerePar === utilisateurId);

  const possedePropre = tousLesEdt.some((e) => e.utilisateurId === utilisateurId);

  const semaineBase = semaineParam ? new Date(semaineParam) : new Date();
  const lundiAffiche = debutSemaine(Number.isNaN(semaineBase.getTime()) ? new Date() : semaineBase);
  const dimancheAffiche = ajouterJours(lundiAffiche, 6);

  function lienSemaine(delta: number) {
    const params = new URLSearchParams();
    if (edtSelectionne) params.set("edt", edtSelectionne.id);
    params.set("semaine", formatDateParam(ajouterJours(lundiAffiche, delta * 7)));
    return `/emploi-du-temps?${params.toString()}`;
  }

  function lienEdt(id: string) {
    const params = new URLSearchParams();
    params.set("edt", id);
    params.set("semaine", formatDateParam(lundiAffiche));
    return `/emploi-du-temps?${params.toString()}`;
  }

  function libelleEdt(e: (typeof tousLesEdt)[number]): string {
    if (e.utilisateurId === utilisateurId) return "Moi";
    if (e.utilisateurId) return e.utilisateur?.nom ?? e.utilisateur?.email ?? "Compte";
    return e.nomPersonne ?? "Personne";
  }

  const joursAffiches = JOURS_ORDRE.map((jour, index) => {
    const date = ajouterJours(lundiAffiche, index);
    const creneauxJour = creneaux
      .filter((c) => c.jour === jour && creneauVisiblePourSemaine(c.typeSemaine, c.rangS1Q, date))
      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    return { jour, date, creneaux: creneauxJour };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Emploi du temps</h1>
      {erreur && <p className="text-sm text-red-500">{erreur}</p>}

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Emplois du temps</h2>
        {tousLesEdt.length === 0 ? (
          <p className="mb-3 text-sm text-zinc-500">Aucun emploi du temps enregistre pour le moment.</p>
        ) : (
          <ul className="mb-3 flex flex-wrap gap-2">
            {tousLesEdt.map((e) => {
              const peutSupprimer =
                role === "ADMIN" || e.utilisateurId === utilisateurId || e.gerePar === utilisateurId;
              return (
                <li
                  key={e.id}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                    edtSelectionne?.id === e.id
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300"
                      : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <Link href={lienEdt(e.id)}>{libelleEdt(e)}</Link>
                  {peutSupprimer && (
                    <form action={supprimerEmploiDuTemps}>
                      <input type="hidden" name="emploiDuTempsId" value={e.id} />
                      <BoutonSupprimer libelle="×" confirmation={`Supprimer l'emploi du temps de ${libelleEdt(e)} et tous ses creneaux ?`} />
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-3">
          {!possedePropre && (
            <form action={creerMonEmploiDuTemps}>
              <button
                type="submit"
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Creer mon emploi du temps
              </button>
            </form>
          )}
          <form action={creerEmploiDuTempsPersonne} className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500" htmlFor="nom">
                Personne sans compte
              </label>
              <input
                id="nom"
                name="nom"
                required
                placeholder="Nom"
                className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              className="rounded-full border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Ajouter
            </button>
          </form>
        </div>
      </section>

      {edtSelectionne && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {libelleEdt(edtSelectionne)} — Semaine du {lundiAffiche.toLocaleDateString("fr-FR")} au{" "}
              {dimancheAffiche.toLocaleDateString("fr-FR")}
            </h2>
            <div className="flex gap-2">
              <Link
                href={lienSemaine(-1)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
              >
                ← Semaine precedente
              </Link>
              <Link
                href={lienSemaine(1)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
              >
                Semaine suivante →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-300 bg-zinc-200 sm:grid-cols-7 dark:border-zinc-800 dark:bg-zinc-800">
            {joursAffiches.map(({ jour, date, creneaux: creneauxJour }) => (
              <div key={jour} className="min-h-32 bg-white p-2 dark:bg-zinc-950">
                <p className="mb-1 text-xs font-medium text-zinc-500">
                  {LIBELLES_JOUR[jour]} {date.getDate()}/{date.getMonth() + 1}
                </p>
                <div className="flex flex-col gap-1">
                  {creneauxJour.length === 0 ? (
                    <p className="text-xs text-zinc-400">—</p>
                  ) : (
                    creneauxJour.map((c) => (
                      <div
                        key={c.id}
                        className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <p className="font-medium">
                          {c.heureDebut}–{c.heureFin} {c.matiere}
                        </p>
                        {(c.enseignant || c.salle) && (
                          <p className="text-zinc-500">
                            {[c.enseignant, c.salle].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {peutGerer && (
            <>
              <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Ajouter un creneau a l&apos;emploi du temps de {libelleEdt(edtSelectionne)}
                </h2>
                <form action={creerCreneau} className="flex flex-col gap-3">
                  <input type="hidden" name="emploiDuTempsId" value={edtSelectionne.id} />
                  <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500" htmlFor="jour">
                        Jour
                      </label>
                      <select
                        id="jour"
                        name="jour"
                        defaultValue="LUNDI"
                        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        {JOURS_ORDRE.map((jour) => (
                          <option key={jour} value={jour}>
                            {LIBELLES_JOUR[jour]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500" htmlFor="heureDebut">
                        Debut
                      </label>
                      <input
                        type="time"
                        id="heureDebut"
                        name="heureDebut"
                        required
                        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500" htmlFor="heureFin">
                        Fin
                      </label>
                      <input
                        type="time"
                        id="heureFin"
                        name="heureFin"
                        required
                        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                    <SelecteurFrequenceCreneau />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex flex-1 min-w-40 flex-col gap-1">
                      <label className="text-xs text-zinc-500" htmlFor="matiere">
                        Matiere
                      </label>
                      <input
                        id="matiere"
                        name="matiere"
                        required
                        list="liste-matieres"
                        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <datalist id="liste-matieres">
                        {nomsMatieres.map((nom) => (
                          <option key={nom} value={nom} />
                        ))}
                      </datalist>
                    </div>
                    <div className="flex flex-1 min-w-40 flex-col gap-1">
                      <label className="text-xs text-zinc-500" htmlFor="enseignant">
                        Enseignant
                      </label>
                      <input
                        id="enseignant"
                        name="enseignant"
                        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-zinc-500" htmlFor="salle">
                        Salle
                      </label>
                      <input
                        id="salle"
                        name="salle"
                        className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
                  >
                    Ajouter
                  </button>
                </form>
              </section>

              <section className="rounded-lg border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="border-b border-zinc-100 p-4 pb-3 text-sm font-semibold text-zinc-700 dark:border-zinc-900 dark:text-zinc-300">
                  Tous les creneaux
                </h2>
                {creneaux.length === 0 ? (
                  <p className="p-4 text-sm text-zinc-500">Aucun creneau enregistre.</p>
                ) : (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {creneaux.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {LIBELLES_JOUR[c.jour]} {c.heureDebut}–{c.heureFin} — {c.matiere}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {[c.enseignant, c.salle].filter(Boolean).join(" · ")}
                            {(c.enseignant || c.salle) ? " · " : ""}
                            {LIBELLES_TYPE_SEMAINE[c.typeSemaine]}
                            {c.typeSemaine === "S1Q" && c.rangS1Q ? ` (${c.rangS1Q}/4)` : ""}
                          </p>
                        </div>
                        <form action={supprimerCreneau}>
                          <input type="hidden" name="creneauId" value={c.id} />
                          <BoutonSupprimer confirmation="Supprimer definitivement ce creneau ?" />
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
