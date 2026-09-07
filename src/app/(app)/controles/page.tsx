import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { libelleStatutControle } from "@/lib/libelles";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { SelecteurMatiereDevoir } from "@/components/SelecteurMatiereDevoir";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { MiseEnAvantRecherche } from "@/components/MiseEnAvantRecherche";
import Link from "next/link";
import {
  creerControleManuel,
  delierChapitreDuControle,
  lierChapitreAuControle,
  lierDevoirAuControle,
  supprimerControle,
} from "./actions";

export default async function PageControles({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; focus?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { erreur, focus } = await searchParams;

  const [utilisateur, controles, derniereSynchro, matieres, devoirsDisponibles, chapitresDisponibles] =
    await Promise.all([
      prisma.utilisateur.findUnique({ where: { id: utilisateurId }, select: { modeDeveloppeur: true } }),
      prisma.controle.findMany({
        where: { utilisateurId },
        include: {
          matiere: true,
          note: true,
          devoirSource: { include: { matiere: true } },
          chapitres: { include: { chapitre: { include: { matiere: true } } } },
        },
        orderBy: { date: "desc" },
        take: 100,
      }),
      prisma.synchronisation.findFirst({ where: { utilisateurId }, orderBy: { demarreeLe: "desc" } }),
      prisma.matiere.findMany({ where: { utilisateurId }, orderBy: { nom: "asc" } }),
      prisma.devoir.findMany({
        where: { utilisateurId, controleGenere: null },
        include: { matiere: true },
        orderBy: { date: "desc" },
        take: 200,
      }),
      prisma.chapitre.findMany({
        where: { utilisateurId },
        include: { matiere: true },
        orderBy: { nom: "asc" },
        take: 300,
      }),
    ]);

  const modeDeveloppeur = utilisateur?.modeDeveloppeur ?? false;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Controles</h1>

      <MiseEnAvantRecherche focusId={focus} />

      {modeDeveloppeur && <FormulaireSynchronisation derniereSynchro={derniereSynchro} />}

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ajouter un controle</h2>
        {erreur && <p className="mb-3 text-sm text-red-500">{erreur}</p>}
        <form action={creerControleManuel} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <SelecteurMatiereDevoir
              matieres={matieres.map((m) => m.nom)}
              devoirs={devoirsDisponibles.map((devoir) => ({
                id: devoir.id,
                matiereNom: devoir.matiere.nom,
                libelle: `${devoir.titre} (${devoir.date.toLocaleDateString("fr-FR")})`,
              }))}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500" htmlFor="date">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500" htmlFor="heure">
                Heure
              </label>
              <input
                type="time"
                id="heure"
                name="heure"
                className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="flex flex-1 min-w-40 flex-col gap-1">
              <label className="text-xs text-zinc-500" htmlFor="chapitre">
                Chapitre
              </label>
              <input
                id="chapitre"
                name="chapitre"
                className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500" htmlFor="commentaire">
              Commentaire
            </label>
            <textarea
              id="commentaire"
              name="commentaire"
              rows={2}
              className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Ajouter
          </button>
        </form>
      </section>

      <div className="rounded-lg border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {controles.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            Aucun controle. Les controles sont detectes automatiquement lors de la synchronisation des
            devoirs, ou peuvent etre ajoutes manuellement ci-dessus.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {controles.map((controle) => (
              <li
                key={controle.id}
                id={`element-${controle.id}`}
                className="flex flex-col gap-2 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">
                        {controle.matiere.nom} {controle.chapitreLibre ? `— ${controle.chapitreLibre}` : ""}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {libelleStatutControle(controle.date)}
                        {controle.note ? ` · note : ${controle.note.noteObtenue}/${controle.note.noteMaximale}` : ""}
                      </p>
                    </div>
                    {controle.type === "AUTOMATIQUE" && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Ajouté automatiquement
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap text-zinc-500">
                      {controle.date.toLocaleDateString("fr-FR")}
                    </span>
                    <form action={supprimerControle}>
                      <input type="hidden" name="controleId" value={controle.id} />
                      <BoutonSupprimer confirmation="Supprimer definitivement ce controle ?" />
                    </form>
                  </div>
                </div>

                {controle.devoirSource ? (
                  <p className="text-xs text-zinc-500">
                    Devoir associé : {controle.devoirSource.matiere.nom} — {controle.devoirSource.titre} (
                    {controle.devoirSource.date.toLocaleDateString("fr-FR")})
                  </p>
                ) : (
                  (() => {
                    const devoirsMemeMatiere = devoirsDisponibles.filter(
                      (devoir) => devoir.matiereId === controle.matiereId,
                    );
                    if (devoirsMemeMatiere.length === 0) return null;
                    return (
                      <form action={lierDevoirAuControle} className="flex items-center gap-2">
                        <input type="hidden" name="controleId" value={controle.id} />
                        <select
                          name="devoirId"
                          required
                          defaultValue=""
                          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          <option value="" disabled>
                            Lier a un devoir de {controle.matiere.nom}…
                          </option>
                          {devoirsMemeMatiere.map((devoir) => (
                            <option key={devoir.id} value={devoir.id}>
                              {devoir.titre} ({devoir.date.toLocaleDateString("fr-FR")})
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        >
                          Lier
                        </button>
                      </form>
                    );
                  })()
                )}

                {controle.chapitres.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {controle.chapitres.map((liaison) => (
                      <li
                        key={liaison.chapitreId}
                        className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <Link
                          href={`/cours/${liaison.chapitre.matiereId}/${liaison.chapitreId}`}
                          className="hover:underline"
                        >
                          {liaison.chapitre.matiere.nom} — {liaison.chapitre.nom}
                        </Link>
                        <form action={delierChapitreDuControle}>
                          <input type="hidden" name="controleId" value={controle.id} />
                          <input type="hidden" name="chapitreId" value={liaison.chapitreId} />
                          <button type="submit" className="text-red-500 hover:underline" aria-label="Delier">
                            ×
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                {(() => {
                  const idsDejaLies = new Set(controle.chapitres.map((l) => l.chapitreId));
                  const chapitresNonLies = chapitresDisponibles.filter((c) => !idsDejaLies.has(c.id));
                  if (chapitresNonLies.length === 0) return null;
                  return (
                    <form action={lierChapitreAuControle} className="flex items-center gap-2">
                      <input type="hidden" name="controleId" value={controle.id} />
                      <select
                        name="chapitreId"
                        required
                        defaultValue=""
                        className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        <option value="" disabled>
                          Lier a un chapitre…
                        </option>
                        {chapitresNonLies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.matiere.nom} — {c.nom}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        Lier
                      </button>
                    </form>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
