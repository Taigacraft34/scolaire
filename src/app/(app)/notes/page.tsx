import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { boutonEncadre, champ, etiquette, label, titrePage, titreSection } from "@/lib/ui";
import { ajouterCopie, supprimerCopie } from "./actions";

function fmtNote(n: number): string {
  return String(Number.isInteger(n) ? n : n.toFixed(2)).replace(".", ",");
}

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
    const e = parMatiere.get(cle) ?? { total: 0, poids: 0 };
    e.total += (note.noteObtenue / note.noteMaximale) * 20 * note.coefficient;
    e.poids += note.coefficient;
    parMatiere.set(cle, e);
  }

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <h1 className={titrePage}>Notes</h1>

      {modeDeveloppeur && <FormulaireSynchronisation derniereSynchro={derniereSynchro} />}
      {erreur && <p className="font-body text-sm text-bic-red">{erreur}</p>}

      {parMatiere.size > 0 && (
        <section className="flex flex-col">
          <h2 className={titreSection + " mb-1"}>Moyennes par matière</h2>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {[...parMatiere.entries()].map(([nom, { total, poids }]) => (
              <li
                key={nom}
                className="flex items-baseline justify-between gap-3 border-b border-ruling/60 leading-[var(--carreau)]"
              >
                <span className="truncate text-ink">{nom}</span>
                <span className="tabulaire shrink-0 font-mono text-sm font-bold text-ink">
                  {poids > 0 ? fmtNote(total / poids) : "—"}
                  <span className="font-normal text-ink-soft">/20</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {notes.length === 0 ? (
        <p className="font-body leading-[var(--carreau)] text-ink-soft">Aucune note enregistrée.</p>
      ) : (
        <ul className="flex flex-col gap-[var(--carreau)]">
          {notes.map((note) => (
            <li key={note.id} className="relative flex flex-col">
              <span
                className="tabulaire absolute right-full top-0 mr-2 text-right font-display text-lg font-semibold leading-none text-bic-red sm:mr-3 sm:text-2xl"
                aria-hidden
              >
                {fmtNote(note.noteObtenue)}
                <span className="text-xs font-normal text-ink-soft sm:text-sm">/{note.noteMaximale}</span>
              </span>

              <p className="font-display text-lg leading-[var(--carreau)] text-ink">
                <span className="text-ink-blue">{note.matiere.nom}</span>
                <span className="sr-only">
                  {" "}
                  : {fmtNote(note.noteObtenue)} sur {note.noteMaximale}
                </span>
              </p>
              <p className="flex flex-wrap gap-x-2 font-body text-xs text-ink-soft">
                <span className="tabulaire font-mono">{note.date.toLocaleDateString("fr-FR")}</span>
                <span>coeff. {fmtNote(note.coefficient)}</span>
                {note.moyenneClasse !== null && <span>classe {fmtNote(note.moyenneClasse)}</span>}
              </p>

              {note.copies.length > 0 && (
                <div className="mt-1 flex flex-col gap-1 pl-2">
                  {note.copies.map((copie) => (
                    <div key={copie.id} className="border-l border-ruling pl-2">
                      <div className="flex items-baseline justify-between gap-2">
                        {copie.commentaire ? (
                          <p className="font-body text-xs text-ink-soft">{copie.commentaire}</p>
                        ) : (
                          <span />
                        )}
                        <form action={supprimerCopie}>
                          <input type="hidden" name="copieId" value={copie.id} />
                          <BoutonSupprimer libelle="Supprimer la copie" />
                        </form>
                      </div>
                      {copie.documents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {copie.documents.map((doc) => (
                            <a
                              key={doc.id}
                              href={`/api/documents/${doc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={etiquette + " hover:underline"}
                            >
                              {doc.nomFichier}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <form action={ajouterCopie} className="mt-1 flex flex-wrap items-end gap-2 pl-2">
                <input type="hidden" name="noteId" value={note.id} />
                <div className="flex flex-1 min-w-40 flex-col gap-1">
                  <label className={label} htmlFor={`commentaire-${note.id}`}>
                    Commentaire (optionnel)
                  </label>
                  <input id={`commentaire-${note.id}`} name="commentaire" className={champ} />
                </div>
                <input
                  type="file"
                  name="fichiers"
                  multiple
                  className="font-body text-xs text-ink-soft file:mr-2 file:rounded-sm file:border file:border-ink-soft/50 file:bg-transparent file:px-2 file:py-1 file:font-body file:text-xs file:font-bold file:text-ink"
                />
                <button type="submit" className={boutonEncadre + " text-xs"}>
                  Ajouter une copie
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
