import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { trouverOuCreerMatiere } from "@/lib/matieres";
import { depuisScolengo } from "@/lib/piecesJointes";
import {
  genererRappelsPourControle,
  genererRappelsPourDevoir,
  supprimerRappelsDevoirNonEnvoyes,
} from "@/lib/notifications/rappels";
import { avecVerrouScolengo, getClientScolengo } from "./client";

export interface OptionsSynchronisation {
  dateDebut?: Date;
  dateFin?: Date;
}

function formatDateAPI(date: Date): string {
  return date.toISOString().split("T")[0];
}

function extraireHeure(dateIso: string | null): string | undefined {
  if (!dateIso) return undefined;
  return dateIso.slice(11, 16) || undefined;
}

function detecterControle(titre: string, description: string, motsCles: string[]): boolean {
  const texte = `${titre} ${description}`.toLowerCase();
  return motsCles.some((motCle) => motCle.trim().length > 0 && texte.includes(motCle.toLowerCase()));
}

// L'API Scolengo plafonne "limit" a 100 par page ; on pagine pour tout recuperer.
const TAILLE_PAGE = 100;

async function recupererToutesLesPages<T>(
  recuperer: (limit: number, offset: number) => Promise<T[]>,
): Promise<T[]> {
  const resultats: T[] = [];
  let offset = 0;
  for (;;) {
    const page = await recuperer(TAILLE_PAGE, offset);
    resultats.push(...page);
    if (page.length < TAILLE_PAGE) break;
    offset += TAILLE_PAGE;
  }
  return resultats;
}

/**
 * Synchronise les devoirs et les notes d'un utilisateur depuis MonBureauNumerique (Scolengo API).
 * La plage de dates par defaut couvre la periode habituellement utile (2 semaines passees a 2 mois
 * a venir) ; elle peut etre surchargee, notamment pour rejouer une periode passee (ex: mois de mars)
 * lorsque l'emploi du temps courant est vide (vacances, hors periode scolaire).
 */
export async function synchroniserUtilisateur(utilisateurId: string, options: OptionsSynchronisation = {}) {
  // Serialise avec toute autre operation Scolengo pour cet utilisateur (ex: un
  // clic "marquer termine" pendant une synchro planifiee) - voir avecVerrouScolengo.
  return avecVerrouScolengo(utilisateurId, () => executerSynchronisation(utilisateurId, options));
}

async function executerSynchronisation(utilisateurId: string, options: OptionsSynchronisation) {
  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({ where: { id: utilisateurId } });

  const synchronisation = await prisma.synchronisation.create({
    data: { utilisateurId, statut: "EN_COURS" },
  });

  let elementsImportes = 0;
  const erreurs: string[] = [];

  try {
    const client = await getClientScolengo(utilisateurId);
    if (!client) throw new Error("Aucun token Scolengo n'est configure pour cet utilisateur.");

    const maintenant = new Date();
    const dateDebut = options.dateDebut ?? new Date(maintenant.getTime() - 14 * 24 * 3600 * 1000);
    const dateFin = options.dateFin ?? new Date(maintenant.getTime() + 60 * 24 * 3600 * 1000);
    const studentId = client.getTokenClaims().sub;

    // --- Devoirs (+ detection automatique des controles) ---
    // Includes explicites : on omet "teacher.person" (inclus par defaut par la
    // lib), dont la resolution fait planter le serveur Scolengo cote API avec
    // "couldn't create a new instance of ... PersonAbstractModel". On ne lit
    // que devoir.teacher.firstName/lastName, portes par la ressource "teacher"
    // elle-meme - l'include "person" est inutile ici.
    const devoirs = await recupererToutesLesPages((limit, offset) =>
      client.getHomeworkAssignments(
        studentId,
        formatDateAPI(dateDebut),
        formatDateAPI(dateFin),
        limit,
        offset,
        undefined,
        ["subject", "teacher"],
      ),
    );

    for (const devoir of devoirs) {
      try {
        const matiere = await trouverOuCreerMatiere(
          utilisateurId,
          devoir.subject?.label ?? "Matiere inconnue",
          devoir.subject?.id,
        );

        const enseignant = devoir.teacher
          ? [devoir.teacher.firstName, devoir.teacher.lastName].filter(Boolean).join(" ") || null
          : null;

        // La liste /homework-assignments refuse l'include "attachments"
        // ("include [attachments] not supported") : seul le detail d'un devoir
        // porte ses pieces jointes, d'ou un appel par devoir. Un echec ici ne
        // doit pas bloquer le devoir : on garde alors les pieces deja connues.
        let piecesJointes: Prisma.InputJsonValue | undefined;
        try {
          const detail = await client.getHomeworkAssignment(studentId, devoir.id, undefined, ["attachments"]);
          piecesJointes = depuisScolengo(detail.attachments) as unknown as Prisma.InputJsonValue;
        } catch (e) {
          erreurs.push(
            `Pieces jointes du devoir "${devoir.title ?? devoir.id}" : ${e instanceof Error ? e.message : String(e)}`,
          );
        }

        const titre = devoir.title?.trim() || "Devoir";
        const description = devoir.html ?? null;
        const dateEcheance = devoir.dueDateTime ? new Date(devoir.dueDateTime) : new Date();

        const donneesDevoir = {
          utilisateurId,
          matiereId: matiere.id,
          enseignant,
          date: dateEcheance,
          heure: extraireHeure(devoir.dueDateTime),
          titre,
          description,
          statut: devoir.done ? ("TERMINE" as const) : ("A_FAIRE" as const),
          provenance: "MBN" as const,
          externalId: devoir.id,
          piecesJointes,
        };

        const devoirExistant = await prisma.devoir.findFirst({
          where: { utilisateurId, externalId: devoir.id },
        });

        const devoirEnregistre = devoirExistant
          ? await prisma.devoir.update({ where: { id: devoirExistant.id }, data: donneesDevoir })
          : await prisma.devoir.create({ data: donneesDevoir });

        elementsImportes++;

        const estControle = detecterControle(titre, description ?? "", utilisateur.motsClesControle);
        if (estControle) {
          const controleExistant = await prisma.controle.findFirst({
            where: { devoirSourceId: devoirEnregistre.id },
          });

          if (!controleExistant) {
            const controleCree = await prisma.controle.create({
              data: {
                utilisateurId,
                matiereId: matiere.id,
                devoirSourceId: devoirEnregistre.id,
                date: dateEcheance,
                heure: donneesDevoir.heure,
                type: "AUTOMATIQUE",
              },
            });

            await genererRappelsPourControle(controleCree.id, utilisateurId);

            await prisma.journal.create({
              data: {
                utilisateurId,
                action: "CREATION_CONTROLE",
                entiteType: "Controle",
                entiteId: devoirEnregistre.id,
                metadonnees: { source: "detection_automatique", titre },
              },
            });
          }
        }

        // Rappels de devoir : programmes tant que le devoir est a faire, retires
        // des qu'il est marque fait cote MonBureauNumerique. Ignores si le devoir
        // a donne lieu a un controle (les rappels de controle prennent le relais).
        if (devoirEnregistre.statut === "A_FAIRE") {
          await genererRappelsPourDevoir(devoirEnregistre.id, utilisateurId);
        } else {
          await supprimerRappelsDevoirNonEnvoyes(devoirEnregistre.id);
        }
      } catch (e) {
        erreurs.push(`Devoir "${devoir.title ?? devoir.id}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // --- Notes (via les periodes d'evaluation) ---
    const parametresEvaluation = await client.getEvaluationSettings(studentId);
    const periodes = parametresEvaluation.flatMap((p) => p.periods ?? []);

    for (const periode of periodes) {
      try {
        // Le service d'evaluation porte une relation "teachers" dont la
        // resolution fait planter le serveur Scolengo avec "couldn't create
        // a new instance of ... PersonAbstractModel" (meme famille de bug
        // que "teacher.person" sur les devoirs, voir plus haut) - mais ici le
        // simple fait de retirer "teachers" des includes ne suffit pas : le
        // serveur construit quand meme le lien de la relation, quel que soit
        // "include". Seul un sparse fieldset JSON:API ("fields", documente en
        // commentaire dans scolengo-api) permet d'exclure "teachers" des
        // champs renvoyes pour la ressource evaluationService. On ne lit
        // jamais service.teachers ici, donc l'exclusion est sans consequence.
        const services = await recupererToutesLesPages((limit, offset) =>
          client.getEvaluation(
            studentId,
            periode.id,
            limit,
            offset,
            {
              fields: {
                evaluationService: "coefficient,average,studentAverage,scale,subject,evaluations",
              },
            },
            [
              "subject",
              "evaluations",
              "evaluations.evaluationResult",
              "evaluations.evaluationResult.subSkillsEvaluationResults",
              "evaluations.evaluationResult.subSkillsEvaluationResults.subSkill",
              "evaluations.subSkills",
            ],
          ),
        );

        for (const service of services) {
          const matiere = await trouverOuCreerMatiere(
            utilisateurId,
            service.subject?.label ?? "Matiere inconnue",
            service.subject?.id,
          );

          for (const evaluation of service.evaluations ?? []) {
            const resultat = evaluation.evaluationResult;
            if (!resultat || resultat.mark === null || resultat.mark === undefined) continue;

            const donneesNote = {
              utilisateurId,
              matiereId: matiere.id,
              date: evaluation.dateTime ? new Date(evaluation.dateTime) : new Date(),
              noteObtenue: resultat.mark,
              noteMaximale: evaluation.scale ?? evaluation.max ?? 20,
              coefficient: evaluation.coefficient ?? service.coefficient ?? 1,
              moyenneClasse: evaluation.average ?? service.average ?? null,
              commentaire: resultat.comment ?? null,
              provenance: "MBN" as const,
              externalId: evaluation.id,
            };

            const noteExistante = await prisma.note.findFirst({
              where: { utilisateurId, externalId: evaluation.id },
            });

            const noteEnregistree = noteExistante
              ? await prisma.note.update({ where: { id: noteExistante.id }, data: donneesNote })
              : await prisma.note.create({ data: donneesNote });

            elementsImportes++;

            // Liaison automatique note <-> controle (section 10) : meme matiere, meme jour, pas encore liee.
            if (!noteExistante?.controleId) {
              const debutJournee = new Date(donneesNote.date);
              debutJournee.setHours(0, 0, 0, 0);
              const finJournee = new Date(donneesNote.date);
              finJournee.setHours(23, 59, 59, 999);

              const controleCorrespondant = await prisma.controle.findFirst({
                where: {
                  utilisateurId,
                  matiereId: matiere.id,
                  date: { gte: debutJournee, lte: finJournee },
                  note: null,
                },
              });

              if (controleCorrespondant) {
                await prisma.note.update({
                  where: { id: noteEnregistree.id },
                  data: { controleId: controleCorrespondant.id },
                });
              }
            }
          }
        }
      } catch (e) {
        erreurs.push(`Periode "${periode.label}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // --- Emploi du temps (agenda : seances datees) ---
    try {
      // NB : demander l'inclusion JSON:API "lessons.contents" directement sur
      // /agendas fait revenir des jours avec des listes "lessons" vides cote
      // API Scolengo (verifie empiriquement) - on garde donc les includes par
      // defaut ici et on va chercher le contenu seance par seance ensuite.
      const agenda = await recupererToutesLesPages((limit, offset) =>
        client.getAgenda(studentId, formatDateAPI(dateDebut), formatDateAPI(dateFin), limit, offset),
      );

      const seancesVues: string[] = [];

      for (const jour of agenda) {
        for (const seance of jour.lessons ?? []) {
          const enseignant =
            seance.teachers
              ?.map((t) => [t.firstName, t.lastName].filter(Boolean).join(" "))
              .filter(Boolean)
              .join(", ") || null;

          let contenuSeance: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
          if (seance.anyContent) {
            try {
              const detail = await client.getLesson(studentId, seance.id);
              if (detail.contents && detail.contents.length > 0) {
                contenuSeance = detail.contents.map((c) => ({
                  id: c.id,
                  titre: c.title,
                  html: c.html,
                  piecesJointes: depuisScolengo(c.attachments) as unknown as Prisma.InputJsonValue[],
                }));
              }
            } catch (e) {
              erreurs.push(
                `Contenu de la seance "${seance.title ?? seance.id}" : ${e instanceof Error ? e.message : String(e)}`,
              );
            }
          }

          const donneesSeance = {
            utilisateurId,
            externalId: seance.id,
            debut: new Date(seance.startDateTime),
            fin: new Date(seance.endDateTime),
            matiere: seance.subject?.label ?? seance.title ?? "Cours",
            titre: seance.title ?? null,
            salle: [seance.location, seance.locationComplement].filter(Boolean).join(" ") || null,
            enseignant,
            couleur: seance.subject?.color ?? null,
            annule: seance.canceled ?? false,
            contenuSeance,
          };

          await prisma.seanceEmploiDuTemps.upsert({
            where: { utilisateurId_externalId: { utilisateurId, externalId: seance.id } },
            update: donneesSeance,
            create: donneesSeance,
          });
          seancesVues.push(seance.id);
          elementsImportes++;
        }
      }

      // L'agenda fait foi : on retire les seances de la periode qui n'existent
      // plus cote MonBureauNumerique (cours deplaces, annules et purges…).
      await prisma.seanceEmploiDuTemps.deleteMany({
        where: {
          utilisateurId,
          debut: { gte: dateDebut, lte: dateFin },
          externalId: { notIn: seancesVues.length > 0 ? seancesVues : ["__aucune__"] },
        },
      });
    } catch (e) {
      erreurs.push(`Emploi du temps : ${e instanceof Error ? e.message : String(e)}`);
    }

    await prisma.synchronisation.update({
      where: { id: synchronisation.id },
      data: {
        statut: erreurs.length > 0 ? "ECHEC" : "SUCCES",
        termineeLe: new Date(),
        elementsImportes,
        erreurs: erreurs.length > 0 ? erreurs.join("\n") : null,
      },
    });

    await prisma.journal.create({
      data: {
        utilisateurId,
        action: "SYNCHRONISATION",
        entiteType: "Synchronisation",
        entiteId: synchronisation.id,
        metadonnees: { elementsImportes, erreurs: erreurs.length },
      },
    });

    return { elementsImportes, erreurs };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await prisma.synchronisation.update({
      where: { id: synchronisation.id },
      data: { statut: "ECHEC", termineeLe: new Date(), elementsImportes, erreurs: message },
    });
    throw e;
  }
}
