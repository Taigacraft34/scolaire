-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "sessionsRevoqueesLe" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "sessions_zitadel_revoquees" (
    "sid" TEXT NOT NULL,
    "revoqueeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_zitadel_revoquees_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "sessions_zitadel_revoquees_revoqueeLe_idx" ON "sessions_zitadel_revoquees"("revoqueeLe");
