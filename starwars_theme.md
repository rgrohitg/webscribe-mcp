# Star Wars Theme — Full Reference

> Opening crawl gold + Imperial deep space + R2-D2 logo  
> Drop these tokens, fonts, and SVGs into any web repo.

---

## 1. Google Fonts

Paste inside `<head>` before any styles.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Titillium+Web:wght@400;600&family=Share+Tech+Mono&display=swap"
  rel="stylesheet"
/>
```

| Font | Weight | Use |
|---|---|---|
| Titillium Web | 400, 600 | Body / UI text — used in official Star Wars sequel trilogy marketing |
| Orbitron | 700 | Display titles, logo wordmark |
| Share Tech Mono | 400 | Code, terminals, monospace |

---

## 2. CSS Custom Properties (Design Tokens)

```css
:root {
  /* ── Backgrounds — deep space ─────────────────────────── */
  --bg:          #000000;   /* true deep space black         */
  --panel:       #060810;   /* dark blue-black panel         */
  --raised:      #0c1220;   /* cards, raised surfaces        */
  --hover:       #101828;   /* hover state                   */
  --active:      #141e2e;   /* selected / active state       */
  --code-bg:     #030508;   /* code editor / terminal bg     */

  /* ── Borders — gold crawl glow ────────────────────────── */
  --border:      rgba(255, 232, 31, 0.12);
  --border-b:    rgba(255, 232, 31, 0.22);
  --border-hov:  rgba(255, 232, 31, 0.45);

  /* ── Text — starship display blue-white ───────────────── */
  --text:        #c8e6f0;   /* primary — Imperial readout    */
  --text-sec:    #7fb3cc;   /* secondary                     */
  --text-muted:  #3d6e85;   /* muted                         */
  --text-dim:    #1a3040;   /* very dim / placeholder        */

  /* ── Primary accent — Star Wars gold ─────────────────── */
  --gold:        #FFE81F;   /* EXACT Star Wars logo gold     */
  --gold-soft:   #f5d44a;   /* softer gold                   */
  --gold-bg:     rgba(255, 232, 31, 0.10);

  /* ── Semantic accents ────────────────────────────────── */
  --terminal:    #39ff14;   /* neon green — targeting computer */
  --holo:        #4FC3F7;   /* R2-D2 holoprojector blue      */
  --file-blue:   #5bc8e8;   /* file / nav blue               */
  --ok:          #39ff14;   /* success                       */
  --warn:        #ff8c00;   /* orange — Rebel Alliance       */
  --danger:      #ff1a1a;   /* Sith red                      */

  /* ── Buttons ─────────────────────────────────────────── */
  --btn-bg:           #0c1220;
  --btn-text:         #7fb3cc;
  --btn-primary-bg:   #FFE81F;
  --btn-primary-text: #000000;

  /* ── Typography ──────────────────────────────────────── */
  --font-ui:      'Titillium Web', sans-serif;
  --font-mono:    'Share Tech Mono', monospace;
  --font-display: 'Orbitron', Georgia, serif;
}
```

---

## 3. Global Reset + Base Styles

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-ui);
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Gold scrollbars */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 232, 31, 0.18) transparent;
}
::-webkit-scrollbar          { width: 6px; height: 6px; }
::-webkit-scrollbar-track    { background: transparent; }
::-webkit-scrollbar-thumb    { background: rgba(255, 232, 31, 0.18); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 232, 31, 0.38); }

/* Hologram scanline overlay — replace #root with your app mount id */
#root::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,            transparent 2px,
    rgba(0, 255, 200, 0.015) 2px, rgba(0, 255, 200, 0.015) 4px
  );
}
```

---

## 4. Utility CSS Classes

```css
/* Surfaces */
.sw-panel  { background: var(--panel);  border: 1px solid var(--border); }
.sw-raised { background: var(--raised); border: 1px solid var(--border-b); }

/* Active sidebar tab — lightsaber glow */
.sw-tab-active {
  border-left: 3px solid var(--gold);
  box-shadow: 3px 0 10px rgba(255, 232, 31, 0.25);
}

/* Text variants */
.sw-gold  { color: var(--gold);     font-family: var(--font-display); letter-spacing: 2px; }
.sw-holo  { color: var(--holo); }
.sw-ok    { color: var(--ok); }
.sw-warn  { color: var(--warn); }
.sw-danger {
  color: var(--danger);
  text-shadow: 0 0 8px rgba(255, 26, 26, 0.6);
}

/* Primary button — gold */
.sw-btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  font-family: var(--font-ui);
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: opacity 0.15s;
}
.sw-btn-primary:hover { opacity: 0.88; }

/* Secondary button */
.sw-btn {
  background: var(--btn-bg);
  color: var(--btn-text);
  border: 1px solid var(--border-b);
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: border-color 0.15s;
}
.sw-btn:hover { border-color: var(--border-hov); }

/* Pill / badge */
.sw-pill {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 50px;
  background: rgba(79, 195, 247, 0.15);
  color: var(--holo);
  border: 1px solid rgba(79, 195, 247, 0.30);
  white-space: nowrap;
}

/* Code block */
.sw-code {
  background: var(--code-bg);
  color: var(--terminal);
  font-family: var(--font-mono);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 12px 16px;
}

/* Input */
.sw-input {
  background: var(--raised);
  color: var(--text);
  border: 1px solid var(--border-b);
  border-radius: 4px;
  padding: 6px 10px;
  font-family: var(--font-ui);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.sw-input:focus { border-color: var(--gold); }
.sw-input::placeholder { color: var(--text-muted); }
```

---

## 5. R2-D2 Logo SVG (20×20)

Plain HTML — no framework needed:

```html
<svg width="20" height="20" viewBox="0 0 20 20" fill="none"
     aria-label="Artoo" role="img">

  <!-- Dome -->
  <path d="M4 9 A6 5 0 0 1 16 9 Z"
        fill="#b0bec5" stroke="#78909c" stroke-width="0.5"/>

  <!-- Holoprojector eye — outer ring -->
  <circle cx="10" cy="6.5" r="2.5"
          fill="#01579b" stroke="#4FC3F7" stroke-width="0.7"/>

  <!-- Holoprojector eye — inner glow -->
  <circle cx="10" cy="6.5" r="1.2"
          fill="#4FC3F7" opacity="0.9"/>

  <!-- Body -->
  <rect x="4" y="9" width="12" height="7" rx="1"
        fill="#cfd8dc" stroke="#78909c" stroke-width="0.5"/>

  <!-- Blue panel stripe -->
  <rect x="6.5" y="11" width="7" height="1.5" rx="0.5"
        fill="#4FC3F7" opacity="0.7"/>

  <!-- Left foot -->
  <rect x="4.5" y="16" width="3" height="3.5" rx="0.5"
        fill="#b0bec5" stroke="#78909c" stroke-width="0.4"/>

  <!-- Right foot -->
  <rect x="12.5" y="16" width="3" height="3.5" rx="0.5"
        fill="#b0bec5" stroke="#78909c" stroke-width="0.4"/>

</svg>
```

With the ARTOO wordmark beside it:

```html
<div style="display:flex; align-items:center; gap:8px;">
  <!-- SVG from above -->
  <span style="
    color: #FFE81F;
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 2px;
  ">ARTOO</span>
</div>
```

---

## 6. TypeScript / JS Token Object

For React / Vue / any JS framework that passes theme objects:

```ts
export const swTheme = {
  // Backgrounds
  bg:          '#000000',
  panel:       '#060810',
  raised:      '#0c1220',
  hover:       '#101828',
  active:      '#141e2e',
  codeBg:      '#030508',

  // Borders
  border:      'rgba(255, 232, 31, 0.12)',
  borderB:     'rgba(255, 232, 31, 0.22)',
  borderHov:   'rgba(255, 232, 31, 0.45)',

  // Text
  text:        '#c8e6f0',
  textSec:     '#7fb3cc',
  textMuted:   '#3d6e85',
  textDim:     '#1a3040',

  // Primary accent
  gold:        '#FFE81F',
  goldSoft:    '#f5d44a',
  goldBg:      'rgba(255, 232, 31, 0.10)',

  // Semantic
  terminal:    '#39ff14',
  holo:        '#4FC3F7',
  fileBlue:    '#5bc8e8',
  ok:          '#39ff14',
  warn:        '#ff8c00',
  danger:      '#ff1a1a',

  // Buttons
  btnBg:           '#0c1220',
  btnText:         '#7fb3cc',
  btnPrimaryBg:    '#FFE81F',
  btnPrimaryText:  '#000000',

  // Fonts
  fontUI:      "'Titillium Web', sans-serif",
  fontMono:    "'Share Tech Mono', monospace",
  fontDisplay: "'Orbitron', Georgia, serif",
} as const;
```

---

## 7. Tailwind Config (if using Tailwind CSS)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        sw: {
          bg:       '#000000',
          panel:    '#060810',
          raised:   '#0c1220',
          gold:     '#FFE81F',
          'gold-soft': '#f5d44a',
          holo:     '#4FC3F7',
          terminal: '#39ff14',
          danger:   '#ff1a1a',
          warn:     '#ff8c00',
          text:     '#c8e6f0',
          'text-sec':   '#7fb3cc',
          'text-muted': '#3d6e85',
        },
      },
      fontFamily: {
        ui:      ['Titillium Web', 'sans-serif'],
        mono:    ['Share Tech Mono', 'monospace'],
        display: ['Orbitron', 'Georgia', 'serif'],
      },
    },
  },
};
```

---

## 8. Color Cheat Sheet

| Token | Hex | Real-world reference |
|---|---|---|
| `--gold` | `#FFE81F` | Exact Star Wars logo / opening crawl text |
| `--text` | `#c8e6f0` | Imperial targeting / Mon Cal bridge displays |
| `--holo` | `#4FC3F7` | R2-D2 holoprojector, Princess Leia hologram |
| `--terminal` | `#39ff14` | Death Star targeting computer |
| `--danger` | `#ff1a1a` | Sith lightsaber |
| `--warn` | `#ff8c00` | Rebel Alliance X-wing orange stripe |
| `--panel` | `#060810` | Millennium Falcon interior walls |
| `--bg` | `#000000` | The void between stars |

---

## 9. Quick Checklist — Porting to a New Repo

- [ ] Add Google Fonts `<link>` to `index.html` / `_document.tsx`
- [ ] Paste CSS custom properties into global stylesheet
- [ ] Add global reset + base body styles
- [ ] Add scrollbar overrides
- [ ] Add `#root::before` scanline overlay (change `#root` to match your mount point)
- [ ] Replace your logo SVG with the R2-D2 SVG above
- [ ] Change logo wordmark text to `ARTOO` in Orbitron, `#FFE81F`, `letter-spacing: 2px`
- [ ] Replace all hardcoded colours with `var(--*)` tokens
- [ ] (Optional) Add Tailwind config extensions if the project uses Tailwind
