import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LIBELLES_STATUT_SYNCHRONISATION } from "@/lib/libelles";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import {
  autoriserEmail,
  basculerActivationUtilisateur,
  revoquerAutorisation,
  supprimerUtilisateur,
} from "./actions";

export default async function PageAdmin({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");
  const { erreur } = await searchParams;

  const [utilisateurs, journaux, synchronisations, emailsAutorises] = await Promise.all([
    prisma.utilisateur.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.journal.findMany({
      include: { utilisateur: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.synchronisation.findMany({
      include: { utilisateur: { select: { email: true } } },
      orderBy: { demarreeLe: "desc" },
      take: 50,
    }),
    prisma.emailAutorise.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Administration</h1>
      {erreur && <p className="text-sm text-red-500">{erreur}</p>}

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Autoriser un nouvel utilisateur
        </h2>
        <p className="mb-3 text-sm text-zinc-500">
          Aucun compte n&apos;est cree directement : l&apos;email est mis en liste blanche, et un compte
          local est provisionne automatiquement a la premiere connexion ZITADEL de cette personne.
        </p>
        <form action={autoriserEmail} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 min-w-40 flex-col gap-1">
            <label className="text-xs text-zinc-500" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="UTILISATEUR"
              className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="UTILISATEUR">Utilisateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Autoriser
          </button>
        </form>

        {emailsAutorises.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-medium text-zinc-500">En attente de premiere connexion</h3>
            <ul className="flex flex-col gap-1">
              {emailsAutorises.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {e.email} <span className="text-xs text-zinc-500">({e.role})</span>
                  </span>
                  <form action={revoquerAutorisation}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className="text-xs text-red-500 hover:underline">
                      Revoquer
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Utilisateurs</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-zinc-500 dark:border-zinc-800">
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Statut</th>
              <th className="py-2 font-medium">Cree le</th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">
                  {u.actif ? (
                    <span className="text-green-600 dark:text-green-400">Actif</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">Desactive</span>
                  )}
                </td>
                <td className="py-2">{u.createdAt.toLocaleDateString("fr-FR")}</td>
                <td className="py-2">
                  {u.id === session.user.id ? (
                    <span className="text-xs text-zinc-400">Vous</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <form action={basculerActivationUtilisateur}>
                        <input type="hidden" name="utilisateurId" value={u.id} />
                        <button type="submit" className="text-xs text-zinc-600 underline dark:text-zinc-400">
                          {u.actif ? "Desactiver" : "Activer"}
                        </button>
                      </form>
                      <form action={supprimerUtilisateur}>
                        <input type="hidden" name="utilisateurId" value={u.id} />
                        <BoutonSupprimer
                          confirmation={`Supprimer definitivement le compte ${u.email} et toutes ses donnees ?`}
                        />
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Etat des synchronisations
        </h2>
        {synchronisations.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune synchronisation enregistree.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {synchronisations.map((s) => (
              <li key={s.id} className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>
                  {s.utilisateur?.email ?? "Utilisateur supprime"} — {s.demarreeLe.toLocaleString("fr-FR")}
                </span>
                <span>
                  {LIBELLES_STATUT_SYNCHRONISATION[s.statut]} · {s.elementsImportes} elements
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-300 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Journal des evenements
        </h2>
        {journaux.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun evenement enregistre.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {journaux.map((j) => (
              <li key={j.id} className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>
                  {j.utilisateur?.email ?? "Utilisateur supprime"} — {j.action}
                  {j.entiteType ? ` (${j.entiteType})` : ""}
                </span>
                <span>{j.createdAt.toLocaleString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
