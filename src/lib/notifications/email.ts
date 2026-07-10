import nodemailer from "nodemailer";

let transporteur: nodemailer.Transporter | null = null;

function obtenirTransporteur() {
  if (!transporteur) {
    transporteur = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_PORT === "465",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporteur;
}

export async function envoyerEmail(destinataire: string, sujet: string, texte: string): Promise<void> {
  await obtenirTransporteur().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destinataire,
    subject: sujet,
    text: texte,
  });
}
