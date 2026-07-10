-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'UTILISATEUR');

-- CreateEnum
CREATE TYPE "Provenance" AS ENUM ('MBN', 'MANUEL');

-- CreateEnum
CREATE TYPE "StatutDevoir" AS ENUM ('A_FAIRE', 'TERMINE');

-- CreateEnum
CREATE TYPE "StatutControle" AS ENUM ('A_VENIR', 'PASSE');

-- CreateEnum
CREATE TYPE "TypeControle" AS ENUM ('MANUEL', 'AUTOMATIQUE');

-- CreateEnum
CREATE TYPE "CanalNotification" AS ENUM ('NAVIGATEUR', 'EMAIL', 'MOBILE');

-- CreateEnum
CREATE TYPE "TypeRappel" AS ENUM ('J_MOINS_7', 'J_MOINS_3', 'J_MOINS_2', 'VEILLE', 'MATIN_MEME', 'PERSONNALISE');

-- CreateEnum
CREATE TYPE "FournisseurNotification" AS ENUM ('PUSHOVER', 'NTFY', 'GOTIFY', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutSynchronisation" AS ENUM ('EN_COURS', 'SUCCES', 'ECHEC');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "zitadelSub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT,
    "role" "Role" NOT NULL DEFAULT 'UTILISATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "scolengoTokenChiffre" TEXT,
    "fuseauHoraire" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "motsClesControle" TEXT[] DEFAULT ARRAY['controle', 'controle', 'evaluation', 'evaluation', 'interrogation', 'interro', 'devoir surveille', 'ds', 'examen', 'test', 'quiz']::TEXT[],
    "preferencesAffichage" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapitres" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapitres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoirs" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "enseignant" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "heure" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "StatutDevoir" NOT NULL DEFAULT 'A_FAIRE',
    "provenance" "Provenance" NOT NULL DEFAULT 'MANUEL',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devoirs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controles" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "devoirSourceId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "heure" TEXT,
    "chapitreLibre" TEXT,
    "commentaire" TEXT,
    "statut" "StatutControle" NOT NULL DEFAULT 'A_VENIR',
    "type" "TypeControle" NOT NULL DEFAULT 'MANUEL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "controleId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "noteObtenue" DOUBLE PRECISION NOT NULL,
    "noteMaximale" DOUBLE PRECISION NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "moyenneClasse" DOUBLE PRECISION,
    "commentaire" TEXT,
    "provenance" "Provenance" NOT NULL DEFAULT 'MANUEL',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copies" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "commentaire" TEXT,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cours" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "chapitreId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controle_cours" (
    "controleId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controle_cours_pkey" PRIMARY KEY ("controleId","coursId")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "typeMime" TEXT NOT NULL,
    "tailleOctets" INTEGER NOT NULL,
    "cheminStockage" TEXT NOT NULL,
    "devoirId" TEXT,
    "controleId" TEXT,
    "copieId" TEXT,
    "coursId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres_notification" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "fournisseur" "FournisseurNotification" NOT NULL,
    "configuration" JSONB NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parametres_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "controleId" TEXT NOT NULL,
    "type" "TypeRappel" NOT NULL,
    "dateEnvoiPrevue" TIMESTAMP(3) NOT NULL,
    "datePersonnalisee" TIMESTAMP(3),
    "canaux" "CanalNotification"[],
    "envoyee" BOOLEAN NOT NULL DEFAULT false,
    "envoyeeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synchronisations" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "demarreeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "termineeLe" TIMESTAMP(3),
    "statut" "StatutSynchronisation" NOT NULL DEFAULT 'EN_COURS',
    "elementsImportes" INTEGER NOT NULL DEFAULT 0,
    "erreurs" TEXT,

    CONSTRAINT "synchronisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journaux" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT,
    "action" TEXT NOT NULL,
    "entiteType" TEXT,
    "entiteId" TEXT,
    "metadonnees" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journaux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_zitadelSub_key" ON "utilisateurs"("zitadelSub");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "matieres_utilisateurId_nom_key" ON "matieres"("utilisateurId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "chapitres_matiereId_nom_key" ON "chapitres"("matiereId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "controles_devoirSourceId_key" ON "controles"("devoirSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "notes_controleId_key" ON "notes"("controleId");

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapitres" ADD CONSTRAINT "chapitres_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapitres" ADD CONSTRAINT "chapitres_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoirs" ADD CONSTRAINT "devoirs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoirs" ADD CONSTRAINT "devoirs_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_devoirSourceId_fkey" FOREIGN KEY ("devoirSourceId") REFERENCES "devoirs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_controleId_fkey" FOREIGN KEY ("controleId") REFERENCES "controles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copies" ADD CONSTRAINT "copies_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours" ADD CONSTRAINT "cours_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours" ADD CONSTRAINT "cours_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "chapitres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controle_cours" ADD CONSTRAINT "controle_cours_controleId_fkey" FOREIGN KEY ("controleId") REFERENCES "controles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controle_cours" ADD CONSTRAINT "controle_cours_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_devoirId_fkey" FOREIGN KEY ("devoirId") REFERENCES "devoirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_controleId_fkey" FOREIGN KEY ("controleId") REFERENCES "controles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_copieId_fkey" FOREIGN KEY ("copieId") REFERENCES "copies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametres_notification" ADD CONSTRAINT "parametres_notification_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_controleId_fkey" FOREIGN KEY ("controleId") REFERENCES "controles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synchronisations" ADD CONSTRAINT "synchronisations_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journaux" ADD CONSTRAINT "journaux_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
