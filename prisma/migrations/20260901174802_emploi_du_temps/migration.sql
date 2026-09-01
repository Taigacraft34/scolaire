-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');

-- CreateEnum
CREATE TYPE "TypeSemaineCreneau" AS ENUM ('CHAQUE_SEMAINE', 'SIP', 'SP', 'S1Q');

-- CreateTable
CREATE TABLE "emplois_du_temps" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT,
    "nomPersonne" TEXT,
    "gerePar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emplois_du_temps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creneaux_edt" (
    "id" TEXT NOT NULL,
    "emploiDuTempsId" TEXT NOT NULL,
    "jour" "JourSemaine" NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "matiere" TEXT NOT NULL,
    "enseignant" TEXT,
    "salle" TEXT,
    "couleur" TEXT,
    "typeSemaine" "TypeSemaineCreneau" NOT NULL DEFAULT 'CHAQUE_SEMAINE',
    "rangS1Q" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creneaux_edt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emplois_du_temps_utilisateurId_key" ON "emplois_du_temps"("utilisateurId");

-- CreateIndex
CREATE INDEX "creneaux_edt_emploiDuTempsId_jour_idx" ON "creneaux_edt"("emploiDuTempsId", "jour");

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_gerePar_fkey" FOREIGN KEY ("gerePar") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creneaux_edt" ADD CONSTRAINT "creneaux_edt_emploiDuTempsId_fkey" FOREIGN KEY ("emploiDuTempsId") REFERENCES "emplois_du_temps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

