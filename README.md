# Site 21 RP — Showcase v2

Site vitrine de la communauté **Site 21 RP**, un jeu de roleplay SCP sur Roblox.

**Production :** [scp-site21.fr](https://scp-site21.fr)

## Stack

- **Astro 6** — génération statique, pas de SSR
- **React 19** — composants interactifs et WebGL (`client:only`)
- **Tailwind v4** — via `@tailwindcss/vite`, sans `tailwind.config.*`
- **GSAP** + **Three.js** — animations et effets visuels
- **Framer Motion v12** — marquee/scroll velocity (importer depuis `motion/react`)
- **shadcn** — composants UI (`radix-nova`, registry dans `components.json`)
- Déploiement : **Vercel** (CLI)

## Développement

```bash
pnpm install
pnpm dev        # localhost:4321
pnpm build      # dist/ — génère aussi sitemap-index.xml
pnpm preview    # sert dist/ localement
pnpm astro check  # vérification TypeScript — lancer après chaque modification
```

Copier `.env.local.example` → `.env.local` et renseigner les variables :

| Variable | Exemple |
|---|---|
| `PUBLIC_DISCORD_INVITE_URL` | `https://discord.gg/…` |
| `PUBLIC_ROBLOX_GROUP_URL` | `https://www.roblox.com/communities/…` |
| `PUBLIC_ROBLOX_GAME_URL` | `https://www.roblox.com/games/…` |
| `PUBLIC_TRELLO_URL` | `https://trello.com/b/…` |
| `DISCORD_BOT_TOKEN` | token bot (optionnel — fetch des avatars à la build) |

## Pages

| Route | Description |
|---|---|
| `/` | Accueil — hero WebGL, sections modernes, countdown |
| `/jeu` | Présentation du jeu — départements, SCP, fonctionnalités |
| `/developpement` | Roadmap 7 phases + équipe dev + recrutement |
| `/communaute` | Discord, groupes d'intérêt, règles RP |
| `/credits` | Fondateurs, team, alumni, staff |

## SEO

`Layout.astro` gère automatiquement : canonical URL, Open Graph, Twitter Card, JSON-LD (WebSite + Organization + VideoGame + WebPage), sitemap link, robots meta. Passer `ogImage`, `description`, `keywords` par page. `@astrojs/sitemap` génère `/sitemap-index.xml` à chaque build.

Fichiers statiques : `public/robots.txt` (tous bots autorisés, LLM crawlers explicitement), `public/llms.txt` (résumé du site pour les LLMs, spec llmstxt.org).

## Liens

- Discord : [discord.gg/ArJuw7QUyX](https://discord.gg/ArJuw7QUyX)
- Groupe Roblox : [roblox.com/communities/10628003](https://www.roblox.com/communities/10628003/SCP-Site-21#!/about)
