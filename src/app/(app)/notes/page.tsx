import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { IconeChevronBas } from "@/components/Icone";
import { boutonEncadre, champ, etiquette, label, titrePage } from "@/lib/ui";
import { ajouterCopie, supprimerCopie } from "./actions";
import { BoutonSoumission } from "@/components/BoutonSoumission";

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
      orderBy: { date: "asc" },
      take: 500,
    }),
    prisma.synchronisation.findFirst({ where: { utilisateurId }, orderBy: { demarreeLe: "desc" } }),
  ]);

  const modeDeveloppeur = utilisateur?.modeDeveloppeur ?? false;

  // Notes regroupées par matière (ordre alphabétique), chronologiques dans chaque groupe.
  const groupes = new Map<string, typeof notes>();
  for (const note of notes) {
    const liste = groupes.get(note.matiere.nom) ?? [];
    liste.push(note);
    groupes.set(note.matiere.nom, liste);
  }
  const groupesTries = [...groupes.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));

  const parMatiere = new Map<string, { total: number; poids: number }>();
  for (const note of notes) {
    const cle = note.matiere.nom;
    const e = parMatiere.get(cle) ?? { total: 0, poids: 0 };
    e.total += (note.noteObtenue / note.noteMaximale) * 20 * note.coefficient;
    e.poids += note.coefficient;
    parMatiere.set(cle, e);
  }
  const moyenne = (nom: string) => {
    const e = parMatiere.get(nom);
    return e && e.poids > 0 ? fmtNote(e.total / e.poids) : "—";
  };

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <h1 className={titrePage}>Notes</h1>

      {modeDeveloppeur && <FormulaireSynchronisation derniereSynchro={derniereSynchro} />}
      {erreur && <p className="font-body text-sm text-bic-red">{erreur}</p>}

      {notes.length === 0 ? (
        <p className="font-body leading-[var(--carreau)] text-ink-soft">Aucune note enregistrée.</p>
      ) : (
        <div className="flex flex-col gap-[var(--carreau)]">
          {groupesTries.map(([matiereNom, notesMatiere]) => (
            <section key={matiereNom} className="flex flex-col">
              <h2 className="mb-1 flex flex-wrap items-baseline gap-x-3 font-display text-lg font-semibold leading-tight text-ink-blue">
                {matiereNom}
                <span className="tabulaire font-mono text-sm font-bold text-ink">
                  {moyenne(matiereNom)}
                  <span className="font-normal text-ink-soft">/20</span>
                </span>
                <span className="tabulaire font-body text-sm font-normal text-ink-soft/70">
                  · {notesMatiere.length} note{notesMatiere.length > 1 ? "s" : ""}
                </span>
              </h2>
              <ul className="flex flex-col gap-[var(--carreau)]">
                {notesMatiere.map((note) => (
                  <li key={note.id} className="relative">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-col marker:hidden">
                        {/* La note : en ligne sur mobile (marge trop étroite pour "18/20"
                            écrit grand), empilée dans la marge sur desktop. */}
                        <span
                          aria-hidden
                          className="tabulaire hidden text-right font-display text-2xl font-semibold leading-none text-bic-red sm:absolute sm:right-full sm:top-0 sm:mr-[calc(var(--carreau)+0.3rem)] sm:block sm:w-[var(--marge)]"
                        >
                          {fmtNote(note.noteObtenue)}
                          <span className="text-sm font-normal text-ink-soft">/{note.noteMaximale}</span>
                        </span>
      
                        <p className="font-display text-lg leading-[var(--carreau)] text-ink">
                          <span className="tabulaire mr-2 font-semibold text-bic-red sm:hidden" aria-hidden>
                            {fmtNote(note.noteObtenue)}
                            <span className="text-xs font-normal text-ink-soft">/{note.noteMaximale}</span>
                          </span>
                          <span className="tabulaire">{note.date.toLocaleDateString("fr-FR")}</span>
                          <span className="sr-only">
                            {" "}
                            : {fmtNote(note.noteObtenue)} sur {note.noteMaximale}
                          </span>
                        </p>
                        <p className="flex flex-wrap items-baseline gap-x-2 font-body text-xs text-ink-soft">
                          <span>coeff. {fmtNote(note.coefficient)}</span>
                          {note.moyenneClasse !== null && <span>classe {fmtNote(note.moyenneClasse)}</span>}
                          {note.copies.length > 0 && (
                            <span className={etiquette}>
                              {note.copies.length} copie{note.copies.length > 1 ? "s" : ""}
                            </span>
                          )}
                          <IconeChevronBas className="ml-auto shrink-0 transition-transform group-open:rotate-180" />
                        </p>
                      </summary>
      
                      <div className="pb-[calc(var(--carreau)*0.5)] pt-2">
                        {note.copies.length > 0 && (
                          <div className="mb-2 flex flex-col gap-1">
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
      
                        <form action={ajouterCopie} className="flex flex-wrap items-end gap-2">
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
                          <BoutonSoumission texteChargement="Envoi…" className={boutonEncadre + " text-xs"}>
                            Ajouter une copie
                          </BoutonSoumission>
                        </form>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
