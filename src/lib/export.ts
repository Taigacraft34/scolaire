import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";

export type PorteeExport = "cours" | "sans-cours" | "tout";

type DocumentDisque = {
  nomFichier: string;
  typeMime: string;
  tailleOctets: number;
  cheminStockage: string;
  createdAt: Date;
};

// Les fichiers sont embarques en base64 dans le JSON pour que l'export reste
// un unique fichier portable (pas de librairie zip a ajouter au projet).
async function documentVersJson(document: DocumentDisque) {
  let contenuBase64: string | null = null;
  try {
    contenuBase64 = (await readFile(document.cheminStockage)).toString("base64");
  } catch {
    contenuBase64 = null; // fichier absent du disque, on garde au moins les metadonnees
  }

  return {
    nomFichier: document.nomFichier,
    typeMime: document.typeMime,
    tailleOctets: document.tailleOctets,
    ajouteLe: document.createdAt,
    contenuBase64,
  };
}

export async function construireExport(utilisateurId: string, portee: PorteeExport) {
  const utilisateur = await prisma.utilisateur.findUniqueOrThrow({ where: { id: utilisateurId } });

  const donnees: Record<string, unknown> = {
    genereLe: new Date().toISOString(),
    portee,
    compte: { email: utilisateur.email, nom: utilisateur.nom, fuseauHoraire: utilisateur.fuseauHoraire },
  };

  if (portee === "cours" || portee === "tout") {
    const matieres = await prisma.matiere.findMany({
      where: { utilisateurId },
      include: {
        chapitres: {
          orderBy: { nom: "asc" },
          include: { blocs: { orderBy: { ordre: "asc" }, include: { document: true } } },
        },
      },
      orderBy: { nom: "asc" },
    });

    donnees.cours = await Promise.all(
      matieres.map(async (matiere) => ({
        matiere: matiere.nom,
        couleur: matiere.couleur,
        chapitres: await Promise.all(
          matiere.chapitres.map(async (chapitre) => ({
            nom: chapitre.nom,
            blocs: await Promise.all(
              chapitre.blocs.map(async (bloc) => ({
                type: bloc.type,
                ordre: bloc.ordre,
                contenuHtml: bloc.contenuHtml,
                fichier: bloc.document ? await documentVersJson(bloc.document) : null,
              })),
            ),
          })),
        ),
      })),
    );
  }

  if (portee === "sans-cours" || portee === "tout") {
    const matieres = await prisma.matiere.findMany({ where: { utilisateurId } });
    const nomMatiere = new Map(matieres.map((m) => [m.id, m.nom]));

    const [devoirs, controles, notes] = await Promise.all([
      prisma.devoir.findMany({ where: { utilisateurId }, include: { documents: true } }),
      prisma.controle.findMany({ where: { utilisateurId }, include: { documents: true } }),
      prisma.note.findMany({ where: { utilisateurId }, include: { copies: { include: { documents: true } } } }),
    ]);

    donnees.devoirs = await Promise.all(
      devoirs.map(async (d) => ({
        matiere: nomMatiere.get(d.matiereId) ?? null,
        titre: d.titre,
        description: d.description,
        enseignant: d.enseignant,
        date: d.date,
        heure: d.heure,
        statut: d.statut,
        provenance: d.provenance,
        documents: await Promise.all(d.documents.map(documentVersJson)),
      })),
    );

    donnees.controles = await Promise.all(
      controles.map(async (c) => ({
        matiere: nomMatiere.get(c.matiereId) ?? null,
        date: c.date,
        heure: c.heure,
        chapitreLibre: c.chapitreLibre,
        commentaire: c.commentaire,
        statut: c.statut,
        type: c.type,
        documents: await Promise.all(c.documents.map(documentVersJson)),
      })),
    );

    donnees.notes = await Promise.all(
      notes.map(async (n) => ({
        matiere: nomMatiere.get(n.matiereId) ?? null,
        date: n.date,
        noteObtenue: n.noteObtenue,
        noteMaximale: n.noteMaximale,
        coefficient: n.coefficient,
        moyenneClasse: n.moyenneClasse,
        commentaire: n.commentaire,
        copies: await Promise.all(
          n.copies.map(async (copie) => ({
            commentaire: copie.commentaire,
            ajouteeLe: copie.dateAjout,
            documents: await Promise.all(copie.documents.map(documentVersJson)),
          })),
        ),
      })),
    );
  }

  return donnees;
}
