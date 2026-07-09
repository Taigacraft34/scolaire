import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function PageAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const utilisateurs = await prisma.utilisateur.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Administration</h1>
      <p className="mt-2 text-sm text-zinc-500">
        A implementer : activation/desactivation, logs, parametres globaux, etat des synchronisations.
      </p>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Actif</th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((u) => (
            <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2">{u.email}</td>
              <td className="py-2">{u.role}</td>
              <td className="py-2">{u.actif ? "Oui" : "Non"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
