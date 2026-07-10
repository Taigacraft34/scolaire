import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function CarteStat({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <div className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{titre}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{valeur}</p>
    </div>
  );
}

export default async function PageTableauDeBord() {
  const session = await auth();
  const utilisateurId = session!.user.id;

  const maintenant = new Date();

  const [prochainsDevoirs, prochainsControles, dernieresNotes, notes] = await Promise.all([
    prisma.devoir.findMany({
      where: { utilisateurId, date: { gte: maintenant }, statut: "A_FAIRE" },
      orderBy: { date: "asc" },
      take: 5,
      include: { matiere: true },
    }),
    prisma.controle.findMany({
      where: { utilisateurId, date: { gte: maintenant } },
      orderBy: { date: "asc" },
      take: 5,
      include: { matiere: true },
    }),
    prisma.note.findMany({
      where: { utilisateurId },
      orderBy: { date: "desc" },
      take: 5,
      include: { matiere: true },
    }),
    prisma.note.findMany({ where: { utilisateurId } }),
  ]);

  const totalPondere = notes.reduce((acc, n) => acc + (n.noteObtenue / n.noteMaximale) * 20 * n.coefficient, 0);
  const totalCoefficients = notes.reduce((acc, n) => acc + n.coefficient, 0);
  const moyenneGenerale = totalCoefficients > 0 ? (totalPondere / totalCoefficients).toFixed(2) : "-";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Tableau de bord</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CarteStat titre="Moyenne generale" valeur={moyenneGenerale} />
        <CarteStat titre="Prochains devoirs" valeur={String(prochainsDevoirs.length)} />
        <CarteStat titre="Prochains controles" valeur={String(prochainsControles.length)} />
        <CarteStat titre="Dernieres notes" valeur={String(dernieresNotes.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Prochains devoirs
          </h2>
          {prochainsDevoirs.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun devoir a venir.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {prochainsDevoirs.map((d) => (
                <li key={d.id} className="flex justify-between text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {d.matiere.nom} - {d.titre}
                  </span>
                  <span className="text-zinc-500">{d.date.toLocaleDateString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Prochains controles
          </h2>
          {prochainsControles.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun controle a venir.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {prochainsControles.map((c) => (
                <li key={c.id} className="flex justify-between text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {c.matiere.nom} {c.chapitreLibre ? `- ${c.chapitreLibre}` : ""}
                  </span>
                  <span className="text-zinc-500">{c.date.toLocaleDateString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Dernieres notes
          </h2>
          {dernieresNotes.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune note enregistree.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {dernieresNotes.map((n) => (
                <li key={n.id} className="flex justify-between text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">{n.matiere.nom}</span>
                  <span className="text-zinc-500">
                    {n.noteObtenue}/{n.noteMaximale}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
