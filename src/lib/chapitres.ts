import { prisma } from "@/lib/prisma";

export async function trouverOuCreerChapitre(utilisateurId: string, matiereId: string, nom: string) {
  const nomNettoye = nom.trim() || "Chapitre";
  const existant = await prisma.chapitre.findFirst({ where: { matiereId, nom: nomNettoye } });
  if (existant) return existant;
  return prisma.chapitre.create({ data: { utilisateurId, matiereId, nom: nomNettoye } });
}
