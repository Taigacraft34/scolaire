import { NextResponse } from "next/server";
import { traiterNotificationsDues } from "@/lib/notifications/dispatch";

// Appelee par une tache planifiee externe (crontab sur le VPS), protegee par
// un secret partage plutot que par une session ZITADEL (voir proxy.ts).
export async function GET(request: Request) {
  const secret = process.env.NOTIFICATIONS_CRON_SECRET;
  const autorisation = request.headers.get("authorization");

  if (!secret || autorisation !== `Bearer ${secret}`) {
    return new NextResponse("Non autorise", { status: 401 });
  }

  const resultat = await traiterNotificationsDues();
  return NextResponse.json(resultat);
}
