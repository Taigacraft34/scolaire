import { NextResponse } from "next/server";
import { synchroniserUtilisateursDus } from "@/lib/scolengo/planification";

// Appelee par une tache planifiee externe (crontab), protegee par le meme
// secret partage que /api/notifications/verifier plutot que par une session
// ZITADEL (voir proxy.ts).
export async function GET(request: Request) {
  const secret = process.env.NOTIFICATIONS_CRON_SECRET;
  const autorisation = request.headers.get("authorization");

  if (!secret || autorisation !== `Bearer ${secret}`) {
    return new NextResponse("Non autorise", { status: 401 });
  }

  const resultat = await synchroniserUtilisateursDus();
  return NextResponse.json(resultat);
}
