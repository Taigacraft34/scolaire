-- CreateTable
CREATE TABLE "rappels" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "matiereId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "jours" INTEGER[],
    "heure" TEXT NOT NULL DEFAULT '07:00',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dernierEnvoiJour" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rappels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rappels_utilisateurId_idx" ON "rappels"("utilisateurId");

-- AddForeignKey
ALTER TABLE "rappels" ADD CONSTRAINT "rappels_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappels" ADD CONSTRAINT "rappels_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
