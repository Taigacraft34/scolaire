import { prisma } from "@/lib/prisma";

export async function trouverOuCreerMatiere(utilisateurId: string, nom: string, externalId?: string) {
  const nomNettoye = nom.trim() || "Matiere inconnue";
  const existante = await prisma.matiere.findFirst({ where: { utilisateurId, nom: nomNettoye } });
  if (existante) return existante;
  return prisma.matiere.create({ data: { utilisateurId, nom: nomNettoye, externalId } });
}
