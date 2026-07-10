-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "canauxParDefaut" "CanalNotification"[] DEFAULT ARRAY['EMAIL', 'MOBILE']::"CanalNotification"[],
ADD COLUMN     "rappelsParDefaut" "TypeRappel"[] DEFAULT ARRAY['J_MOINS_3', 'VEILLE']::"TypeRappel"[];

