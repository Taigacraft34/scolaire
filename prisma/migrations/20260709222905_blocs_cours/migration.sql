-- CreateEnum
CREATE TYPE "TypeBloc" AS ENUM ('TEXTE', 'FICHIER');

-- AlterTable
ALTER TABLE "cours" DROP COLUMN "description";

-- CreateTable
CREATE TABLE "blocs_cours" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "type" "TypeBloc" NOT NULL,
    "ordre" INTEGER NOT NULL,
    "contenuTexte" TEXT,
    "documentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocs_cours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blocs_cours_documentId_key" ON "blocs_cours"("documentId");

-- CreateIndex
CREATE INDEX "blocs_cours_coursId_ordre_idx" ON "blocs_cours"("coursId", "ordre");

-- AddForeignKey
ALTER TABLE "blocs_cours" ADD CONSTRAINT "blocs_cours_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocs_cours" ADD CONSTRAINT "blocs_cours_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

