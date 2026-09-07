import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function cle() {
  const brute = process.env.SCOLENGO_ENCRYPTION_KEY;
  if (!brute) throw new Error("SCOLENGO_ENCRYPTION_KEY n'est pas configuree.");
  const buffer = Buffer.from(brute, "base64");
  if (buffer.length !== 32) throw new Error("SCOLENGO_ENCRYPTION_KEY doit faire 32 octets (base64).");
  return buffer;
}

// Format stocke : base64(iv) . base64(authTag) . base64(ciphertext)
export function chiffrer(texteClair: string): string {
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", cle(), iv);
  const chiffre = Buffer.concat([chiffreur.update(texteClair, "utf8"), chiffreur.final()]);
  const tag = chiffreur.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), chiffre.toString("base64")].join(".");
}

export function dechiffrer(valeurChiffree: string): string {
  const [ivB64, tagB64, chiffreB64] = valeurChiffree.split(".");
  if (!ivB64 || !tagB64 || !chiffreB64) throw new Error("Format de valeur chiffrée invalide.");

  const dechiffreur = createDecipheriv("aes-256-gcm", cle(), Buffer.from(ivB64, "base64"));
  dechiffreur.setAuthTag(Buffer.from(tagB64, "base64"));
  const clair = Buffer.concat([dechiffreur.update(Buffer.from(chiffreB64, "base64")), dechiffreur.final()]);
  return clair.toString("utf8");
}
