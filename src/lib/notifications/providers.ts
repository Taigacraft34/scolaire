interface MessageNotification {
  titre: string;
  message: string;
}

interface ConfigNtfy {
  topic: string;
  serveur?: string;
}

interface ConfigPushover {
  userKey: string;
  appToken: string;
}

interface ConfigGotify {
  serveur: string;
  token: string;
}

export async function envoyerNtfy(config: ConfigNtfy, notif: MessageNotification): Promise<void> {
  const base = (config.serveur || "https://ntfy.sh").replace(/\/$/, "");
  const reponse = await fetch(`${base}/${config.topic}`, {
    method: "POST",
    headers: { Title: notif.titre },
    body: notif.message,
  });
  if (!reponse.ok) throw new Error(`ntfy a repondu ${reponse.status}`);
}

export async function envoyerPushover(config: ConfigPushover, notif: MessageNotification): Promise<void> {
  const reponse = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: config.appToken,
      user: config.userKey,
      title: notif.titre,
      message: notif.message,
    }),
  });
  if (!reponse.ok) throw new Error(`Pushover a repondu ${reponse.status}`);
}

export async function envoyerGotify(config: ConfigGotify, notif: MessageNotification): Promise<void> {
  const base = config.serveur.replace(/\/$/, "");
  const reponse = await fetch(`${base}/message?token=${encodeURIComponent(config.token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: notif.titre, message: notif.message, priority: 5 }),
  });
  if (!reponse.ok) throw new Error(`Gotify a repondu ${reponse.status}`);
}
