import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Stockage disque local (hors /public, non accessible directement) : les
// fichiers ne sont servis qu'au travers de la route authentifiee
// /api/documents/[id] qui verifie la propriete avant de les renvoyer.
const DOSSIER_STOCKAGE = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), "storage");

function nettoyerNomFichier(nom: string): string {
  return nom.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150);
}

export async function enregistrerFichier(fichier: File, utilisateurId: string) {
  const dossierUtilisateur = path.join(DOSSIER_STOCKAGE, utilisateurId);
  await mkdir(dossierUtilisateur, { recursive: true });

  const nomUnique = `${randomUUID()}-${nettoyerNomFichier(fichier.name)}`;
  const cheminStockage = path.join(dossierUtilisateur, nomUnique);

  const octets = Buffer.from(await fichier.arrayBuffer());
  await writeFile(cheminStockage, octets);

  return {
    nomFichier: fichier.name,
    typeMime: fichier.type || "application/octet-stream",
    tailleOctets: octets.byteLength,
    cheminStockage,
  };
}

export async function supprimerFichier(cheminStockage: string): Promise<void> {
  try {
    await unlink(cheminStockage);
  } catch {
    // Le fichier est peut-etre deja absent : ce n'est pas bloquant pour la suppression en base.
  }
}
