import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IconeChevronDroite, IconeFlecheGauche } from "@/components/Icone";
import { boutonPrincipal, champ, encart, titrePage, titreSection } from "@/lib/ui";
import { creerChapitre } from "../actions";
import { BoutonSoumission } from "@/components/BoutonSoumission";

export default async function PageChapitresMatiere({
  params,
  searchParams,
}: {
  params: Promise<{ matiereId: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { matiereId } = await params;
  const { erreur } = await searchParams;

  const matiere = await prisma.matiere.findFirst({
    where: { id: matiereId, utilisateurId },
    include: {
      chapitres: { include: { _count: { select: { blocs: true } } }, orderBy: { nom: "asc" } },
    },
  });
  if (!matiere) notFound();

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <div>
        <Link
          href="/cours"
          className="inline-flex items-center gap-1 font-body text-xs font-bold text-ink-soft hover:text-ink-blue"
        >
          <IconeFlecheGauche /> Toutes les matières
        </Link>
        <h1 className={titrePage}>{matiere.nom}</h1>
      </div>

      <section className={encart}>
        <h2 className={titreSection + " mb-2"}>Nouveau chapitre</h2>
        {erreur && <p className="mb-2 font-body text-sm text-bic-red">{erreur}</p>}
        <form action={creerChapitre} className="flex flex-wrap gap-2">
          <input type="hidden" name="matiereId" value={matiere.id} />
          <input name="nom" required placeholder="Nom du chapitre" className={champ + " flex-1 min-w-40"} />
          <BoutonSoumission texteChargement="Ajout…" className={boutonPrincipal}>
            Ajouter
          </BoutonSoumission>
        </form>
      </section>

      {matiere.chapitres.length === 0 ? (
        <p className="font-body leading-[var(--carreau)] text-ink-soft">Aucun chapitre pour le moment.</p>
      ) : (
        <ul className="flex flex-col">
          {matiere.chapitres.map((chapitre) => (
            <li key={chapitre.id}>
              <Link
                href={`/cours/${matiere.id}/${chapitre.id}`}
                className="flex min-h-[var(--carreau)] items-baseline gap-2 leading-[var(--carreau)] hover:bg-ink-blue/5"
              >
                <span className="flex-1 text-ink">{chapitre.nom}</span>
                <span className="tabulaire font-mono text-xs text-ink-soft">
                  {chapitre._count.blocs} bloc{chapitre._count.blocs > 1 ? "s" : ""}
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
