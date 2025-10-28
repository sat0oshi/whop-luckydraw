# WHOP Lucky Draw

Tirage au sort simple pour communautés **Whop**. Prod-safe, clé serveur, roue colorée.
- Endpoint: `v5/app/memberships?status=active` (pagination incluse)
- Tirage **server-side** (`/api/draw`), roue = cosmétique

## Setup
1. `.env.local` (non commité) :
```
WHOP_API_KEY=whop_live_xxx_ROTATED
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_xxxxxxxxxxxxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxx
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_xxxxxxxxxxxxx
```
2. Local : `npm install` → `npm run dev`
3. Vercel : ajoute les mêmes ENV → Deploy

## Arbo
```
src/
  app/
    api/
      members/route.ts
      draw/route.ts
    components/Wheel.tsx
    globals.css
    layout.tsx
    page.tsx
  lib/whop.ts
next.config.mjs
package.json
tsconfig.json
next-env.d.ts
.env.example
```
