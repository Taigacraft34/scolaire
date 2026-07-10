-- CreateEnum
CREATE TYPE "FrequenceSynchronisation" AS ENUM ('MANUELLE', 'HORAIRE', 'TOUTES_LES_6H', 'QUOTIDIENNE');

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "frequenceSynchronisation" "FrequenceSynchronisation" NOT NULL DEFAULT 'MANUELLE';

