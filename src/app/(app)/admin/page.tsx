import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estEnModeStreamer } from "@/lib/modeStreamer";
import { LIBELLES_STATUT_SYNCHRONISATION } from "@/lib/libelles";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { boutonPrincipal, champ, encart, label, titrePage, titreSection } from "@/lib/ui";
import { BoutonSoumission } from "@/components/BoutonSoumission";
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
  // La page admin liste des emails et noms d'autres utilisateurs : elle reste
  // hors d'atteinte tant que le mode streamer masque les informations
  // personnelles, meme pour un compte ADMIN.
  if (await estEnModeStreamer(session.user.id)) redirect("/");
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
    <div className="flex flex-col gap-[var(--carreau)]">
      <h1 className={titrePage}>Administration</h1>
      {erreur && <p className="font-body text-sm text-bic-red">{erreur}</p>}

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>
          Autoriser un nouvel utilisateur
        </h2>
        <form action={autoriserEmail} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 min-w-40 flex-col gap-1">
            <label className={label} htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className={champ}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="role">
              Rôle
            </label>
            <select
              id="role"
              name="role"
              defaultValue="UTILISATEUR"
              className={champ}
            >
              <option value="UTILISATEUR">Utilisateur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <BoutonSoumission className={boutonPrincipal}>
            Autoriser
          </BoutonSoumission>
        </form>

        {emailsAutorises.length > 0 && (
          <div className="mt-4">
            <h3 className={label + " mb-2 block"}>En attente de première connexion</h3>
            <ul className="flex flex-col gap-1">
              {emailsAutorises.map((e) => (
                <li key={e.id} className="flex items-center justify-between border-b border-ruling/60 py-0.5 font-body text-sm">
                  <span className="font-body text-sm text-ink">
                    {e.email} <span className="font-body text-xs text-ink-soft">({e.role})</span>
                  </span>
                  <form action={revoquerAutorisation}>
                    <input type="hidden" name="id" value={e.id} />
                    <BoutonSoumission className="font-body text-xs font-bold text-bic-red underline decoration-1 underline-offset-4">
                      Révoquer
                    </BoutonSoumission>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>Utilisateurs</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-blue/40 text-left">
              <th className={label + " py-1.5"}>Email</th>
              <th className={label + " py-1.5"}>Rôle</th>
              <th className={label + " py-1.5"}>Statut</th>
              <th className={label + " py-1.5"}>Créé le</th>
              <th className={label + " py-1.5"}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {utilisateurs.map((u) => (
              <tr key={u.id} className="border-b border-ruling/60">
                <td className="py-1.5 font-body text-sm text-ink">{u.email}</td>
                <td className="py-1.5 font-body text-sm text-ink">{u.role}</td>
                <td className="py-1.5 font-body text-sm text-ink">
                  {u.actif ? (
                    <span className="text-bic-green">Actif</span>
                  ) : (
                    <span className="text-bic-red">Désactivé</span>
                  )}
                </td>
                <td className="py-1.5 font-body text-sm text-ink">{u.createdAt.toLocaleDateString("fr-FR")}</td>
                <td className="py-1.5 font-body text-sm text-ink">
                  {u.id === session.user.id ? (
                    <span className="font-body text-xs text-ink-soft">Vous</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <form action={basculerActivationUtilisateur}>
                        <input type="hidden" name="utilisateurId" value={u.id} />
                        <BoutonSoumission className="font-body text-xs font-bold text-ink-blue underline decoration-1 underline-offset-4">
                          {u.actif ? "Désactiver" : "Activer"}
                        </BoutonSoumission>
                      </form>
                      <form action={supprimerUtilisateur}>
                        <input type="hidden" name="utilisateurId" value={u.id} />
                        <BoutonSupprimer
                          libelle="Supprimer le compte"
                          invite={`Supprimer ${u.email} et toutes ses données ?`}
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

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>
          État des synchronisations
        </h2>
        {synchronisations.length === 0 ? (
          <p className="font-body text-sm text-ink-soft">Aucune synchronisation enregistrée.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {synchronisations.map((s) => (
              <li key={s.id} className="flex justify-between gap-3 border-b border-ruling/50 py-0.5 font-mono text-xs text-ink-soft">
                <span>
                  {s.utilisateur?.email ?? "Utilisateur supprimé"} — {s.demarreeLe.toLocaleString("fr-FR")}
                </span>
                <span>
                  {LIBELLES_STATUT_SYNCHRONISATION[s.statut]} · {s.elementsImportes} éléments
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>
          Journal des événements
        </h2>
        {journaux.length === 0 ? (
          <p className="font-body text-sm text-ink-soft">Aucun événement enregistré.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {journaux.map((j) => (
              <li key={j.id} className="flex justify-between gap-3 border-b border-ruling/50 py-0.5 font-mono text-xs text-ink-soft">
                <span>
                  {j.utilisateur?.email ?? "Utilisateur supprimé"} — {j.action}
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
