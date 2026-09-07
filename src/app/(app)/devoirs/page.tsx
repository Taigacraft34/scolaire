import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LIBELLES_STATUT_DEVOIR } from "@/lib/libelles";
import { nettoyerHtml } from "@/lib/html";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { SelecteurMatiere } from "@/components/SelecteurMatiere";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { BoutonSoumission } from "@/components/BoutonSoumission";
import { basculerStatutDevoir, creerDevoirManuel, supprimerDevoir } from "./actions";

export default async function PageDevoirs({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { erreur } = await searchParams;

  const [utilisateur, devoirs, derniereSynchro, matieres] = await Promise.all([
    prisma.utilisateur.findUnique({ where: { id: utilisateurId }, select: { modeDeveloppeur: true } }),
    prisma.devoir.findMany({
      where: { utilisateurId },
      include: { matiere: true },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.synchronisation.findFirst({ where: { utilisateurId }, orderBy: { demarreeLe: "desc" } }),
    prisma.matiere.findMany({ where: { utilisateurId }, orderBy: { nom: "asc" } }),
  ]);

  const modeDeveloppeur = utilisateur?.modeDeveloppeur ?? false;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Devoirs</h1>

      {modeDeveloppeur && <FormulaireSynchronisation derniereSynchro={derniereSynchro} />}

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ajouter un devoir</h2>
        {erreur && <p className="mb-3 text-sm text-red-500">{erreur}</p>}
        <form action={creerDevoirManuel} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <SelecteurMatiere matieres={matieres.map((m) => m.nom)} />
            <div className="flex flex-1 min-w-40 flex-col gap-1">
              <label className="text-xs text-zinc-500" htmlFor="titre">
                Titre
              </label>
              <input
                id="titre"
                name="titre"
                required
                className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
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
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
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
        {devoirs.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">
            Aucun devoir. Configurez votre token Scolengo dans les{" "}
            <a href="/parametres" className="underline">
              parametres
            </a>{" "}
            puis lancez une synchronisation, ou ajoutez-en un manuellement ci-dessus.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {devoirs.map((devoir) => (
              <li key={devoir.id} className="flex flex-col gap-2 p-3 text-sm">
                <details>
                  <summary className="cursor-pointer list-none marker:hidden">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {devoir.matiere.nom} — {devoir.titre}
                    </p>
                    <p className="text-xs text-zinc-500">{LIBELLES_STATUT_DEVOIR[devoir.statut]}</p>
                  </summary>
                  {devoir.description ? (
                    <div
                      className="mt-2 whitespace-pre-wrap text-xs text-zinc-600 dark:text-zinc-400"
                      dangerouslySetInnerHTML={{ __html: nettoyerHtml(devoir.description) }}
                    />
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">Aucune description.</p>
                  )}
                </details>
                <div className="flex items-center justify-between">
                  <span className="whitespace-nowrap text-xs text-zinc-500">
                    {devoir.date.toLocaleDateString("fr-FR")}
                  </span>
                  <div className="flex items-center gap-3">
                    <form action={basculerStatutDevoir}>
                      <input type="hidden" name="devoirId" value={devoir.id} />
                      <BoutonSoumission
                        texteChargement="…"
                        className={
                          devoir.statut === "TERMINE"
                            ? "rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            : "rounded-full bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                        }
                      >
                        {devoir.statut === "TERMINE" ? "Marquer non fait" : "Marquer termine"}
                      </BoutonSoumission>
                    </form>
                    <form action={supprimerDevoir}>
                      <input type="hidden" name="devoirId" value={devoir.id} />
                      <BoutonSupprimer confirmation="Supprimer definitivement ce devoir ?" />
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
