import NextAuth from "next-auth";
import ZITADEL from "next-auth/providers/zitadel";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ZITADEL({
      clientId: process.env.ZITADEL_CLIENT_ID,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET,
      issuer: process.env.ZITADEL_ISSUER,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  callbacks: {
    // Il n'existe aucun formulaire d'inscription : ZITADEL est la seule
    // source de verite pour la creation d'un compte. Ici on se contente de
    // refleter localement une identite deja provisionnee par un administrateur.
    async signIn({ user, profile }) {
      if (!profile?.sub || !user.email) return false;

      const existant = await prisma.utilisateur.findUnique({
        where: { zitadelSub: profile.sub as string },
      });

      if (existant && !existant.actif) return false;

      await prisma.utilisateur.upsert({
        where: { zitadelSub: profile.sub as string },
        update: { email: user.email, nom: user.name ?? undefined },
        create: {
          zitadelSub: profile.sub as string,
          email: user.email,
          nom: user.name ?? undefined,
          role: user.email === process.env.ADMIN_EMAIL_INITIAL ? "ADMIN" : "UTILISATEUR",
        },
      });

      return true;
    },
    async jwt({ token, profile }) {
      const sub = (profile?.sub as string | undefined) ?? token.sub;
      if (sub) {
        const utilisateur = await prisma.utilisateur.findUnique({
          where: { zitadelSub: sub },
        });
        if (utilisateur) {
          token.utilisateurId = utilisateur.id;
          token.role = utilisateur.role;
          token.actif = utilisateur.actif;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.utilisateurId) {
        session.user.id = token.utilisateurId as string;
        session.user.role = (token.role as "ADMIN" | "UTILISATEUR" | undefined) ?? "UTILISATEUR";
        session.user.actif = (token.actif as boolean | undefined) ?? true;
      }
      return session;
    },
  },
});
