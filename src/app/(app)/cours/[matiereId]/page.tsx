import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creerChapitre } from "../actions";

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
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cours" className="text-xs text-zinc-500 underline">
          ← Toutes les matières
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{matiere.nom}</h1>
      </div>

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nouveau chapitre</h2>
        {erreur && <p className="mb-3 text-sm text-red-500">{erreur}</p>}
        <form action={creerChapitre} className="flex gap-2">
          <input type="hidden" name="matiereId" value={matiere.id} />
          <input
            name="nom"
            required
            placeholder="Nom du chapitre"
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

      {matiere.chapitres.length === 0 ? (
        <p className="rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          Aucun chapitre pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {matiere.chapitres.map((chapitre) => (
            <Link
              key={chapitre.id}
              href={`/cours/${matiere.id}/${chapitre.id}`}
              className="rounded-lg border border-zinc-300 bg-white p-4 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <p className="font-medium text-zinc-800 dark:text-zinc-200">{chapitre.nom}</p>
              <p className="text-xs text-zinc-500">
                {chapitre._count.blocs} bloc{chapitre._count.blocs > 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
