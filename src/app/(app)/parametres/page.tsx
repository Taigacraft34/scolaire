import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BoutonSoumission } from "@/components/BoutonSoumission";
import { ConfirmationSuppression } from "@/components/ConfirmationSuppression";
import {
  boutonEncadre,
  boutonPrincipal,
  champ,
  encart,
  label,
  titrePage,
  titreSection,
} from "@/lib/ui";
import {
  basculerModeDeveloppeur,
  basculerModeStreamer,
  enregistrerNtfy,
  enregistrerTokenScolengo,
  envoyerNotificationTest,
  lancerSynchronisationGenerale,
  mettreAJourFrequenceSynchronisation,
  mettreAJourPreferences,
  mettreAJourRappels,
  mettreAJourRappelsDevoir,
  reinitialiserDonnees,
  supprimerNtfy,
} from "./actions";

const OPTIONS_FREQUENCE = [
  { valeur: "MANUELLE", libelle: "Manuelle uniquement" },
  { valeur: "HORAIRE", libelle: "Toutes les heures" },
  { valeur: "TOUTES_LES_6H", libelle: "Toutes les 6 heures" },
  { valeur: "QUOTIDIENNE", libelle: "Une fois par jour" },
];

const FUSEAUX_HORAIRES = [
  "Europe/Paris",
  "America/Guadeloupe",
  "America/Martinique",
  "America/Cayenne",
  "America/Miquelon",
  "Indian/Reunion",
  "Indian/Mayotte",
  "Pacific/Noumea",
  "Pacific/Tahiti",
];

const OPTIONS_RAPPELS = [
  { valeur: "J_MOINS_14", libelle: "2 semaines avant" },
  { valeur: "J_MOINS_7", libelle: "7 jours avant" },
  { valeur: "J_MOINS_3", libelle: "3 jours avant" },
  { valeur: "J_MOINS_2", libelle: "2 jours avant" },
  { valeur: "VEILLE", libelle: "La veille (18h)" },
  { valeur: "MATIN_MEME", libelle: "Le matin même (6h30)" },
];

const OPTIONS_RAPPELS_DEVOIR = [
  { valeur: "J_MOINS_7", libelle: "7 jours avant" },
  { valeur: "J_MOINS_3", libelle: "3 jours avant" },
  { valeur: "J_MOINS_2", libelle: "2 jours avant" },
  { valeur: "VEILLE", libelle: "La veille (18h)" },
  { valeur: "MATIN_MEME", libelle: "Le matin même (6h30)" },
];

const OPTIONS_CANAUX = [
  { valeur: "EMAIL", libelle: "Email" },
  { valeur: "MOBILE", libelle: "Mobile (ntfy/Pushover/Gotify)" },
];

export default async function PageParametres({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; succes?: string; testOk?: string }>;
}) {
  const session = await auth();
  const { erreur, succes, testOk } = await searchParams;

  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({ where: { id: session!.user.id } });
  const parametreNtfy = await prisma.parametreNotification.findFirst({
    where: { utilisateurId: session!.user.id, fournisseur: "NTFY" },
  });
  const configNtfy = (parametreNtfy?.configuration as { topic?: string; serveur?: string } | null) ?? null;
  const derniereSynchro = await prisma.synchronisation.findFirst({
    where: { utilisateurId: session!.user.id },
    orderBy: { demarreeLe: "desc" },
  });

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={titrePage}>Paramètres</h1>
        <form action={lancerSynchronisationGenerale}>
          <BoutonSoumission texteChargement="Synchronisation…" className={boutonPrincipal}>
            Synchroniser maintenant
          </BoutonSoumission>
        </form>
      </div>

      {derniereSynchro && (
        <p className="-mt-3 font-body text-xs text-ink-soft">
          Dernière synchronisation : {derniereSynchro.demarreeLe.toLocaleString("fr-FR")} —{" "}
          {derniereSynchro.statut} ({derniereSynchro.elementsImportes} éléments importés)
        </p>
      )}

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>
          Synchronisation automatique
        </h2>
        <form action={mettreAJourFrequenceSynchronisation} className="flex flex-wrap items-end gap-3">
          <select
            name="frequence"
            defaultValue={utilisateur.frequenceSynchronisation}
            className={champ}
          >
            {OPTIONS_FREQUENCE.map((option) => (
              <option key={option.valeur} value={option.valeur}>
                {option.libelle}
              </option>
            ))}
          </select>
          <BoutonSoumission className={boutonPrincipal}>
            Enregistrer
          </BoutonSoumission>
        </form>
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>Compte ZITADEL</h2>
        <a
          href={`${process.env.ZITADEL_ISSUER}/ui/console/users/me`}
          target="_blank"
          rel="noopener noreferrer"
          className={boutonEncadre}
        >
          Gérer mon compte ZITADEL ↗
        </a>
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>
          Connexion MonBureauNumérique
        </h2>
        <p className="mb-3 font-body text-sm text-ink-soft">
          Statut :{" "}
          {utilisateur.scolengoTokenChiffre ? (
            <span className="text-bic-green">token configuré</span>
          ) : (
            <span className="text-bic-red">aucun token configuré</span>
          )}
        </p>

        {erreur && <p className="mb-3 font-body text-sm text-bic-red">{erreur}</p>}
        {succes && !testOk && (
          <p className="mb-3 font-body text-sm text-bic-green">Configuration enregistrée.</p>
        )}

        <form action={enregistrerTokenScolengo} className="flex flex-col gap-2">
          <label className={label} htmlFor="configJson">
            Configuration Scolengo (JSON contenant <code>tokenSet</code> et <code>school</code>, obtenu via l&apos;utilitaire{" "}
            <a
              href="https://github.com/maelgangloff/scolengo-token"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              scolengo-token
            </a>
            )
          </label>
          <textarea
            id="configJson"
            name="configJson"
            rows={8}
            placeholder='{"tokenSet": {"access_token": "...", "refresh_token": "...", ...}, "school": {"id": "SKO-E-...", ...}}'
            className={champ + " font-mono"}
          />
          <BoutonSoumission className={boutonPrincipal + " self-start"}>
            Enregistrer
          </BoutonSoumission>
        </form>
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>Mode développeur</h2>
        <form action={basculerModeDeveloppeur}>
          <input type="hidden" name="actif" value={utilisateur.modeDeveloppeur ? "0" : "1"} />
          <BoutonSoumission className={boutonPrincipal}>
            {utilisateur.modeDeveloppeur ? "Désactiver le mode développeur" : "Activer le mode développeur"}
          </BoutonSoumission>
        </form>

        <div className="mt-4 border-t border-ruling pt-3">
          <h3 className={titreSection + " mb-1 block"}>Mode streamer</h3>
          <p className="mb-2 font-body text-xs text-ink-soft">
            Masque le nom de l&apos;établissement, ton nom/email et les noms des enseignants
            partout dans l&apos;appli — utile en direct ou en capture d&apos;écran.
          </p>
          <form action={basculerModeStreamer}>
            <input type="hidden" name="actif" value={utilisateur.modeStreamer ? "0" : "1"} />
            <BoutonSoumission className={boutonEncadre}>
              {utilisateur.modeStreamer ? "Désactiver le mode streamer" : "Activer le mode streamer"}
            </BoutonSoumission>
          </form>
        </div>
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>Préférences</h2>
        <form action={mettreAJourPreferences} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="motsCles">
              Mots-clés de détection des contrôles (séparés par des virgules)
            </label>
            <textarea
              id="motsCles"
              name="motsCles"
              rows={3}
              defaultValue={utilisateur.motsClesControle.join(", ")}
              className={champ}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={label} htmlFor="fuseauHoraire">
              Fuseau horaire
            </label>
            <select
              id="fuseauHoraire"
              name="fuseauHoraire"
              defaultValue={utilisateur.fuseauHoraire}
              className={champ}
            >
              {!FUSEAUX_HORAIRES.includes(utilisateur.fuseauHoraire) && (
                <option value={utilisateur.fuseauHoraire}>{utilisateur.fuseauHoraire}</option>
              )}
              {FUSEAUX_HORAIRES.map((fuseau) => (
                <option key={fuseau} value={fuseau}>
                  {fuseau}
                </option>
              ))}
            </select>
          </div>
          <BoutonSoumission className={boutonPrincipal + " self-start"}>
            Enregistrer
          </BoutonSoumission>
        </form>
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>Rappels de contrôles</h2>
        <form action={mettreAJourRappels} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-3">
              {OPTIONS_RAPPELS.map((option) => (
                <label key={option.valeur} className="flex items-center gap-1 font-body text-sm text-ink">
                  <input
                    type="checkbox"
                    name="rappels"
                    value={option.valeur}
                    defaultChecked={utilisateur.rappelsParDefaut.includes(
                      option.valeur as (typeof utilisateur.rappelsParDefaut)[number],
                    )}
                  />
                  {option.libelle}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className={label}>Canaux utilisés pour ces rappels</p>
            <div className="flex flex-wrap gap-3">
              {OPTIONS_CANAUX.map((option) => (
                <label key={option.valeur} className="flex items-center gap-1 font-body text-sm text-ink">
                  <input
                    type="checkbox"
                    name="canaux"
                    value={option.valeur}
                    defaultChecked={utilisateur.canauxParDefaut.includes(
                      option.valeur as (typeof utilisateur.canauxParDefaut)[number],
                    )}
                  />
                  {option.libelle}
                </label>
              ))}
            </div>
          </div>
          <BoutonSoumission className={boutonPrincipal + " self-start"}>
            Enregistrer
          </BoutonSoumission>
        </form>
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>Rappels de devoirs</h2>
        <form action={mettreAJourRappelsDevoir} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-3">
              {OPTIONS_RAPPELS_DEVOIR.map((option) => (
                <label key={option.valeur} className="flex items-center gap-1 font-body text-sm text-ink">
                  <input
                    type="checkbox"
                    name="rappelsDevoir"
                    value={option.valeur}
                    defaultChecked={utilisateur.rappelsDevoirParDefaut.includes(
                      option.valeur as (typeof utilisateur.rappelsDevoirParDefaut)[number],
                    )}
                  />
                  {option.libelle}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className={label}>Canaux utilisés pour ces rappels</p>
            <div className="flex flex-wrap gap-3">
              {OPTIONS_CANAUX.map((option) => (
                <label key={option.valeur} className="flex items-center gap-1 font-body text-sm text-ink">
                  <input
                    type="checkbox"
                    name="canauxDevoir"
                    value={option.valeur}
                    defaultChecked={utilisateur.canauxDevoirParDefaut.includes(
                      option.valeur as (typeof utilisateur.canauxDevoirParDefaut)[number],
                    )}
                  />
                  {option.libelle}
                </label>
              ))}
            </div>
          </div>
          <BoutonSoumission className={boutonPrincipal + " self-start"}>
            Enregistrer
          </BoutonSoumission>
        </form>
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>
          Notifications mobiles (ntfy)
        </h2>
        <p className="mb-3 font-body text-sm text-ink-soft">
          Abonnez-vous à ce topic dans l&apos;app{" "}
          <a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer" className="underline">
            ntfy
          </a>{" "}
          pour recevoir les rappels sur votre téléphone.
        </p>
        <form action={enregistrerNtfy} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 min-w-40 flex-col gap-1">
            <label className={label} htmlFor="topic">
              Topic
            </label>
            <input
              id="topic"
              name="topic"
              required
              defaultValue={configNtfy?.topic ?? ""}
              placeholder="ex: scolaire-taiga-x7g2"
              className={champ}
            />
          </div>
          <div className="flex flex-1 min-w-40 flex-col gap-1">
            <label className={label} htmlFor="serveur">
              Serveur (optionnel, ntfy.sh par défaut)
            </label>
            <input
              id="serveur"
              name="serveur"
              defaultValue={configNtfy?.serveur ?? ""}
              placeholder="https://ntfy.sh"
              className={champ}
            />
          </div>
          <BoutonSoumission className={boutonPrincipal}>
            Enregistrer
          </BoutonSoumission>
        </form>
        {parametreNtfy && (
          <form action={supprimerNtfy} className="mt-2">
            <button type="submit" className="font-body text-xs font-bold text-bic-red underline decoration-1 underline-offset-4">
              Désactiver les notifications ntfy
            </button>
          </form>
        )}
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>
          Tester les notifications
        </h2>
        {testOk && (
          <p className="mb-3 font-body text-sm text-bic-green">
            Test envoyé avec succès : {testOk || "email"}.
          </p>
        )}
        <form action={envoyerNotificationTest}>
          <BoutonSoumission texteChargement="Envoi…" className={boutonEncadre}>
            Envoyer un test
          </BoutonSoumission>
        </form>
      </section>

      <section className={encart}>
        <h2 className={titreSection + " mb-2 block"}>
          Exporter mes données
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/export?portee=cours"
            className={boutonEncadre}
          >
            Cours uniquement
          </a>
          <a
            href="/api/export?portee=sans-cours"
            className={boutonEncadre}
          >
            Tout sauf les cours
          </a>
          <a
            href="/api/export?portee=tout"
            className={boutonPrincipal}
          >
            Tout exporter
          </a>
        </div>
      </section>

      <section className="rounded-sm border border-bic-red/40 bg-bic-red/[0.04] p-4">
        <h2 className={titreSection + " mb-2 block text-bic-red"}>Zone dangereuse</h2>
        <p className="mb-3 font-body text-sm text-ink-soft">
          Supprime définitivement vos matières, cours, devoirs, contrôles, notes et documents. Le compte
          et la connexion MonBureauNumérique sont conservés. Action irréversible.
        </p>
        <form action={reinitialiserDonnees}>
          <ConfirmationSuppression motAttendu="SUPPRIMER">
            Réinitialiser toutes mes données
          </ConfirmationSuppression>
        </form>
      </section>
    </div>
  );
}
