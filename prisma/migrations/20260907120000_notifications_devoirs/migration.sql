-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_controleId_fkey";

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "controleId" DROP NOT NULL,
ADD COLUMN     "devoirId" TEXT;

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "canauxDevoirParDefaut" "CanalNotification"[] DEFAULT ARRAY['EMAIL', 'MOBILE']::"CanalNotification"[],
ADD COLUMN     "rappelsDevoirParDefaut" "TypeRappel"[] DEFAULT ARRAY['J_MOINS_2', 'VEILLE', 'MATIN_MEME']::"TypeRappel"[];

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_controleId_fkey" FOREIGN KEY ("controleId") REFERENCES "controles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_devoirId_fkey" FOREIGN KEY ("devoirId") REFERENCES "devoirs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
