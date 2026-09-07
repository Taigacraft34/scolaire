-- DropForeignKey
ALTER TABLE "creneaux_edt" DROP CONSTRAINT "creneaux_edt_emploiDuTempsId_fkey";
ALTER TABLE "emplois_du_temps" DROP CONSTRAINT "emplois_du_temps_gerePar_fkey";
ALTER TABLE "emplois_du_temps" DROP CONSTRAINT "emplois_du_temps_utilisateurId_fkey";

-- DropTable
DROP TABLE "creneaux_edt";
DROP TABLE "emplois_du_temps";

-- DropEnum
DROP TYPE "JourSemaine";
DROP TYPE "TypeSemaineCreneau";

-- CreateTable
CREATE TABLE "seances_emploi_du_temps" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "debut" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "matiere" TEXT NOT NULL,
    "titre" TEXT,
    "salle" TEXT,
    "enseignant" TEXT,
    "couleur" TEXT,
    "annule" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seances_emploi_du_temps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seances_emploi_du_temps_utilisateurId_debut_idx" ON "seances_emploi_du_temps"("utilisateurId", "debut");

-- CreateIndex
CREATE UNIQUE INDEX "seances_emploi_du_temps_utilisateurId_externalId_key" ON "seances_emploi_du_temps"("utilisateurId", "externalId");

-- AddForeignKey
ALTER TABLE "seances_emploi_du_temps" ADD CONSTRAINT "seances_emploi_du_temps_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
