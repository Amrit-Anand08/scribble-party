# Meta Tags Spec (client/index.html `<head>`)

Fill in the deployed URL and a real OG image path once deployed; placeholders marked below.

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

<!-- Primary SEO -->
<title>Scribble Party — Draw & Guess Multiplayer Game</title>
<meta name="description" content="Play a free real-time multiplayer drawing and guessing game with friends. Create a room, take turns drawing, and guess the word to score points." />
<meta name="keywords" content="drawing game, guessing game, multiplayer game, skribbl, pictionary online, real-time canvas game" />
<meta name="author" content="Your Name" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://YOUR-DEPLOYED-URL.onrender.com/" />

<!-- Favicon / app icons -->
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#111827" />

<!-- Open Graph (Facebook, LinkedIn, Discord, WhatsApp previews) -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Scribble Party — Draw & Guess Multiplayer Game" />
<meta property="og:description" content="Create a room, invite friends, and see who can draw and guess the fastest." />
<meta property="og:image" content="https://YOUR-DEPLOYED-URL.onrender.com/og-preview.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="https://YOUR-DEPLOYED-URL.onrender.com/" />
<meta property="og:site_name" content="Scribble Party" />

<!-- Twitter/X card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Scribble Party — Draw & Guess Multiplayer Game" />
<meta name="twitter:description" content="Real-time multiplayer drawing and guessing, right in your browser." />
<meta name="twitter:image" content="https://YOUR-DEPLOYED-URL.onrender.com/og-preview.png" />
```

## Per-page dynamic overrides (React)
For `RoomPage.jsx`, override `document.title` (e.g. `Room ABCD1 — Scribble Party`) on mount so
shared room links show something meaningful in the browser tab, but do NOT rewrite OG tags
per-room for MVP — that requires SSR/prerendering, out of scope for a Vite SPA on Render's
static site hosting.

## Asset checklist for the agent to generate/placeholder
- `favicon.png` (512x512 source, generate standard sizes)
- `apple-touch-icon.png` (180x180)
- `og-preview.png` (1200x630 — a simple branded screenshot/mock is fine for MVP)

## Accessibility-adjacent tags (cheap to include, worth doing)
```html
<meta name="color-scheme" content="dark light" />
<html lang="en">
```
