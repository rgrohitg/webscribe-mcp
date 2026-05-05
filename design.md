# DESIGN.md — Orbital Design System

> Single source of truth for Orbital's visual language.
> Inspired by one.com's modern hosting aesthetic: warm coral primary on white canvas, deep ink type, friendly rounded cards, generous space, soft layered depth.
>
> **Read this file before touching any UI code.** Every color, spacing value, radius, and component below is a token. Reference tokens by name (`{color.primary}`, `{radius.card}`) — never hardcode hex codes inline.

---

## 0. Atmosphere

Orbital reads as a **friendly, confident product surface** — not a developer tool dashboard.
- White / warm-cream canvas, never dark
- One vivid coral as primary brand voltage, on near-black ink type
- Soft layered depth (subtle drop shadows + cream/peach surface tints) rather than flat or aggressive
- Generous whitespace (96px between sections, 32px card padding)
- Friendly geometric sans (Inter / Plus Jakarta Sans), Regular and Medium weights only — no Bold display
- Rounded corners (10–18px) feel approachable without being cartoony
- Color tells a story: coral = primary action, navy = trust, peach/cream = warmth, mint = success, lavender = product accent

---

## 1. Color Tokens

### Brand
| Token | Hex | Role |
|---|---|---|
| `color.primary` | `#FF5B49` | The coral. Primary CTAs, brand mark dot, key accents. Used sparingly — never decorative |
| `color.primary-hover` | `#E84030` | Coral on hover/press |
| `color.primary-soft` | `#FFE4E0` | Coral wash background — for highlighted feature cards |
| `color.primary-ink` | `#A82418` | Coral text on coral-soft surface |

### Ink (text)
| Token | Hex | Role |
|---|---|---|
| `color.ink` | `#0F172A` | Headlines, h1/h2/h3, primary text |
| `color.body` | `#334155` | Running body copy |
| `color.muted` | `#64748B` | Captions, meta, footer links |
| `color.subtle` | `#94A3B8` | Disabled labels, dividers-as-text |

### Canvas (surface)
| Token | Hex | Role |
|---|---|---|
| `color.canvas` | `#FFFFFF` | Default page surface |
| `color.canvas-warm` | `#FFFAF5` | Warm cream alternate canvas — hero atmosphere |
| `color.surface` | `#F8FAFC` | Card alt surface, IDE side panels |
| `color.surface-strong` | `#F1F5F9` | Selected rows, code editor gutter |
| `color.surface-deep` | `#0F172A` | Signature dark surface — terminal, dark CTA bands |
| `color.surface-deep-elev` | `#1E293B` | Elevated dark — terminal header strip |

### Borders
| Token | Hex | Role |
|---|---|---|
| `color.hairline` | `#E2E8F0` | 1px borders on cards, inputs, dividers |
| `color.hairline-soft` | `#EDF2F7` | Subtle inner dividers |
| `color.hairline-strong` | `#CBD5E1` | Hover-state borders, active inputs |

### Signature Surface Accents
Used as full-bleed card backgrounds — voltage moments, not accents on small elements.
| Token | Hex | Role |
|---|---|---|
| `color.signature-coral` | `#FF5B49` | Featured session card, hero CTA band |
| `color.signature-cream` | `#FFF1E6` | Soft callout cards, tip bands |
| `color.signature-peach` | `#FFD4C2` | Warm secondary callout |
| `color.signature-mint` | `#D1FAE5` | Success states, "completed" surfaces |
| `color.signature-lavender` | `#E0E7FF` | Product feature tints |
| `color.signature-navy` | `#0F172A` | Dark CTA bands, terminal |

### Semantic
| Token | Hex | Role |
|---|---|---|
| `color.success` | `#10B981` | Running status, success toasts |
| `color.warn` | `#F59E0B` | Warnings, attention |
| `color.error` | `#EF4444` | Errors, destructive actions, stop buttons |
| `color.info` | `#3B82F6` | Info badges, focus rings |

### Status (specific to Orbital)
| Token | Hex | Role |
|---|---|---|
| `status.busy` | `#FF5B49` | Session is working — coral pulse |
| `status.idle` | `#10B981` | Session is connected and idle — green |
| `status.stopped` | `#94A3B8` | Session is not running — slate hollow |

---

## 2. Typography Tokens

### Font Families
```
font.sans:    'Inter', 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif
font.mono:    'JetBrains Mono', 'SF Mono', ui-monospace, monospace
```

### Type Scale
| Token | Size | Weight | Line height | Letter spacing | Use |
|---|---|---|---|---|---|
| `text.display` | 56px | 500 | 1.05 | -0.02em | Hero headlines |
| `text.h1` | 40px | 500 | 1.1 | -0.01em | Page headlines |
| `text.h2` | 32px | 500 | 1.15 | -0.01em | Section headlines |
| `text.h3` | 24px | 500 | 1.2 | -0.005em | Card titles, sub-sections |
| `text.h4` | 18px | 500 | 1.3 | 0 | Small headlines |
| `text.body-lg` | 18px | 400 | 1.55 | -0.005em | Hero descriptions, primary body |
| `text.body` | 15px | 400 | 1.55 | 0 | Default body, paragraphs |
| `text.body-sm` | 13px | 400 | 1.5 | 0 | Captions, meta text |
| `text.label` | 12px | 500 | 1.2 | 0.06em uppercase | Section labels, eyebrow text |
| `text.button` | 15px | 500 | 1 | 0 | Button labels |
| `text.button-sm` | 13px | 500 | 1 | 0 | Small button labels |
| `text.code` | 14px | 400 | 1.6 | 0 | Code, monospace UI |
| `text.code-sm` | 12px | 400 | 1.5 | 0 | Path strings, kbd, mono labels |

### Rules
- **Never use weight ≥ 600.** Display weight maxes at 500 (Medium). Emphasis comes from size and color.
- **Eyebrow labels** above headlines use `text.label`: 12px, weight 500, uppercase, 0.06em tracking.
- **Negative tracking** on h1+ display sizes only.
- **Mono** for: file paths, keyboard shortcuts (`<kbd>`), code blocks, port numbers, PIDs, terminal output. Never for body copy.

---

## 3. Spacing Tokens

```
space.0  =  0px
space.1  =  4px      # tight pairs
space.2  =  8px      # default gap
space.3  =  12px     # form spacing
space.4  =  16px     # default card padding (small)
space.5  =  24px     # standard gap, card padding
space.6  =  32px     # card padding (large), section gap
space.7  =  48px     # signature card padding
space.8  =  64px     # generous section gap
space.9  =  96px     # major section rhythm — universal vertical gap between bands
```

**Vertical rhythm rule**: every major editorial section uses `space.9` (96px) top + bottom padding. This is non-negotiable — it's the heartbeat of the layout.

---

## 4. Radius Tokens

```
radius.xs       =  4px    # small inline tags, badges
radius.sm       =  6px    # text inputs, small inline buttons
radius.md       =  10px   # secondary buttons, content cards
radius.card     =  14px   # standard card radius, primary buttons
radius.lg       =  18px   # signature cards, hero containers, modals
radius.xl       =  24px   # large hero panels
radius.pill     =  9999px # pills, avatar, status dots
radius.full     =  50%    # icon circles
```

**Hierarchy rule**: primary CTAs use `radius.card` (14px). Pills (`radius.pill`) are reserved for **filter chips and status pills** — not primary CTAs.

---

## 5. Elevation Tokens

```
elev.0   none                                                       # flat surfaces
elev.1   0 1px 2px rgba(15, 23, 42, 0.04)                          # subtle separation, cards at rest
elev.2   0 4px 12px rgba(15, 23, 42, 0.06)                         # raised cards, dropdowns
elev.3   0 12px 32px rgba(15, 23, 42, 0.10)                        # modals, popovers, command palette
elev.4   0 24px 60px rgba(15, 23, 42, 0.14)                        # hero photography frames, signature cards
elev.coral  0 8px 24px rgba(255, 91, 73, 0.30)                     # primary CTA hover glow — used sparingly
```

---

## 6. Component Specs

### `button-primary`
The signature CTA. Use one per viewport.
- Background: `color.primary`
- Text: `#FFFFFF`
- Type: `text.button`
- Padding: `14px 24px` (min-height 48px)
- Radius: `radius.card` (14px)
- Shadow: `elev.1` rest, `elev.coral` on hover
- Hover: background `color.primary-hover`
- Active: scale(0.98), no other change

### `button-secondary`
Pairs with primary in hero CTA rows.
- Background: `color.canvas`
- Text: `color.ink`
- Border: `1px solid color.hairline`
- Type, padding, radius: same as primary
- Hover: border `color.ink`, no background change

### `button-tertiary` / ghost
For inline actions, "learn more" links.
- Background: transparent
- Text: `color.ink`
- No border
- Padding: `10px 14px`
- Hover: background `color.surface`

### `button-icon`
Square icon-only button (close, dismiss, expand).
- Size: 32×32 minimum (40×40 ideal)
- Background: transparent
- Hover: background `color.surface`
- Radius: `radius.sm`
- **MUST have `aria-label`**

### `card-base`
Default content card.
- Background: `color.canvas`
- Border: `1px solid color.hairline`
- Radius: `radius.card` (14px)
- Padding: `space.6` (32px)
- Shadow: `elev.1` rest, `elev.2` hover
- Transition: `border-color 150ms, box-shadow 150ms, transform 150ms`
- Hover: `transform: translateY(-2px)` + `elev.2`

### `card-signature-coral`
Voltage moment. The featured session, hero CTA card.
- Background: `color.signature-coral`
- Text: `#FFFFFF`, opacity 0.85 for body, full white for headline
- Padding: `space.7` (48px)
- Radius: `radius.lg` (18px)
- Shadow: `elev.4`

### `card-signature-cream`
Soft callout — tips, secondary information.
- Background: `color.signature-cream`
- Text: `color.ink`
- Padding: `space.5` (24px)
- Radius: `radius.card` (14px)
- No shadow

### `card-product`
4-up product grid card (used for "Kickstart your business" type sections).
- Background: `color.canvas`
- Border: `1px solid color.hairline`
- Radius: `radius.card` (14px)
- Padding: `space.5` (24px)
- Shadow: `elev.1` rest, `elev.2` hover
- Icon block at top: 40×40, background `color.signature-{tint}` (rotate per card)

### `pricing-tier`
Tier card in pricing comparison.
- Background: `color.canvas`
- Border: `1px solid color.hairline`
- Radius: `radius.lg` (18px)
- Padding: `space.7` (48px)
- The featured tier: background `color.canvas-warm`, border `color.primary`, badge "Most popular" in `color.primary`

### `text-input`
- Background: `color.canvas`
- Border: `1.5px solid color.hairline`
- Radius: `radius.sm` (6px)
- Padding: `12px 14px`
- Min height: 44px
- Type: `text.body`
- Focus: border `color.info`, ring `0 0 0 3px rgba(59, 130, 246, 0.15)`

### `status-pill`
Inline status indicator.
- Padding: `4px 10px`
- Radius: `radius.pill`
- Background: `{status-color}/10` (e.g. `rgba(255, 91, 73, 0.1)`)
- Border: `1px solid {status-color}/25`
- Text: `text.label` in `{status-color}`
- Dot: 6px circle in `{status-color}` at left

### `kbd`
Keyboard shortcut display.
- Type: `text.code-sm`
- Background: `color.canvas`
- Border: `1px solid color.hairline`
- Radius: `radius.xs`
- Padding: `2px 6px`
- Color: `color.body`

### `command-palette`
- Width: 560px
- Background: `color.canvas`
- Border: `1px solid color.hairline`
- Radius: `radius.lg` (18px)
- Shadow: `elev.4`
- Backdrop: `rgba(15, 23, 42, 0.40)` with `backdrop-filter: blur(8px)`
- Highlighted row: background `color.primary-soft`, left border `2px solid color.primary`

### `terminal` (signature dark surface)
- Background: `color.surface-deep`
- Header strip: `color.surface-deep-elev`
- Text: `#E2E8F0`
- Prompt: `color.primary` (the only surface where coral is used as a foreground)
- Type: `text.code`

### `chat-message-user`
- Background: `color.ink`
- Text: `#FFFFFF`
- Radius: `14px 14px 4px 14px` (asymmetric — corner toward avatar is sharp)
- Padding: `12px 16px`
- Max width: 92%

### `chat-message-claude`
- Background: `color.surface`
- Text: `color.body`
- Border: `1px solid color.hairline`
- Radius: `14px 14px 14px 4px` (asymmetric, opposite direction)
- Padding: `12px 16px`
- Max width: 92%

---

## 7. Layout Tokens

### Container widths
```
container.sm   =  640px    # forms, single-column reading
container.md   =  960px    # default editorial body
container.lg   =  1280px   # marketing content max
container.xl   =  1440px   # full IDE
```

### Editorial vertical rhythm
- Hero band: `space.9` (96px) top, `space.9` bottom
- Standard band: same
- Two consecutive bands of the same surface type: NEVER. Always alternate canvas → surface → canvas → signature.

### Grid gutters
- 4-up product grid: 24px gap
- 2-up feature row: 32px gap
- 3-up testimonial row: 24px gap

---

## 8. Motion Tokens

```
motion.fast       =  120ms ease-out      # micro-interactions, hover
motion.base       =  200ms ease-out      # default transitions
motion.smooth     =  300ms cubic-bezier(0.4, 0, 0.2, 1)   # card lifts, modals
motion.entrance   =  400ms cubic-bezier(0.16, 1, 0.3, 1)  # element entrance
```

**Reduced-motion rule**: every animation MUST be wrapped in:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

---

## 9. Accessibility Rules

- **Focus rings**: 2px solid `color.info`, 2px offset, on every focusable element
- **Touch targets**: ≥ 44×44px (min-height 44px on inputs/buttons)
- **Contrast**: 4.5:1 minimum for body text, 3:1 for large text and UI components
- **ARIA**: every icon-only button has `aria-label`. Tabs use `role="tablist"`/`role="tab"`/`aria-selected`. Modals use `role="dialog"`.
- **Keyboard**: every drag handle has a keyboard equivalent (arrow keys ± shift to resize panels). Every modal closes on `Escape`.
- **Semantic HTML**: `<button>` for clicks, `<nav>` for navs, `<main>` for content, headings in order (h1 → h2 → h3, no skipping).

---

## 10. Do's and Don'ts

### Do
- Use **one** primary CTA per viewport.
- Pair primary CTA with secondary outline button — never two primaries side-by-side.
- Use signature surfaces (coral, cream, peach, navy) as **voltage moments** every 2–3 sections, not as constant decoration.
- Keep display type weight ≤ 500.
- Anchor every editorial band with `space.9` (96px) vertical padding.
- Use mono only for paths, kbd, code, ports, PIDs, terminal.

### Don't
- Don't make secondary buttons coral. Coral is the primary action color, not a "fun" color.
- Don't use `radius.pill` for primary CTAs — pills are for filter chips and status indicators.
- Don't bold display type. 500 is the ceiling.
- Don't put two consecutive sections on the same surface — alternate canvas → cream → canvas.
- Don't add gradient washes to the hero. The hero is calm — type and a single primary CTA do all the work.
- Don't introduce additional accent colors beyond the documented signature palette.
- Don't add hover states beyond what each component spec documents — restraint is part of the system.

---

## 11. Iteration Notes for Claude Code

When asked to add a new component:
1. Identify which existing component it's most similar to and inherit its tokens.
2. New colors must be added to Section 1 first, then referenced.
3. Variants of an existing component (`-hover`, `-disabled`, `-loading`) live as separate state specs, never as nested style objects.
4. If unsure about emphasis: bigger type before bolder type, signature surface card before solid accent.
