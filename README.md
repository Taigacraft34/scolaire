# Scolaire

Tableau de bord scolaire personnel connecté à MonBureauNumérique (Scolengo) :
devoirs, contrôles, notes, emploi du temps, cours, rappels. Next.js 16 (App
Router, Turbopack) + Prisma 7 + PostgreSQL + Auth.js (ZITADEL/OIDC).

> Ce fork de Next.js contient des changements non standard — se référer à
> `node_modules/next/dist/docs/` et à `AGENTS.md` avant d'écrire du code.

## Prérequis

- Node.js 20+
- PostgreSQL (une base vide suffit, les migrations créent le schéma)
- Une instance ZITADEL avec une application OIDC configurée (callback :
  `<AUTH_URL>/api/auth/callback/zitadel`)

## Configuration (`.env`)

Copier `.env.example` en `.env` et renseigner chaque variable — le fichier
d'exemple documente comment générer `AUTH_SECRET`, `SCOLENGO_ENCRYPTION_KEY`
et `NOTIFICATIONS_CRON_SECRET`. Résumé :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL |
| `AUTH_SECRET`, `AUTH_URL` | Auth.js (session JWT), URL publique de l'app |
| `ZITADEL_CLIENT_ID`, `ZITADEL_CLIENT_SECRET`, `ZITADEL_ISSUER` | OIDC ZITADEL |
| `ADMIN_EMAIL_INITIAL` | Email whitelisté en `ADMIN` à la première connexion |
| `SCOLENGO_ENCRYPTION_KEY` | Clé AES-256-GCM pour chiffrer le token Scolengo en base |
| `NOTIFICATIONS_CRON_SECRET` | Jeton `Bearer` attendu par les deux routes cron (voir plus bas) |
| `SMTP_HOST/PORT/USER/PASSWORD/FROM` | Envoi des rappels par email |
| `STORAGE_DIR` | Dossier de stockage des fichiers uploadés (défaut : `./storage`) |

## Premier déploiement

```bash
git clone <repo> && cd web
cp .env.example .env   # puis remplir .env

npm install             # postinstall lance `prisma generate`
npx prisma migrate deploy

npm run build
npm start               # sert sur le port 4500 (next start -p 4500)
```

## Mettre à jour un déploiement existant

À chaque fois que le dépôt distant a de nouvelles migrations Prisma (tout
changement dans `prisma/migrations/`), les trois commandes ci-dessous sont
nécessaires — dans cet ordre :

```bash
git pull
npm install              # régénère le client Prisma (postinstall)
npx prisma migrate deploy  # applique les migrations manquantes sur la base
npm run build
```

Puis relancer le processus (`npm start`, ou redémarrer le service/pm2 qui le
supervise).

**Piège fréquent :** `npm run build` échoue avec une erreur TypeScript du
genre *"Object literal may only specify known properties, and 'xxx' does not
exist in type..."* sur un champ Prisma qui existe pourtant dans
`prisma/schema.prisma`. Ça signifie que le client Prisma généré
(`src/generated/prisma`, ignoré par git) est périmé — il date d'avant le
dernier changement de schéma, typiquement parce que `npm install` n'a pas été
relancé après le `git pull` (`package.json` n'a pas changé, donc ça semblait
inutile — mais c'est `npm install` qui déclenche `postinstall` → `prisma
generate`). Lancer `npx prisma generate` à la main règle le problème.

## Tâches planifiées (cron)

Deux routes internes doivent être appelées régulièrement par un cron externe
(aucun cron n'est géré par l'application elle-même) avec le même jeton
`NOTIFICATIONS_CRON_SECRET` :

```bash
# Synchronisation MBN (frequence choisie par chaque utilisateur en reglages)
*/10 * * * * curl -fsS -H "Authorization: Bearer $NOTIFICATIONS_CRON_SECRET" https://votre-domaine/api/synchronisation/verifier

# Envoi des rappels dus
*/10 * * * * curl -fsS -H "Authorization: Bearer $NOTIFICATIONS_CRON_SECRET" https://votre-domaine/api/notifications/verifier
```

## Développement

```bash
npm run dev    # http://localhost:3000, Turbopack
npm run lint
npx tsc --noEmit
```

Pour ouvrir l'app depuis un téléphone sur le réseau local pendant le dev,
adapter la liste `allowedDevOrigins` dans `next.config.ts` à l'adresse IP
affichée par `next dev` (ligne "Network").

## Documentation du projet

- `PRODUCT.md` — périmètre produit, utilisateurs, principes.
- `DESIGN.md` — système de design ("Le Cahier Seyès"), tokens de couleur/typo.
- `AGENTS.md` — particularités de ce fork de Next.js.
