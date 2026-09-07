import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IconeChevronDroite, IconeImprimante } from "@/components/Icone";
import { boutonPrincipal, boutonSecondaire, champ, encart, titrePage, titreSection } from "@/lib/ui";
import { creerMatiere } from "./actions";

export default async function PageCoursMatieres({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { erreur } = await searchParams;

  const matieres = await prisma.matiere.findMany({
    where: { utilisateurId },
    include: { _count: { select: { chapitres: true } } },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className={titrePage}>Cours</h1>
        <Link href="/cours/imprimer" target="_blank" className={boutonSecondaire}>
          <IconeImprimante /> Version imprimable
        </Link>
      </div>

      <section className={encart}>
        <h2 className={titreSection + " mb-2"}>Nouvelle matière</h2>
        {erreur && <p className="mb-2 font-body text-sm text-bic-red">{erreur}</p>}
        <form action={creerMatiere} className="flex flex-wrap gap-2">
          <input name="nom" required placeholder="Nom de la matière" className={champ + " flex-1 min-w-40"} />
          <button type="submit" className={boutonPrincipal}>
            Ajouter
          </button>
        </form>
      </section>

      {matieres.length === 0 ? (
        <p className="font-body leading-[var(--carreau)] text-ink-soft">
          Aucune matière pour le moment. Ajoutes-en une ci-dessus.
        </p>
      ) : (
        <ul className="flex flex-col">
          {matieres.map((matiere) => (
            <li key={matiere.id}>
              <Link
                href={`/cours/${matiere.id}`}
                className="flex min-h-[var(--carreau)] items-baseline gap-2 leading-[var(--carreau)] hover:bg-ink-blue/5"
              >
                <span className="flex-1 font-display text-lg text-ink">{matiere.nom}</span>
                <span className="tabulaire font-mono text-xs text-ink-soft">
                  {matiere._count.chapitres} chap.
                </span>
                <IconeChevronDroite className="text-ink-soft" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
