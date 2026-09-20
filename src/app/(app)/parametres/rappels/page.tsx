import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { FormulaireRappel } from "@/components/FormulaireRappel";
import { IconeChevronBas } from "@/components/Icone";
import { libelleJours } from "@/lib/rappels";
import { encart, titrePage, titreSection } from "@/lib/ui";
import { creerRappel, modifierRappel, supprimerRappel } from "./actions";

const LIBELLES_CANAUX: Record<string, string> = {
  EMAIL: "email",
  MOBILE: "mobile",
};

export default async function PageRappels({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; succes?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { erreur, succes } = await searchParams;

  const [utilisateur, rappels, matieres] = await Promise.all([
    prisma.utilisateur.findUniqueOrThrow({
      where: { id: utilisateurId },
      select: { canauxDevoirParDefaut: true },
    }),
    prisma.rappel.findMany({
      where: { utilisateurId },
      include: { matiere: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.matiere.findMany({ where: { utilisateurId }, orderBy: { nom: "asc" } }),
  ]);

  const canaux = utilisateur.canauxDevoirParDefaut.filter((c) => c in LIBELLES_CANAUX);
  const matieresOptions = matieres.map((m) => ({ id: m.id, nom: m.nom }));

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={titrePage}>Rappels</h1>
        <Link
          href="/parametres"
          className="font-body text-sm font-bold text-ink-blue underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          ← Paramètres
        </Link>
      </div>

      <p className="-mt-3 font-body text-sm text-ink-soft">
        Un rappel est envoyé chaque jour choisi, à l&apos;heure indiquée, sur les canaux des rappels de devoirs
        {canaux.length > 0 ? (
          <>
            {" "}
            (actuellement : <strong>{canaux.map((c) => LIBELLES_CANAUX[c]).join(" et ")}</strong>)
          </>
        ) : (
          <>
            {" "}
            — <span className="font-bold text-bic-red">aucun canal n&apos;est activé pour le moment</span>
          </>
        )}
        . Il apparaît aussi dans la liste des devoirs la veille et le jour même. Les canaux se règlent dans les{" "}
        <Link href="/parametres" className="text-ink-blue underline underline-offset-2">
          paramètres
        </Link>
        .
      </p>

      {erreur && <p className="font-body text-sm text-bic-red">{erreur}</p>}
      {succes && <p className="font-body text-sm text-bic-green">Rappel enregistré.</p>}

      <section className={encart}>
        <h2 className={titreSection + " mb-3 block"}>Nouveau rappel</h2>
        <FormulaireRappel
          action={creerRappel}
          matieres={matieresOptions}
          idPrefixe="nouveau"
          texteBouton="Ajouter"
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={titreSection}>
          Mes rappels <span className="tabulaire text-ink-soft/70">· {rappels.length}</span>
        </h2>

        {rappels.length === 0 ? (
          <p className="font-body leading-[var(--carreau)] text-ink-soft">Aucun rappel pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rappels.map((rappel) => (
              <li key={rappel.id} className={encart}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 marker:hidden">
                    <span
                      className={
                        "font-body text-sm font-bold " + (rappel.actif ? "text-ink" : "text-ink-soft line-through")
                      }
                    >
                      {rappel.titre}
                    </span>
                    {rappel.matiere && (
                      <span className="font-body text-[0.72rem] font-bold uppercase tracking-wide text-ink-blue">
                        {rappel.matiere.nom}
                      </span>
                    )}
                    <span className="tabulaire font-mono text-xs text-ink-soft">
                      {libelleJours(rappel.jours)} · {rappel.heure}
                    </span>
                    {!rappel.actif && (
                      <span className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">
                        En pause
                      </span>
                    )}
                    <IconeChevronBas className="ml-auto shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 flex flex-col gap-3 border-t border-ink-soft/25 pt-3">
                    <FormulaireRappel
                      action={modifierRappel}
                      matieres={matieresOptions}
                      rappel={rappel}
                      idPrefixe={`rappel-${rappel.id}`}
                      texteBouton="Enregistrer"
                    />
                    <form action={supprimerRappel}>
                      <input type="hidden" name="rappelId" value={rappel.id} />
                      <BoutonSupprimer libelle="Supprimer le rappel" />
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
