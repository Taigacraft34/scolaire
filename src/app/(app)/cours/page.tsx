import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Cours — Matières</h1>
        <Link
          href="/cours/imprimer"
          target="_blank"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Version imprimable (PDF)
        </Link>
      </div>

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nouvelle matière</h2>
        {erreur && <p className="mb-3 text-sm text-red-500">{erreur}</p>}
        <form action={creerMatiere} className="flex gap-2">
          <input
            name="nom"
            required
            placeholder="Nom de la matière"
            className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Ajouter
          </button>
        </form>
      </section>

      {matieres.length === 0 ? (
        <p className="rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          Aucune matière pour le moment. Ajoutez-en une ci-dessus.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {matieres.map((matiere) => (
            <Link
              key={matiere.id}
              href={`/cours/${matiere.id}`}
              className="rounded-lg border border-zinc-300 bg-white p-4 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <p className="font-medium text-zinc-800 dark:text-zinc-200">{matiere.nom}</p>
              <p className="text-xs text-zinc-500">
                {matiere._count.chapitres} chapitre{matiere._count.chapitres > 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
