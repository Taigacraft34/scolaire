import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "UTILISATEUR";
      actif: boolean;
      modeDeveloppeur: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    utilisateurId?: string;
    role?: "ADMIN" | "UTILISATEUR";
    actif?: boolean;
    modeDeveloppeur?: boolean;
  }
}
