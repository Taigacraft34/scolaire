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
    error: "/connexion/erreur",
  },
  callbacks: {
    // Il n'existe aucun formulaire d'inscription : une authentification ZITADEL
    // reussie ne suffit pas a elle seule a obtenir un compte local. A la
    // premiere connexion, l'email doit avoir ete pre-autorise par un
    // administrateur (table EmailAutorise) ou etre l'admin initial.
    async signIn({ user, profile }) {
      if (!profile?.sub || !user.email) return false;

      const existant = await prisma.utilisateur.findUnique({
        where: { zitadelSub: profile.sub as string },
      });

      if (existant) {
        if (!existant.actif) return false;
        await prisma.utilisateur.update({
          where: { id: existant.id },
          data: { email: user.email, nom: user.name ?? undefined },
        });
        return true;
      }

      if (user.email === process.env.ADMIN_EMAIL_INITIAL) {
        await prisma.utilisateur.create({
          data: {
            zitadelSub: profile.sub as string,
            email: user.email,
            nom: user.name ?? undefined,
            role: "ADMIN",
          },
        });
        return true;
      }

      const autorisation = await prisma.emailAutorise.findUnique({ where: { email: user.email } });
      if (!autorisation) return false;

      await prisma.$transaction([
        prisma.utilisateur.create({
          data: {
            zitadelSub: profile.sub as string,
            email: user.email,
            nom: user.name ?? undefined,
            role: autorisation.role,
          },
        }),
        prisma.emailAutorise.delete({ where: { id: autorisation.id } }),
      ]);

      return true;
    },
    async jwt({ token, profile }) {
      // A la premiere connexion on memorise le "sub" ZITADEL dans le token ;
      // ensuite on relit l'utilisateur en base a chaque requete pour que les
      // changements (role, mode developpeur, desactivation) soient pris en
      // compte sans attendre une reconnexion.
      if (profile?.sub) token.zitadelSub = profile.sub as string;

      const sub = (token.zitadelSub as string | undefined) ?? token.sub;
      if (sub) {
        const utilisateur = await prisma.utilisateur.findUnique({
          where: { zitadelSub: sub },
        });
        if (utilisateur) {
          token.utilisateurId = utilisateur.id;
          token.role = utilisateur.role;
          token.actif = utilisateur.actif;
          token.modeDeveloppeur = utilisateur.modeDeveloppeur;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.utilisateurId) {
        session.user.id = token.utilisateurId as string;
        session.user.role = (token.role as "ADMIN" | "UTILISATEUR" | undefined) ?? "UTILISATEUR";
        session.user.actif = (token.actif as boolean | undefined) ?? true;
        session.user.modeDeveloppeur = (token.modeDeveloppeur as boolean | undefined) ?? false;
      }
      return session;
    },
  },
});
