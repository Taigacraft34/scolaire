import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { ajouterCopie, supprimerCopie } from "./actions";

export default async function PageNotes({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { erreur } = await searchParams;

  const [utilisateur, notes, derniereSynchro] = await Promise.all([
    prisma.utilisateur.findUnique({ where: { id: utilisateurId }, select: { modeDeveloppeur: true } }),
    prisma.note.findMany({
      where: { utilisateurId },
      include: { matiere: true, copies: { include: { documents: true } } },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.synchronisation.findFirst({ where: { utilisateurId }, orderBy: { demarreeLe: "desc" } }),
  ]);

  const modeDeveloppeur = utilisateur?.modeDeveloppeur ?? false;

  const parMatiere = new Map<string, { total: number; poids: number }>();
  for (const note of notes) {
    const cle = note.matiere.nom;
    const entree = parMatiere.get(cle) ?? { total: 0, poids: 0 };
    entree.total += (note.noteObtenue / note.noteMaximale) * 20 * note.coefficient;
    entree.poids += note.coefficient;
    parMatiere.set(cle, entree);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Notes</h1>

      {modeDeveloppeur && <FormulaireSynchronisation derniereSynchro={derniereSynchro} />}

      {erreur && <p className="text-sm text-red-500">{erreur}</p>}

      {parMatiere.size > 0 && (
        <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Moyennes par matière</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[...parMatiere.entries()].map(([nom, { total, poids }]) => (
              <li key={nom} className="flex justify-between text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">{nom}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {poids > 0 ? (total / poids).toFixed(2) : "-"}/20
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-4">
        {notes.length === 0 ? (
          <p className="rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            Aucune note enregistrée.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{note.matiere.nom}</p>
                  <p className="text-xs text-zinc-500">
                    Coefficient {note.coefficient}
                    {note.moyenneClasse !== null ? ` · moyenne classe ${note.moyenneClasse}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {note.noteObtenue}/{note.noteMaximale}
                  </p>
                  <p className="text-xs text-zinc-500">{note.date.toLocaleDateString("fr-FR")}</p>
                </div>
              </div>

              {note.copies.length > 0 && (
                <div className="flex flex-col gap-3">
                  {note.copies.map((copie) => (
                    <div key={copie.id} className="rounded border border-zinc-300 p-2 dark:border-zinc-800">
                      <div className="mb-2 flex items-center justify-between">
                        {copie.commentaire && (
                          <p className="text-xs text-zinc-500">{copie.commentaire}</p>
                        )}
                        <form action={supprimerCopie} className="ml-auto">
                          <input type="hidden" name="copieId" value={copie.id} />
                          <BoutonSupprimer confirmation="Supprimer définitivement cette copie ?" />
                        </form>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {copie.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={`/api/documents/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 hover:underline dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {doc.nomFichier}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form
                action={ajouterCopie}
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="noteId" value={note.id} />
                <div className="flex flex-1 min-w-40 flex-col gap-1">
                  <label className="text-xs text-zinc-500" htmlFor={`commentaire-${note.id}`}>
                    Commentaire (optionnel)
                  </label>
                  <input
                    id={`commentaire-${note.id}`}
                    name="commentaire"
                    className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <input
                  type="file"
                  name="fichiers"
                  multiple
                  className="text-sm text-zinc-700 dark:text-zinc-300"
                />
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Ajouter une copie
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
