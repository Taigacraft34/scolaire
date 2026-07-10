-- Idempotent by design: this database does not appear to run migration
-- files inside a single transaction (likely a pooled connection in front of
-- Postgres), so earlier partial attempts at this migration may have already
-- applied some of these statements. Every step below is safe to re-run.

-- Ensure new columns exist
ALTER TABLE "blocs_cours" ADD COLUMN IF NOT EXISTS "chapitreId" TEXT;
ALTER TABLE "blocs_cours" ADD COLUMN IF NOT EXISTS "contenuHtml" TEXT;

-- Backfill chapitreId from the related cours row (only where not already done)
UPDATE "blocs_cours" bc
SET "chapitreId" = c."chapitreId"
FROM "cours" c
WHERE bc."coursId" = c.id AND bc."chapitreId" IS NULL;

UPDATE "blocs_cours" SET "contenuHtml" = "contenuTexte"
WHERE "contenuTexte" IS NOT NULL AND "contenuHtml" IS NULL;

-- Enforce NOT NULL (no-op if already set)
ALTER TABLE "blocs_cours" ALTER COLUMN "chapitreId" SET NOT NULL;

-- Drop old FK constraints if they still exist
ALTER TABLE "blocs_cours" DROP CONSTRAINT IF EXISTS "blocs_cours_coursId_fkey";
ALTER TABLE "controle_cours" DROP CONSTRAINT IF EXISTS "controle_cours_controleId_fkey";
ALTER TABLE "controle_cours" DROP CONSTRAINT IF EXISTS "controle_cours_coursId_fkey";
ALTER TABLE "cours" DROP CONSTRAINT IF EXISTS "cours_chapitreId_fkey";
ALTER TABLE "cours" DROP CONSTRAINT IF EXISTS "cours_utilisateurId_fkey";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_coursId_fkey";

-- Drop old index if it exists
DROP INDEX IF EXISTS "blocs_cours_coursId_ordre_idx";

-- Drop old columns if they exist
ALTER TABLE "blocs_cours" DROP COLUMN IF EXISTS "contenuTexte";
ALTER TABLE "blocs_cours" DROP COLUMN IF EXISTS "coursId";
ALTER TABLE "documents" DROP COLUMN IF EXISTS "coursId";

-- Drop old tables if they exist
DROP TABLE IF EXISTS "controle_cours";
DROP TABLE IF EXISTS "cours";

-- New table
CREATE TABLE IF NOT EXISTS "controle_chapitres" (
    "controleId" TEXT NOT NULL,
    "chapitreId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "controle_chapitres_pkey" PRIMARY KEY ("controleId","chapitreId")
);

-- New index
CREATE INDEX IF NOT EXISTS "blocs_cours_chapitreId_ordre_idx" ON "blocs_cours"("chapitreId", "ordre");

-- New FKs (Postgres has no "ADD CONSTRAINT IF NOT EXISTS", so guard manually)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocs_cours_chapitreId_fkey') THEN
    ALTER TABLE "blocs_cours" ADD CONSTRAINT "blocs_cours_chapitreId_fkey"
      FOREIGN KEY ("chapitreId") REFERENCES "chapitres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'controle_chapitres_controleId_fkey') THEN
    ALTER TABLE "controle_chapitres" ADD CONSTRAINT "controle_chapitres_controleId_fkey"
      FOREIGN KEY ("controleId") REFERENCES "controles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'controle_chapitres_chapitreId_fkey') THEN
    ALTER TABLE "controle_chapitres" ADD CONSTRAINT "controle_chapitres_chapitreId_fkey"
      FOREIGN KEY ("chapitreId") REFERENCES "chapitres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
