# DESIGN.md — Orbital Design System

> Single source of truth for Orbital's visual language.
>
> **Philosophy:** warm near-black, almost-monochromatic. Built on warm parchment text on earthy dark canvas, with mist-borders instead of shadows and pill-shaped buttons. Inspired by Warp — restraint through warmth, not flash.
>
> **Read this file before touching any UI code.** Reference tokens by name (`{color.parchment}`, `{radius.pill}`) — never hardcode hex values inline.

---

## 0. Atmosphere

Orbital reads as a **warm, calm, almost-monochromatic surface** — like sitting at a campfire, not staring into a cold blue dashboard.

- Warm near-black canvas. Earthy undertone, never blue-tinted.
- Warm parchment (`#faf9f6`) text. Never pure white. The cream warmth is essential.
- Almost monochromatic warm grays. No bright accent colors anywhere.
- Mist-borders (semi-transparent at 0.18–0.35 alpha) instead of drop shadows.
- Pill-shaped buttons (`{radius.pill}`) — not rectangular CTAs.
- Uppercase labels with wide letter-spacing as editorial categorization signal.
- Weight 400 (Regular) dominant — Medium 500 only for emphasis. **Never Bold.**
- Generous whitespace, 96px section rhythm.
- Negative letter-spacing on display sizes (-2.6px on hero) for compressed type.

---

## 1. Color Tokens

### Canvas
Warm near-black. Build the page on these.
| Token | Hex | Role |
|---|---|---|
| `color.canvas` | `#0a0807` | Page background — earthy near-black, the base atmosphere |
| `color.canvas-elev` | `#13110f` | Slightly raised surface — session cards at rest |
| `color.surface-1` | `#1a1714` | Hover state for raised cards |
| `color.surface-2` | `#211e1a` | Scrollbar thumb, deep surface differentiation |

### Text
Warm parchment family. **Never use pure white.**
| Token | Hex | Role |
|---|---|---|
| `color.parchment` | `#faf9f6` | Headlines, primary text, active state — the cream off-white |
| `color.ash` | `#afaeac` | Body copy, button text, default reading color |
| `color.stone` | `#868584` | Secondary labels, muted descriptions, nav links |
| `color.purple-tint` | `#666469` | Tertiary content, dividers-as-text, line numbers, `›` prompt |

### Interactive Surfaces
| Token | Hex | Role |
|---|---|---|
| `color.earth` | `#353534` | Button backgrounds, send-button fill, dark interactive surfaces |
| `color.charcoal` | `#454545` | Scrollbar hover state |

### Borders — Mist System
Semi-transparent borders. **Never solid grey.** Depth comes from these, not shadows.
| Token | Value | Role |
|---|---|---|
| `color.mist` | `rgba(226, 226, 226, 0.18)` | Default 1px border — cards, inputs, drag handle hover |
| `color.mist-strong` | `rgba(226, 226, 226, 0.35)` | Hover state borders, active emphasis |
| `color.mist-soft` | `rgba(226, 226, 226, 0.08)` | Subtle inner dividers, status bar top |

### Frosted Overlays
| Token | Value | Role |
|---|---|---|
| `color.veil` | `rgba(255, 255, 255, 0.04)` | Active row background, tab hover, subtle surface differentiation |
| `color.veil-strong` | `rgba(255, 255, 255, 0.08)` | Stronger surface highlight (reserved) |

### Subtle Accents
**Used sparingly. The system is deliberately monochromatic.**
| Token | Hex | Role |
|---|---|---|
| `color.ember` | `#c9a47b` | Reserved warm tone for very rare active indicator (used once or twice max) |

### Status (Orbital-specific)
Status uses **fill/hollow + opacity**, not colors. The system is monochromatic.
- **Busy:** filled circle in `{color.parchment}` — full warmth
- **Idle:** filled circle in `{color.ash}` — neutral
- **Stopped:** hollow circle with `1.5px solid {color.stone}` border — empty/dimmed
- Stopped sessions render at **opacity 0.55** — no different color, just dimmed

---

## 2. Typography Tokens

### Font Families
```
font.sans   = 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif
font.mono   = 'Geist Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', monospace
```

Geist is the closest open-source substitute for Matter (geometric, soft). Loaded from Google Fonts.

### Type Scale
| Token | Size | Weight | Line height | Letter spacing | Use |
|---|---|---|---|---|---|
| `text.hero` | 88px | 400 | 1.0 | -2.6px | Welcome screen hero only |
| `text.display` | 36px | 400 | 1.1 | -0.7px | Session card name on welcome |
| `text.h2` | 28px | 400 | 1.2 | -0.5px | Two-up section headlines |
| `text.h3` | 22px | 400 | 1.2 | -0.3px | Sub-section headers (reserved) |
| `text.body-lg` | 20px | 400 | 1.4 | -0.2px | Hero description, primary lede |
| `text.body` | 16px | 400 | 1.5 | -0.16px | Section descriptions, default body |
| `text.body-sm` | 14px | 400 | 1.55 | -0.15px | Card body, chat messages, tab labels |
| `text.body-xs` | 13px | 400 | 1.5 | -0.1px | File tree, MCP descriptions, code |
| `text.label-lg` | 12px | 400 | 1.2 | 2.4px UPPERCASE | Section labels — the editorial signal |
| `text.label` | 11px | 400 | 1.2 | 2.4px UPPERCASE | Status labels, tab labels |
| `text.label-sm` | 10px | 400 | 1.2 | 2.4px UPPERCASE | Smallest uppercase labels (numbers, kbd) |
| `text.code` | 13px | 400 | 1.7 | -0.1px | Code, paths, terminal |
| `text.code-sm` | 12px | 400 | 1.5 | -0.1px | Mono captions, line numbers, ports |
| `text.code-xs` | 11px | 400 | 1.4 | 0 | Footer kbd hints, tiny mono labels |

### Hard Rules
1. **Never use weight ≥ 600.** Display sizes stay at 400. Medium 500 appears only for emphasis on tab labels (`{tab-active}`) and pill buttons. **No Bold anywhere.**
2. **Negative letter-spacing scales with size.** Hero -2.6px, h2 -0.5px, body -0.2px, mono -0.1px. Tightens compressed display type. Body always has ~ -0.1px to -0.2px.
3. **Uppercase labels** use wide tracking (2.4px at 10–12px sizes, 1.6px at 11–13px sizes). This is the magazine-editorial categorization signal — applied to status labels, section headers, kbd hints, day-of-week markers.
4. **Mono** is for: file paths, kbd, code, terminal output, port numbers, PIDs, MCP codes, version strings, timestamps. **Never** for body copy.

---

## 3. Spacing Tokens

```
space.xs       =  8px      # tight pairs, gap between dot + label
space.sm       =  12px     # form spacing, drag handle padding
space.md       =  16px     # default card padding, gap in panels
space.lg       =  24px     # standard gap, sub-section spacing
space.xl       =  32px     # session card padding, header strips
space.xxl      =  48px     # large gaps between content blocks
space.section  =  96px     # major section vertical rhythm — universal
```

### Vertical Rhythm
- Every major editorial band on the welcome screen uses `{space.section}` (96px) top + bottom padding.
- The hero uses `{space.section + 32}px` top to add extra breathing room above the first headline.

---

## 4. Radius Tokens

```
radius.sm    =  4px       # smallest — currently unused, reserved
radius.md    =  6px       # currently unused, reserved
radius.lg    =  8px       # currently unused, reserved
radius.xl    =  12px      # currently unused, reserved
radius.xxl   =  14px      # session cards on welcome, command palette
radius.pill  =  9999px    # ALL buttons, status pills, kbd badges, chat input, MCP "Stop" buttons
```

**Hierarchy rule.** This system is **pill-dominant**:
- Every interactive button is a pill: primary, ghost, MCP start/stop, search command bar, kbd badges, chat-input container, "Add server" button, "All sessions" link.
- The only rectangular surface with radius is the session card (`{radius.xxl}`/14px) and the command palette modal.
- The chat send button is a perfect circle (`border-radius: 50%`, 28×28).

---

## 5. Elevation & Depth

**There are no drop shadows in this system.** Depth comes from:

1. **Mist-borders** — `{color.mist}` at 0.18 alpha gives ghostly containment without weight
2. **Veil overlays** — `{color.veil}` at 0.04 alpha for subtle surface differentiation (active rows, tab hover)
3. **Surface elevation** — `{color.canvas-elev}` (one shade up from canvas) for raised cards
4. **Backdrop blur on modals** — command palette uses `rgba(10,8,7,0.78)` over the canvas (no blur, just dark overlay)

| Level | Treatment | Use |
|---|---|---|
| Flat | No border, no shadow | Page canvas, panel bodies, chat transcript |
| Mist soft | `1px solid {color.mist-soft}` | Inner dividers, status bar top, panel chrome |
| Mist | `1px solid {color.mist}` | Default card border, input border, button border |
| Mist strong | `1px solid {color.mist-strong}` | Hover state, command palette outer border, focused input |
| Veil | `background: {color.veil}` | Active tab, active file row, highlighted command |
| Elevated canvas | `background: {color.canvas-elev}` | Session cards on welcome, command palette body |

**Hover behavior**: borders go from `{color.mist}` → `{color.mist-strong}`, color goes from `{color.stone}` → `{color.parchment}`. **No transform, no shadow lift.**

---

## 6. Component Specs

### `button-pill-primary`
The signature CTA. Used for "Start session", "Detect running", "Open workspace".
- Background: `{color.earth}`
- Text: `{color.ash}`
- Type: 15px / weight 500 / letter-spacing -0.1px (sans)
- Padding: `13px 28px` (small variant: `11px 22px`)
- Min height: 46px (small: 40px)
- Border-radius: `{radius.pill}`
- No border, no shadow
- Transition: `background 200ms, color 200ms`
- Hover: no background change (the system relies on restraint)

### `button-pill-ghost`
Pairs with primary in CTA rows.
- Background: transparent
- Text: `{color.parchment}`
- Type: 15px / weight 500 / letter-spacing -0.1px
- Padding: `13px 18px` (small: `11px 14px`)
- Border-radius: `{radius.pill}` (visual only — no border drawn)
- Used for "Browse workspaces →" alongside primary

### `button-pill-mcp`
Uppercase pill button for Start/Stop on MCP cards.
- Background: transparent
- Border: `1px solid {color.mist}`
- Text: `{color.ash}` (uppercase, 10px, tracking 2.4px)
- Padding: `6px 14px`
- Border-radius: `{radius.pill}`
- Hover: border `{color.mist-strong}`, color `{color.parchment}`

### `button-search-command`
The "Search commands" pill in the IDE top nav.
- Background: transparent
- Border: `1px solid {color.mist}`
- Text: `{color.stone}` (with mono `⌘ K` kbd at right)
- Padding: `6px 14px`
- Border-radius: `{radius.pill}`
- Hover: border `{color.mist-strong}`, color `{color.parchment}`

### `card-session`
The big session cards on the welcome screen.
- Background: `{color.canvas-elev}`
- Border: `1px solid {color.mist}`
- Border-radius: `{radius.xxl}` (14px)
- Padding: `{space.xl}` (32px)
- Layout: 4-column grid → `[number 64px] [content flex] [arrow auto]`
- Hover: border `{color.mist-strong}`, background `{color.surface-1}`
- Stopped sessions: `opacity: 0.55`
- No shadow ever

### `tab-session`
The session tabs in the IDE chrome.
- Padding: `0 18px`
- Min-width: 200px
- Border-right: `1px solid {color.mist-soft}`
- Active: 1px parchment line at the **bottom** (drawn as absolutely positioned `<div>`), background transparent
- Inactive: hover background `{color.veil}`
- Type: 13px sans, color `{color.parchment}` (active) or `{color.stone}` (inactive)
- Number prefix: 10px uppercase label in `{color.parchment}` (active) or `{color.stone}`, tracking 1.6px
- Status dot at 6px

### `tab-panel`
Files / MCP / Stats tabs in left panel.
- Flex 1, height 36px
- Type: 11px / weight 400 / uppercase / tracking 2.4px
- Active: color `{color.parchment}`, 1px parchment border-bottom
- Inactive: color `{color.stone}`, transparent border-bottom
- No background, no shadow

### `tab-file`
File tabs in the editor chrome.
- Padding: `0 16px`
- Border-right: `1px solid {color.mist-soft}`
- Active: background `{color.veil}` (no border accent on file tabs — distinguishes them from session tabs)
- Type: 13px mono, color `{color.parchment}` (active) or `{color.stone}` (inactive)
- Close X button: 14px in `{color.purple-tint}`, hover `{color.parchment}`

### `input-text` (chat input wrapper)
- Border: `1px solid {color.mist}`
- Padding: `10px 16px`
- Border-radius: `{radius.pill}`
- Focus: border `{color.mist-strong}` (no ring, no glow)
- Inner input: 14px, color `{color.parchment}`, no border, transparent background
- Placeholder: lowercase, no period

### `button-send-circular`
The chat send button.
- Size: 28×28px
- Border-radius: 50% (perfect circle)
- Active state: background `{color.earth}`, text `{color.parchment}`
- Disabled: background transparent, text `{color.purple-tint}`
- Loading: 10×10 spinner in current color, 1.5px solid border with transparent top, rotates 0.7s linear

### `command-palette`
- Width: 560px
- Background: `{color.canvas-elev}`
- Border: `1px solid {color.mist-strong}`
- Border-radius: `{radius.xxl}` (14px)
- Backdrop: `rgba(10,8,7,0.78)` — solid dark overlay, no blur
- Header: 18px ⌕ glyph in `{color.stone}`, then 16px input in `{color.parchment}`
- Highlighted row: background `{color.veil}` (no border accent, no left bar)
- Footer: 24px gap, 10px uppercase labels in `{color.stone}`

### `terminal`
The center-bottom panel.
- Background: same `{color.canvas}` as the rest of the IDE — terminal does NOT live on a different surface
- Header strip: 32px tall, `1px solid {color.mist-soft}` bottom border
- Header label: "Terminal" in 11px uppercase, tracking 2.4px, color `{color.parchment}`
- Header meta: "bash · {workspace}" in 11px stone, mono
- Prompt symbol: `›` (single right-angle bracket) in `{color.purple-tint}`, NOT `$`
- Command lines: `{color.parchment}`, mono, 13px
- Output lines: `{color.ash}`, mono, 13px
- Caret: `{color.parchment}`

### `chat-message`
Editorial transcript style. **No bubbles. No bordered containers.**
- Vertical gap between messages: 28px
- Header line: uppercase role label (`YOU` in parchment, `CLAUDE` in stone) + mono timestamp in `{color.purple-tint}`, gap 12px, baseline-aligned
- Body: 14px sans, line-height 1.55, letter-spacing -0.15px
  - User message body: `{color.parchment}`
  - Claude message body: `{color.ash}`
- Streaming caret: 6×14px solid `{color.parchment}` block, blink animation 0.7s step-end infinite

### `status-dot`
Used everywhere status is shown: top nav, tabs, status bar, MCP cards.
- Default size: 7px (range 5–9px depending on context)
- Border-radius: 50%
- Busy: filled `{color.parchment}`
- Idle: filled `{color.ash}`
- Stopped: transparent fill, `1.5px solid {color.stone}` border (hollow)
- No glow, no animation

### `kbd`
Keyboard shortcut display.
- Type: 10–11px uppercase, tracking 1.4–2.4px
- Color: `{color.stone}` (or `{color.parchment}` when inside a focused element)
- Optionally wrapped: `1px solid {color.mist}` border, `{radius.pill}`, padding `3px 10px`
- Examples: `⌘ K`, `↵`, `esc`, `⌘ 1-9`

---

## 7. Layout Tokens

### Container Widths
```
container.welcome  =  1400px max
container.ide      =  100% (fills viewport)
```

### IDE Panel Defaults
| Panel | Default | Min | Max |
|---|---|---|---|
| Left sidebar | 232px | 180px | 360px |
| Right chat | 380px | 280px | 520px |
| Terminal height | 220px | 100px | 420px |

### IDE Chrome Heights
| Element | Height |
|---|---|
| Top nav | 52px |
| Session tabs strip | 40px |
| Editor file tabs | 36px |
| Terminal header | 32px |
| Status bar | 26px |
| Left/right panel tab strip | 36px |
| Chat header | 52px |

### Drag Handles
- Width/height: 4px
- Background: transparent at rest
- Hover: `{color.mist}`
- Cursor: `col-resize` or `row-resize`

---

## 8. Motion Tokens

```
motion.fast    =  100ms ease-out      # micro-interactions, tab hover
motion.base    =  200ms ease-out      # default transitions, button hover, border-color shifts
motion.slow    =  300ms ease-out      # reserved for larger transitions
```

### Reduced Motion
Wrap everything in:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

### Streaming Animations
- Chat caret blink: `blink 0.7s step-end infinite` (opacity 1 → 0)
- Send button spinner: `spin 0.7s linear infinite` (rotate 0 → 360)

---

## 9. Accessibility Rules

- **Focus rings:** `1px solid {color.parchment}`, offset 1–3px depending on element (input: 1px, card: 3px). The parchment ring on dark canvas reads clearly without breaking the warm palette.
- **Touch targets:** ≥ 40px height on pill buttons, 28px on inline icon buttons. (Below WCAG AAA but above the dimmed-state thresholds for desktop developer tools.)
- **Contrast:** Verify `{color.parchment}` on `{color.canvas}` (passes AAA easily, ~16:1) and `{color.ash}` on `{color.canvas}` (passes AA, ~9:1). `{color.stone}` on `{color.canvas}` is borderline — never use it for primary content, only for muted captions.
- **ARIA:** every icon-only button has `aria-label`. Tabs use `role="tablist"` / `role="tab"` / `aria-selected`. Modals use `role="dialog"` with `aria-label`. Listboxes use `role="listbox"` / `role="option"` / `aria-selected`.
- **Keyboard:** every modal closes on `Escape`. Command palette supports `↑↓` navigation and `↵` to run. Sessions switchable via `⌘ 1-9`. Command palette via `⌘ K`.
- **Semantic HTML:** `<button>` for clicks, `<nav>` for navs, `<main>` for content, `<header>` / `<section>` / `<footer>` for layout structure, `<ul>` / `<li>` for lists.

---

## 10. Do's and Don'ts

### Do
- Use warm parchment (`{color.parchment}`) for primary text. Never pure white.
- Build buttons as pills (`{radius.pill}`) — that is the system's button language.
- Use mist-borders (`{color.mist}` family) for containment. No drop shadows, ever.
- Apply weight 400 (Regular) for nearly all text, even headlines. Weight 500 only on pill buttons and active tab labels.
- Use uppercase labels with wide letter-spacing (1.4–2.4px) for categorization signals.
- Apply negative letter-spacing on display sizes (-2.6px hero, -0.5px h2, -0.2px body).
- Trust whitespace as the primary layout tool. 96px section rhythm, no exceptions.
- Use mono for paths, kbd, code, ports, PIDs, terminal, timestamps, MCP codes.
- Render status as fill/hollow shapes (not different colors) — the system is monochromatic.

### Don't
- Don't use pure white (`#ffffff`) for text. Always `{color.parchment}` (`#faf9f6`).
- Don't add drop shadows. Depth lives in mist-borders and surface-elev only.
- Don't add bright accent colors (blue, red, green, coral, indigo). Status uses parchment/ash/stone with fill/hollow distinction.
- Don't use Bold weight (≥ 600) anywhere. Medium (500) is the ceiling and only for emphasis.
- Don't use rectangular CTAs. Buttons are pills. The session card is the only rectangular surface (because it's a content container, not an action).
- Don't use cool blue-tinted dark backgrounds. The warmth (`#0a0807`, not `#0a0a0f`) is essential.
- Don't add gradient washes, glows, or atmospheric effects. The whole system is flat-on-flat with mist.
- Don't bubble chat messages. Messages are editorial transcript: uppercase role label + body, no border, no bg.
- Don't use bright colors for the prompt symbol. Terminal `›` is `{color.purple-tint}`, not green or coral.

---

## 11. Iteration Notes for Claude Code

When asked to add a new component:
1. Identify which existing component it's most similar to and inherit its tokens.
2. New colors **must** be added to Section 1 first, then referenced. Never inline a new hex.
3. Variants of an existing component (`-hover`, `-disabled`, `-loading`) live as separate state specs, not nested style objects.
4. If a new component needs accent color, **stop**. The system is monochromatic by intent. Use fill/hollow + opacity instead.
5. When unsure about emphasis: bigger type before bolder type, mist-strong border before solid color.
6. If you find yourself writing `boxShadow:` — stop. Replace it with a mist-border or surface-elev.
7. If you find yourself writing `borderRadius: 8` or any non-pill radius for a button — stop. Buttons are pills.

---

## 12. Quick Reference Card

```
PALETTE
  Canvas       #0a0807  warm near-black, page floor
  Parchment    #faf9f6  primary text, never pure white
  Ash          #afaeac  body text, button labels
  Stone        #868584  secondary, nav links, muted
  Purple-tint  #666469  tertiary, dividers, prompt
  Earth        #353534  pill button background
  Mist         rgba(226,226,226,0.18)   default border
  Veil         rgba(255,255,255,0.04)   active overlay

TYPE
  Sans   Geist (400 dominant, 500 emphasis only)
  Mono   Geist Mono (paths, kbd, code, terminal)
  Hero   88px / 400 / -2.6px tracking
  Body   14px / 400 / -0.15px
  Label  10–12px / 400 / UPPERCASE / 2.4px tracking

SHAPE
  Buttons        pill (9999px) — universal
  Cards          14px radius
  Inputs         pill
  Send button    50% (perfect circle)
  Status dots    50% (filled or hollow only)

DEPTH
  No shadows. Mist borders + veil overlays + surface-elev only.

RHYTHM
  Section padding 96px top + bottom — non-negotiable.
  Card padding 32px. Gap between cards 16px.
```
