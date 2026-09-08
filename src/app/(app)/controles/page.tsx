import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { libelleStatutControle } from "@/lib/libelles";
import { FormulaireSynchronisation } from "@/components/FormulaireSynchronisation";
import { ChampsControle } from "@/components/ChampsControle";
import { BoutonSupprimer } from "@/components/BoutonSupprimer";
import { MiseEnAvantRecherche } from "@/components/MiseEnAvantRecherche";
import { formatDateInput } from "@/lib/prochainCours";
import { IconeCroix } from "@/components/Icone";
import { blocChamp, boutonEncadre, boutonPrincipal, champ, encart, etiquette, label, rangeeChamps, titrePage, titreSection } from "@/lib/ui";
import Link from "next/link";
import {
  creerControleManuel,
  delierChapitreDuControle,
  lierChapitreAuControle,
  lierDevoirAuControle,
  supprimerControle,
} from "./actions";

export default async function PageControles({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; focus?: string }>;
}) {
  const session = await auth();
  const utilisateurId = session!.user.id;
  const { erreur, focus } = await searchParams;

  const debutAujourdhui = new Date();
  debutAujourdhui.setHours(0, 0, 0, 0);

  const [utilisateur, controles, derniereSynchro, matieres, devoirsDisponibles, chapitresDisponibles, seances] =
    await Promise.all([
      prisma.utilisateur.findUnique({ where: { id: utilisateurId }, select: { modeDeveloppeur: true } }),
      prisma.controle.findMany({
        where: { utilisateurId },
        include: {
          matiere: true,
          note: true,
          devoirSource: { include: { matiere: true } },
          chapitres: { include: { chapitre: { include: { matiere: true } } } },
        },
        orderBy: { date: "desc" },
        take: 100,
      }),
      prisma.synchronisation.findFirst({ where: { utilisateurId }, orderBy: { demarreeLe: "desc" } }),
      prisma.matiere.findMany({ where: { utilisateurId }, orderBy: { nom: "asc" } }),
      prisma.devoir.findMany({
        where: { utilisateurId, controleGenere: null, date: { gte: debutAujourdhui } },
        include: { matiere: true },
        orderBy: { date: "asc" },
        take: 200,
      }),
      prisma.chapitre.findMany({
        where: { utilisateurId },
        include: { matiere: true },
        orderBy: { nom: "asc" },
        take: 300,
      }),
      prisma.seanceEmploiDuTemps.findMany({
        where: { utilisateurId, annule: false, debut: { gte: debutAujourdhui } },
        select: { debut: true, matiere: true },
        orderBy: { debut: "asc" },
        take: 500,
      }),
    ]);

  const modeDeveloppeur = utilisateur?.modeDeveloppeur ?? false;

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <h1 className={titrePage}>Contrôles</h1>

      <MiseEnAvantRecherche focusId={focus} />

      {modeDeveloppeur && <FormulaireSynchronisation derniereSynchro={derniereSynchro} />}

      <section className={encart}>
        <h2 className={titreSection + " mb-2"}>Ajouter un contrôle</h2>
        {erreur && <p className="mb-2 font-body text-sm text-bic-red">{erreur}</p>}
        <form action={creerControleManuel} className="flex flex-col gap-3">
          <div className={rangeeChamps}>
            <ChampsControle
              matieres={matieres.map((m) => m.nom)}
              seances={seances}
              devoirs={devoirsDisponibles.map((devoir) => ({
                id: devoir.id,
                matiereNom: devoir.matiere.nom,
                libelle: `${devoir.titre} (${devoir.date.toLocaleDateString("fr-FR")})`,
                date: formatDateInput(devoir.date),
              }))}
            />
            <div className="flex flex-col gap-1 sm:min-w-[7rem]">
              <label className={label} htmlFor="heure">
                Heure
              </label>
              <input type="time" id="heure" name="heure" className={champ} />
            </div>
            <div className={blocChamp}>
              <label className={label} htmlFor="chapitre">
                Chapitre
              </label>
              <input id="chapitre" name="chapitre" className={champ} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="commentaire">
              Commentaire
            </label>
            <textarea id="commentaire" name="commentaire" rows={2} className={champ} />
          </div>
          <button type="submit" className={boutonPrincipal + " self-start"}>
            Ajouter
          </button>
        </form>
      </section>

      {controles.length === 0 ? (
        <p className="font-body leading-[var(--carreau)] text-ink-soft">
          Aucun contrôle. Ils sont détectés automatiquement à la synchronisation des devoirs, ou
          ajoute-les ci-dessus.
        </p>
      ) : (
        <ul className="flex flex-col gap-[var(--carreau)]">
          {controles.map((controle) => {
            const devoirsMemeMatiere = controle.devoirSource
              ? []
              : devoirsDisponibles.filter((d) => d.matiereId === controle.matiereId);
            const idsLies = new Set(controle.chapitres.map((l) => l.chapitreId));
            const chapitresNonLies = chapitresDisponibles.filter((c) => !idsLies.has(c.id));

            return (
              <li key={controle.id} id={`element-${controle.id}`} className="flex flex-col">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 font-display text-lg leading-[var(--carreau)] text-ink">
                    <span className="text-ink-blue">{controle.matiere.nom}</span>
                    {controle.chapitreLibre ? ` — ${controle.chapitreLibre}` : ""}
                  </p>
                  <div className="flex shrink-0 items-baseline gap-3">
                    <span className="tabulaire font-mono text-xs text-ink-soft">
                      {controle.date.toLocaleDateString("fr-FR")}
                    </span>
                    <form action={supprimerControle}>
                      <input type="hidden" name="controleId" value={controle.id} />
                      <BoutonSupprimer libelle="Supprimer le contrôle" />
                    </form>
                  </div>
                </div>

                <p className="flex flex-wrap items-baseline gap-x-2 font-body text-xs text-ink-soft">
                  <span className="uppercase tracking-wide">{libelleStatutControle(controle.date)}</span>
                  {controle.note && (
                    <span className="tabulaire font-mono text-sm font-bold text-bic-red">
                      {String(controle.note.noteObtenue).replace(".", ",")}
                      <span className="text-ink-soft">/{controle.note.noteMaximale}</span>
                    </span>
                  )}
                  {controle.type === "AUTOMATIQUE" && (
                    <span className={etiquette}>Auto</span>
                  )}
                </p>

                {controle.devoirSource ? (
                  <p className="font-body text-xs text-ink-soft">
                    Devoir associé — {controle.devoirSource.matiere.nom} · {controle.devoirSource.titre}
                  </p>
                ) : devoirsMemeMatiere.length > 0 ? (
                  <form action={lierDevoirAuControle} className="mt-1 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="controleId" value={controle.id} />
                    <select name="devoirId" required defaultValue="" className={champ + " max-w-xs text-xs"}>
                      <option value="" disabled>
                        Lier à un devoir de {controle.matiere.nom}…
                      </option>
                      {devoirsMemeMatiere.map((devoir) => (
                        <option key={devoir.id} value={devoir.id}>
                          {devoir.titre} ({devoir.date.toLocaleDateString("fr-FR")})
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={boutonEncadre + " text-xs"}>
                      Lier
                    </button>
                  </form>
                ) : null}

                {controle.chapitres.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {controle.chapitres.map((liaison) => (
                      <li key={liaison.chapitreId} className={etiquette + " gap-1 pr-1"}>
                        <Link
                          href={`/cours/${liaison.chapitre.matiereId}/${liaison.chapitreId}`}
                          className="hover:underline"
                        >
                          {liaison.chapitre.matiere.nom} · {liaison.chapitre.nom}
                        </Link>
                        <form action={delierChapitreDuControle}>
                          <input type="hidden" name="controleId" value={controle.id} />
                          <input type="hidden" name="chapitreId" value={liaison.chapitreId} />
                          <button type="submit" className="text-bic-red" aria-label="Délier">
                            <IconeCroix className="text-[0.7em]" />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                {chapitresNonLies.length > 0 && (
                  <form action={lierChapitreAuControle} className="mt-1 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="controleId" value={controle.id} />
                    <select name="chapitreId" required defaultValue="" className={champ + " max-w-xs text-xs"}>
                      <option value="" disabled>
                        Lier à un chapitre…
                      </option>
                      {chapitresNonLies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.matiere.nom} — {c.nom}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={boutonEncadre + " text-xs"}>
                      Lier
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
