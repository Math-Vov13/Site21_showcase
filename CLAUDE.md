# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server on localhost:4321
pnpm build        # Static build → dist/
pnpm preview      # Serve the dist/ build locally
pnpm astro check  # TypeScript check (errors only surface at build otherwise)

# Add a shadcn component (React, goes to src/components/ui/)
pnpm dlx shadcn@latest add <component>

# Add a React Bits component (registry configured in components.json)
pnpm dlx shadcn@latest add @react-bits/<component>
```

No linter or test suite is configured.

### Toujours valider avec `pnpm astro check`

`pnpm astro check` est le seul garde-fou du projet (pas de linter, pas de tests). **Le lancer systématiquement après toute modification** de `.astro`, `.jsx`/`.tsx` ou des props passées entre composants, et **corriger toutes les erreurs (`0 errors`) avant de considérer le travail terminé.**

- `pnpm build` ne fait pas remonter les mêmes diagnostics de types : une erreur de typage des props peut passer au build mais casser `astro check`. Viser **0 erreur** sur `astro check` **et** un build qui passe.
- Les *warnings* et *hints* (ex. attribut HTML déprécié) ne bloquent pas le build — les corriger quand c'est rapide, mais ils ne sont pas prioritaires sur les `error`.
- **Cause d'erreur la plus fréquente — typage des props `.jsx`** : un composant React non typé importé dans une page `.astro` fait échouer `astro check` si une prop déstructurée n'a pas de valeur par défaut (`style`, `scrollContainerRef`, …) ou si un tableau par défaut est inféré comme `never[]`. Donner une valeur par défaut (`= undefined`, `= null`, `= /** @type {any[]} */ ([])`) à chaque prop optionnelle.

## Environment variables

All social/external links are centralised in `.env.local`. On Vercel, set these in the project dashboard under Environment Variables.

| Variable | Purpose |
|---|---|
| `PUBLIC_DISCORD_INVITE_URL` | Discord invite link |
| `PUBLIC_ROBLOX_GROUP_URL` | Roblox community page |
| `PUBLIC_ROBLOX_GAME_URL` | Direct game link |
| `PUBLIC_TRELLO_URL` | Public dev Trello board |
| `DISCORD_BOT_TOKEN` | Build-time avatar fetch for `credits.astro` (optional) |

The `PUBLIC_` prefix makes variables available at build time in `.astro` files via `import.meta.env.PUBLIC_*`. `DISCORD_BOT_TOKEN` has no `PUBLIC_` prefix — it is only read server-side in the `credits.astro` frontmatter and must never be exposed to the browser.

**`src/data/config.json`** contains the same links as a documentation reference but is **not imported** anywhere in the codebase. The single source of truth is `.env.local`.

## Stack

**Astro 6** (static output, no SSR) + **React 19** (for interactive/WebGL components) + **Tailwind v4** (via `@tailwindcss/vite`, no `tailwind.config.*` file).

Deployment target: Vercel (deployed via `vercel` CLI — no `vercel.json` in this repo). No Docker, no database, no API routes.

Key packages: `gsap` (animations), `three` (WebGL), `motion` (Framer Motion v12 — import from `motion/react`, not `framer-motion`), `radix-ui`.

## Architecture

### File layout

```
src/
  styles/global.css          ← single CSS entry point (all design systems, 2200+ lines)
  layouts/Layout.astro        ← wraps every page: imports global.css, Header, Footer
  data/
    config.json               ← site metadata, social links, game release date (not imported in code)
    credits.json              ← all staff data: founders, team, alumni, staff arrays
  assets/                     ← Vite-processed images (imported in JS/JSX)
  components/
    Header.astro              ← navbar + ALL atmospheric effects (see below)
    Footer.astro              ← 3-column footer
    LightPillar.jsx           ← Three.js WebGL effect, hero index (+ LightPillar.css)
    DotGrid.jsx               ← GSAP interactive dot grid, /jeu dept section bg (+ DotGrid.css)
    Noise.jsx                 ← canvas grain overlay, required in every page-hero-img-bg (+ Noise.css)
    MagicBento.jsx            ← GSAP animated member cards, /credits (+ MagicBento.css)
    ScreenshotCarousel.jsx    ← React carousel for game screenshots, no props (client:load)
    ScrollVelocity.jsx        ← motion/react marquee (+ ScrollVelocity.css)
    ui/                       ← shadcn React components (added via CLI)
  pages/
    index.astro               ← full home page
    jeu|developpement|communaute|credits.astro  ← inner pages
    404.astro
  lib/utils.ts                ← shadcn cn() helper
public/
  logos/                      ← brand assets served at /logos/*
  screenshots/                ← game screenshots served at /screenshots/*
```

**Images rule:** static assets referenced by CSS `url()` or HTML `src` go in `public/` (served at `/path`). Assets imported via JS `import` go in `src/assets/` (Vite-processed, fingerprinted). `ScreenshotCarousel.jsx` uses `/screenshots/` public paths.

### CSS architecture — three layered systems in `global.css`

`global.css` is one large file with three stacked design systems. Import order matters:

1. **Tailwind v4 + shadcn** — `@import "tailwindcss"` + `@import "shadcn/tailwind.css"` + `@theme {}` with unified tokens. shadcn's `:root` is overridden immediately after with dark-mode values so the site is dark-first without a `.dark` class on `<html>`.

2. **LandingPage system** (CSS classes, no Tailwind) — `.container`, `.section-tag`, `.section-title`, `.page-hero`, `.page-hero-img-bg`, `.page-section`, `.section-header-row`, `.btn-secondary`, `.about-card`, `.roadmap-v2-*`, `.sc-carousel-*`, etc. Used by all inner pages. The `/jeu` page adds: `.lore-*` (narrative prose — `.lore-block`, `.lore-lead`, `.lore-prose`, `.lore-quote`, `.lore-rules`/`.lore-rule-term`), `.dept-grid`/`.dept-card`/`.dept-logo` (cartes de **départements** — internes à la Fondation — avec logo ou initiales en placeholder ; couleur d'accent par carte via la variable inline `--dept-color`), and `.da-layout` (2-col Direction-Artistique + carousel, collapses < 860px). **Vocabulaire :** parler de **départements** (entités internes : O5, DS&E, DJI, ASIA…) et de **groupes affiliés** (entités externes alliées ou hostiles : MS, IC…). Ne pas employer le terme « faction ».

3. **HomeSite system** (CSS classes, no Tailwind) — `.scp-nav`, `.hs-hero`, `.scp-card`, `.class-banner`, `.news-card`, `.alert-banner`, `.scp-footer`, `.footer-grid`, etc. Used by Header.astro, index.astro, Footer.astro.

**Custom properties** that drive both non-Tailwind systems live in `:root` (not `@theme`): `--red-primary`, `--bg-void`, `--bg-surface`, `--font-header`, `--font-body`, `--ease-scp`, `--s-*` spacing scale.

**Tailwind `@theme` tokens** (usable as Tailwind classes, e.g. `bg-scp-red`, `text-lp-muted`): `--color-scp-*` (black, dark, surface, surface-2, border, red, green, cyan, amber, blue, orange, purple…) and `--color-lp-*` (bg, card, red, green, text, muted, border). Font utilities: `--font-mono` (Share Tech Mono), `--font-vt323` (VT323), `--font-sans` (Inter).

**Loaded Google Fonts:** Rajdhani (400–700), Share Tech Mono, Roboto, VT323, Inter — plus `@fontsource-variable/geist` (self-hosted).

**When adding CSS:** put it in `global.css` at the end of the relevant system. Each component that ships its own CSS (`MagicBento.css`, `LightPillar.css`, etc.) is scoped to that component — import it from the JSX file.

**shadcn style:** `radix-nova` (set in `components.json`). Components use `cssVariables: true`, `iconLibrary: lucide`.

### React component hydration

- **`client:only="react"`** — browser-only APIs at mount time (GSAP, Three.js, WebGL). Renders nothing during static build. Example: `LightPillar.jsx`, `MagicBento.jsx`.
- **`client:load`** — interactive components that should hydrate immediately. Example: `ScreenshotCarousel.jsx`.
- **`client:idle`** — interactive components that can wait. Example: `ScrollVelocity.jsx`.
- **No directive** — purely static React (HTML only, no interactivity).

Props passed to `client:only` components are serialized to JSON at build time — only JSON-serializable values (strings, numbers, booleans, plain objects, arrays) can be passed.

### MagicBento — animated member card grid

`MagicBento.jsx` + `MagicBento.css` implement the credits page card grid with GSAP-powered particles, a global spotlight, border glow, tilt, and magnetism effects.

**Props:**
```jsx
<MagicBento
  cards={[{ id, username, initials, avatarUrl, role, clearance, color, tags, desc, since, isAlumni }]}
  variant="founders|default|alumni|staff"   // controls grid minmax
  glowColor="220, 220, 220"                 // RGB string for particles + spotlight
  enableStars={true}
  enableSpotlight={true}
  enableBorderGlow={true}
  enableMagnetism={true}
  clickEffect={true}
  particleCount={10}
/>
```

Per-card color theming uses `--mc` CSS variable (set via `style={{ '--mc': card.color }}`). The border glow uses `--glow-color` set on the grid container. All animations are disabled on mobile (`<= 768px`).

### LightPillar — Three.js WebGL hero effect

Key configurable props (all have defaults):
```jsx
<LightPillar
  topColor="#5227FF"
  bottomColor="#FF9FFC"
  intensity={1.0}
  rotationSpeed={0.3}
  interactive={false}
  glowAmount={0.005}
  pillarWidth={3.0}
  pillarHeight={0.4}
  noiseIntensity={0.5}
  mixBlendMode="screen"
  quality="high"         // "low" reduces GPU load
/>
```

### Credits data — `src/data/credits.json`

Source of truth for all member data. Four arrays: `founders`, `team`, `alumni`, `staff`.

Each member object: `{ id, username, discordId, avatar, initials, role, clearance?, color, tags?, desc?, since }`.

`avatar` field: direct CDN URL (`https://cdn.discordapp.com/avatars/{id}/{hash}.png?size=128`) → set this to skip the build-time Discord API fetch. Leave empty string `""` to fetch via bot token.

**Discord avatar priority in `credits.astro`:**
1. `m.avatar` (direct URL in JSON)
2. Discord API fetch via `DISCORD_BOT_TOKEN` env var (build time, `https://discord.com/api/v10/users/{id}`)
3. `null` → initials fallback rendered in JSX

**Ajouter une photo de profil Discord — procédure**

Quand on dispose d'un lien proxy Discord (format `images-ext-1.discordapp.net`), extraire l'URL CDN directe.

Règles d'extraction :
- Supprimer le préfixe `https://images-ext-1.discordapp.net/external/<HASH>/%3Fsize%3D128/https/`
- Supprimer les paramètres `?format=webp&quality=lossless&width=...&height=...`
- Ajouter `?size=128` en fin d'URL
- GIF animé → garder l'extension `.gif` (ex: `a_7082bb2d259e426939e0d34314cd06e9.gif?size=128`)
- Avatar de guilde → le path `/guilds/{guild_id}/users/{user_id}/avatars/{hash}` est déjà un CDN direct, conserver tel quel avec `?size=128`

### Header.astro — all atmospheric effects are here

Renders and scripts everything outside `<main>`:
- `#page-transition` — full-screen fade overlay between navigations
- `#scp-hud` — fixed corner HUD with live clock
- `.scanlines-overlay` + `.crt-vignette` — CSS-only CRT effects
- `.scp-nav` — sticky navbar with glass scroll effect, hamburger, active link detection
- `.nav-social` — Discord + Roblox icon links (right of nav links, hidden on mobile `≤ 900px`)

**Navbar heights:** `88px` idle → `72px` scrolled (transition at `scrollY > 50`). Both values appear in three places that must stay in sync: the CSS `.scp-nav { height }`, the JS `navEl.style.height` assignment, and the mobile media query `top:` on `.nav-links`.

Inline `<script>` handles: navbar glass/shrink, hamburger, page transitions, HUD clock, glitch JS class, redacted hover, ambient flicker, IntersectionObserver scroll-reveal, counter animation, news card toggle.

Add `data-glitch="text"` to activate glitch on any element. Add class `redacted` for redacted hover-reveal.

**TypeScript note:** DOM queries return `T | null`. After a null guard, reassign to a typed alias before using inside closures — TypeScript does not narrow through inner functions.

### Inner pages pattern

Hero **sans** image de fond :
```astro
<section class="page-hero">
  <div class="page-hero-bg"></div>
  <div class="container page-hero-content">
    <span class="section-tag">// Label</span>
    <h1 class="page-hero-title">Title <span class="page-hero-highlight"> accent</span></h1>
    <p class="page-hero-desc">…</p>
  </div>
</section>
```

Hero **avec** image de fond — toujours cette structure (wrapper extérieur, `page-hero-img-bg` hors du `overflow:hidden` de `page-hero`) :
```astro
---
import Noise from '../components/Noise.jsx';
---
<div style="position:relative">
  <div
    class="page-hero-img-bg"
    style="background-image:url('/screenshots/mon-image.png');opacity:0.22;overflow:hidden;bottom:-48px"
  >
    <Noise client:only="react" patternAlpha={60} patternRefreshInterval={2} />
  </div>
  <section class="page-hero">
    <div class="page-hero-bg"></div>
    <div class="container page-hero-content">…</div>
  </section>
</div>
```

**Règle :** toute `page-hero-img-bg` doit contenir `<Noise client:only="react" patternAlpha={60} patternRefreshInterval={2} />`. Images statiques dans `public/screenshots/`.

Sections :
```astro
<section class="page-section [page-section--alt|page-section--gradient]">
  <div class="container">
    <div class="section-header-row">
      <span class="section-tag">// Tag</span>
      <h2 class="section-title">…</h2>
    </div>
  </div>
</section>
```

`page-section--alt` = slight white tint. `page-section--gradient` = red gradient.

### Roadmap V2 (7 phases, showcase-style)

`.roadmap-v2` is the active roadmap system. Each `.roadmap-v2-item` sets three CSS custom properties inline:

```html
<div class="roadmap-v2-item" style="--phase-color:#4ade80;--phase-bg:rgba(74,222,128,0.06);--phase-border:rgba(74,222,128,0.25)">
```

Status colour presets: done `#4ade80` · active `#22d3ee` · upcoming `#6b7280` · recruiting `#f97316`.

### Recrutements (dernière section de `/developpement`)

Dernière `<section class="page-section page-section--gradient">` de `developpement.astro`, juste avant `</Layout>`. Une `.recruit-grid` (auto-fit `minmax(300px,1fr)`) avec deux `.recruit-card` : **Développeurs** (candidature spontanée, accent cyan `#22d3ee`) et **Alpha testeurs** (places limitées, accent orange `#f97316`). Chaque carte définit sa couleur d'accent inline via `style="--rc:…"`.

**CTA — état actuel :** les liens de formulaire n'existent pas encore. Les CTA sont des `<button type="button" class="recruit-btn" disabled aria-disabled="true">`. Quand une URL de formulaire est fournie, remplacer le `<button>` par `<a href="…" class="recruit-btn" target="_blank" rel="noopener noreferrer">` (sans `disabled`). Styles `.recruit-*` dans `global.css`, juste avant `.dev-roster`.

### Path alias

`@/` maps to `src/` (configured in `tsconfig.json`).

## Reference repositories

Sibling repos at `../` are the design and content sources. Data is hardcoded in page files, not JSON (except credits).

---

### `../site21-showcase` — v1 showcase (Next.js 14, Pages Router)

Primary reference for **content structure and data**.

| Page | Source |
|---|---|
| `/developpement` | `src/pages/developpement.tsx` + `src/components/sections/DevSection.tsx` — team cards, roadmap items |
| `/credits` | `src/pages/credits.tsx` + `src/components/sections/CreditsSection.tsx` — dev grid, staff list, donor tiers |
| `/jeu` | `src/components/sections/GamePresentation.tsx` — cartes de départements, features list, SCP intro |
| `/communaute` | `src/components/sections/CommunityPresentation.tsx` — community values, affiliated groups |

---

### `../LandingPage` — LandingPage (React + Vite, Radix/Tailwind)

Primary reference for **roadmap** and **community** sections.

| Page | Source |
|---|---|
| `/developpement` roadmap | `../site21-showcase/src/components/sections/RoadmapSection.tsx` — 7 phases, 4 statuts, milestones |
| `/communaute` | `src/pages/GroupsPage.tsx` — `.gi-card` Groups of Interest; `src/components/Rules.tsx` — RP rules |
| `/credits` donor tiers | `src/pages/CreditsPage.tsx` — `.donor-tier` with perk checklist, Hall of Fame |
| `/jeu` org chart | `src/pages/OrgChartPage.tsx` — `.dept-column` + `.role-chain` + `.role-card` hierarchy |

**CSS not yet in `global.css`**: `.gi-card`, `.donor-tier`, `.dept-column`, `.role-chain`, `.role-card`. Port from `src/index.css` when implementing those sections.

**Discord widget**: `src/pages/CreditsPage.tsx` uses an iframe widget — ready to embed in `/communaute`.

---

### `../HomeSite` — HomeSite (vanilla HTML/CSS/JS)

Primary reference for **atmosphere**, **animations**, and components not yet ported.

| File | What it provides |
|---|---|
| `css/components.css` | `.staff-card` hex avatar, `.dev-timeline`, `.kanban-board`, `.donation-tier`, `.badge-clearance-*`, `.value-card`, `.feature-card`, `.news-filters` + `.filter-btn` |
| `css/animations.css` | All `@keyframes`: `glitch-*`, `scanline`, `flicker`, `ticker-scroll`, `alert-stripe`, `radar-ping`, etc. |
| `css/main.css` | Full `:root` token reference |

**Not yet ported to `global.css`**: `.dev-timeline`, `.kanban-board`, `.badge-clearance-*`, `.news-filters` + `.filter-btn`, `.donation-tiers`, `.value-card`, `.feature-card`.
