Diagram Design — ChatGPT-Style Rich Card Visual System
Purpose
A reusable visual specification for producing clean, compact, modern AI/SaaS architecture diagrams and explanatory cards inspired by the green “Emergency Mode” rich-card treatment seen in ChatGPT.
Important: This is a practical reconstruction of the visible visual language. It is not a claim that these are ChatGPT's private/internal production design tokens or proprietary assets. For exact reproduction outside ChatGPT, use the values below as the design specification.
1. Style Name
Recommended name for this system:
Modern AI SaaS / ChatGPT-inspired Rich Card UI
Useful shorthand for future prompts:
Use the Diagram Design rich-card system: Inter-style typography, Lucide-style outline icons, semantic status colors, rounded surfaces, subtle borders, compact labels, generous spacing, and clean architecture/flow diagrams.
Visual characteristics
Minimal, calm, technical, premium UI
Rounded cards
Thin borders
Small outline icons
Semantic colors
Strong typography hierarchy
Compact labels
Generous whitespace
Simple directional connectors
Very restrained shadows
No unnecessary decoration
2. Typography
Primary font
Preferred:
Inter
Recommended fallback:
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
If Inter is unavailable, use the platform's system UI sans-serif font.
Type scale
Token
Size
Weight
Line height
Typical use
Display
24–28 px
700
1.15
Large title / hero
Heading
17–20 px
700
1.25
Card title
Body
14–16 px
400–500
1.45
Explanation
Body compact
13–14 px
400–500
1.4
Dense explanation
Label
12–13 px
500–600
1.3
Component labels
Caption
11–12 px
400–500
1.3
Metadata/helper text
Micro
10–11 px
500–600
1.2
Tiny status text
Recommended default card
Title:       18 px / 700
Body:        14 px / 400
Label:       12 px / 600
Caption:     11 px / 400
Weight rules
700 → primary message / title
600 → labels / important metadata
500 → secondary emphasis
400 → normal explanatory text
Avoid making every element bold.
Heading rules
Use short sentence-case headings:
Emergency Mode
Universal MCP Gateway
API health
Avoid all-caps headings unless they are a tiny badge/status label.
3. Icon System
Recommended icon family
Lucide Icons
The desired icon language is:
Outline icons
Rounded line caps
Rounded joins
Approximately 2 px stroke
Simple geometry
Few internal details
High legibility at small sizes
Consistent visual weight
Future prompt shorthand
Use:
Lucide-style outline icons
Do not mix the system with unrelated icon families.
Avoid mixing:
Emoji as primary UI icons
Filled Font Awesome icons
Material filled icons
3D icons
Cartoon icons
Random SVG icon packs
4. Exact Icon Mapping for the Reference Style
Concept
Preferred Lucide icon
Default size
User
user
18 px
AI / agent
bot
18 px
API / service
cloud or server
18 px
Database
database
18 px
Fast database / processing
database-zap
18 px
Security
shield-check
18 px
Warning
triangle-alert
16–18 px
Error
circle-x
16–18 px
Success
circle-check
16–18 px
Routing
route
18 px
Network
network
18 px
Connection
plug
18 px
API request
send
18 px
Data flow
arrow-right
16–18 px
Settings
settings
18 px
Search
search
16 px
Cache
database or hard-drive
16–18 px
Logs
scroll-text
16–18 px
Observability
activity
18 px
Configuration
sliders-horizontal
18 px
Authentication
key-round
18 px
Lock
lock
18 px
Documentation
book-open
18 px
Code
code-2
18 px
Terminal
terminal
18 px
GraphQL
braces
18 px
REST/API
globe-2
18 px
Cloud
cloud
18 px
Service
box
18 px
Workflow
workflow
18 px
Retry
refresh-cw
16–18 px
Failure/degraded
circle-alert
16–18 px
Health
heart-pulse
18 px
Most important reference icons
For the Emergency Mode diagram, prioritize:
shield-check
user
bot
cloud
server
 database
 database-zap
route
triangle-alert
arrow-right
circle-check
5. Icon Geometry
Stroke
stroke-width: 2
stroke-linecap: round
stroke-linejoin: round
For very small icons:
stroke-width: 1.75–2
Do not use extremely thin 1 px strokes.
Sizes
Context
Size
Micro status
12 px
Inline metadata
14 px
Compact card
16 px
Normal card
18 px
Prominent node
20–24 px
Hero icon
28–32 px
Default
Use 16–18 px.
This small scale is important. The reference style feels like product UI rather than an infographic because icons stay compact.
6. Color System
The system uses semantic roles instead of arbitrary decorative colors.
Core colors
Primary blue:  #2563EB
Cyan accent:   #06B6D4
Success green: #16A34A
Warning amber: #F59E0B
Error red:     #EF4444
Dark presentation palette
Background:       #050816
Surface:          rgba(255,255,255,0.06)
Elevated surface: rgba(255,255,255,0.09)
Border:           rgba(255,255,255,0.10–0.14)
Primary text:     #FFFFFF
Secondary text:   rgba(255,255,255,0.80)
Muted text:       rgba(255,255,255,0.55)
Light UI palette
Background:        #FFFFFF
Secondary surface: #F8FAFC
Border:            #E2E8F0
Primary text:      #0F172A
Secondary text:    #475569
Muted text:        #64748B
Semantic meanings
Green — success / safe / healthy
#16A34A
Use for:
Healthy
Safe
Active
Available
Verified
Completed
Emergency Mode active
Blue — information / active flow
#2563EB
Use for:
Information
Active data flow
Primary technical concepts
Links/connections
Cyan — technical accent
#06B6D4
Use sparingly for:
AI/network emphasis
Data movement
Technical highlights
Amber — warning
#F59E0B
Use for:
Degraded state
Attention
Caution
Pending
Red — error/danger
#EF4444
Use for:
Failure
Critical issue
Destructive action
Unavailable endpoint
Neutral
#64748B
#94A3B8
#CBD5E1
#E2E8F0
#F8FAFC
Use for ordinary relationships, metadata, borders, and supporting information.
7. Green Emergency Mode Treatment
For the specific green Emergency Mode card:
Status/icon color: #16A34A
Main icon:         shield-check
Icon size:         18 px
Icon stroke:       2 px
Title:             18 px / 700
Body:              14 px / 400
Label:             12 px / 600
Status badge
Font size:      11–12 px
Font weight:    600
Height:         22–24 px
Padding:        4px 8px
Border radius:  9999px
Typical labels:
ACTIVE
SAFE
HEALTHY
READY
Use all-caps only for these small status badges.
8. Card Geometry
Radius
Primary card:  14 px
Small card:    10–12 px
Node:          12 px
Badge/pill:    9999 px
Padding
Large card:    20–24 px
Compact card:  14–16 px
Nested card:   12–14 px
Recommended starting point:
padding: 20px
border-radius: 14px
9. Spacing System
Use a 4 px grid:
4
8
12
16
20
24
32
40
48
Recommended relationships:
Relationship
Spacing
Icon → label
8 px
Title → body
6–8 px
Icon → title
8 px
Card → card
12–16 px
Section → section
20–24 px
Major section
24–32 px
Avoid arbitrary spacing values.
10. Borders and Shadows
Light UI border
border: 1px solid #E2E8F0;
Dark UI border
border: 1px solid rgba(255,255,255,0.10);
The border should be subtle, not dominant.
Light shadow
box-shadow:
  0 1px 2px rgba(15, 23, 42, 0.04),
  0 4px 12px rgba(15, 23, 42, 0.04);
For dark UI, prefer surface contrast and borders over heavy shadows.
11. Architecture Diagram Layout
Preferred layouts:
Top-to-bottom
USER
  ↓
AI / AGENT
  ↓
UNIVERSAL MCP
  ↓
┌──────────┬──────────┬──────────┐
GraphQL    REST      Database
Left-to-right
User → Agent → MCP → APIs
Use one primary direction. Do not mix directions unless required by the architecture.
12. Diagram Nodes
Recommended structure:
┌────────────────────────┐
│  [icon]  API Agent     │
│          Universal MCP │
└────────────────────────┘
Node tokens
Label:       13–14 px / 600
Description: 11–12 px / 400
Icon:        18 px
Padding:     12–16 px
Radius:      12 px
Keep node descriptions to one or two short lines.
13. Connectors and Arrows
Use simple directional connectors.
→
↓
←
↑
Or the Lucide equivalents:
arrow-right
arrow-down
arrow-left
arrow-up
Recommended connector thickness:
1.5–2 px
Semantic connector colors:
gray  → ordinary connection
blue  → active data flow
green → healthy/safe flow
amber → warning/degraded flow
red   → failed/error flow
Avoid oversized decorative arrows.
14. Status Indicators
Use small dots for state.
● Healthy
Recommended dot size:
6–8 px
Status text:
12–13 px
The status dot should generally be smaller than the adjacent icon.
15. Information Hierarchy
Every diagram should answer these questions in order:
What is this?
What is its current state?
What are the major components?
How are the components connected?
What should the viewer pay attention to?
Preferred hierarchy:
Title
  ↓
Status / summary
  ↓
Architecture
  ↓
Supporting details
  ↓
Metadata
16. Emergency Mode Card Recipe
Use this recipe to reproduce the reference structure:
┌──────────────────────────────────────────────┐
│  [shield-check]  Emergency Mode              │
│                                              │
│  One MCP stays online while APIs fail        │
│  independently.                              │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ User → MCP → DuckDB → APIs             │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
│  │ [safe]  │ │ [cache] │ │ [retry]       │  │
│  └─────────┘ └─────────┘ └───────────────┘  │
│                                              │
│  [triangle-alert] If an API fails            │
│    • Keep MCP running                        │
│    • Retry healthy endpoints                 │
│    • Use cached results when possible        │
└──────────────────────────────────────────────┘
Exact starting tokens
Card radius:       14 px
Card padding:      20 px
Title:             18 px / 700
Body:              14 px / 400
Label:             12 px / 600
Caption:           11 px / 400
Primary icon:      18 px
Secondary icon:    14–16 px
Connector:         1.5–2 px
Border:            1 px
Grid gap:          12–16 px
Section gap:       20–24 px
Success:           #16A34A
Warning:           #F59E0B
17. The “Tiny but Clear” Rule
One of the defining qualities of this style is that icons and supporting text remain small.
Default:
Primary icon:  16–18 px
Label:         12–14 px
Description:   11–14 px
Caption:       11–12 px
Do not fill empty space by making icons huge.
Instead increase:
whitespace
padding
separation
hierarchy
This keeps the result looking like professional product UI rather than a poster or infographic.
18. Avoid
Do not use:
Emoji as primary interface icons
3D icons
Cartoon illustrations
Giant 32–64 px icons everywhere
Thick borders
Excessive gradients
Neon glow on every element
Multiple unrelated font families
More than 4–5 semantic accent colors
Heavy shadows
Long paragraphs inside nodes
Decorative shapes with no semantic meaning
Mixed icon families
19. Prompt Template
Use this when generating a diagram:
Create a modern AI SaaS architecture diagram using a ChatGPT-inspired rich-card visual language.
Use Inter-style typography and Lucide-style outline icons.
Typography:
title 18 px / 700
body 14 px / 400
labels 12–13 px / 600
captions 11–12 px / 400
Icons:
Lucide outline style
18 px primary icons
14–16 px secondary icons
2 px rounded stroke
Layout:
rounded cards
14 px radius
16–24 px padding
12–16 px component spacing
clean top-to-bottom or left-to-right flow
1.5–2 px connectors
Colors:
semantic green for success/safe
blue for information/active flow
amber for warnings
red for errors
neutral gray for ordinary connections
Keep everything compact, calm, technical, and highly legible. Avoid decorative gradients, oversized icons, emoji, and excessive shadows.
20. Short Skill Trigger
For repeated use, define this shorthand inside the diagram-design skill:
“Use the Diagram Design rich-card system.”
Interpret it as:
Inter-style typography
+
Lucide-style outline icons
+
14 px rounded cards
+
16–24 px padding
+
4 px spacing grid
+
semantic status colors
+
16–18 px icons
+
1.5–2 px connectors
+
compact information hierarchy
+
minimal AI/SaaS visual language
21. CSS Design Tokens
:root {
  /* Typography */
  --font-ui:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --text-display: 28px;
  --text-heading: 18px;
  --text-body: 14px;
  --text-label: 12px;
  --text-caption: 11px;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-label: 600;
  --weight-heading: 700;

  /* Radius */
  --radius-card: 14px;
  --radius-small: 10px;
  --radius-node: 12px;
  --radius-pill: 9999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;

  /* Brand / semantic */
  --blue: #2563EB;
  --cyan: #06B6D4;
  --green: #16A34A;
  --amber: #F59E0B;
  --red: #EF4444;

  /* Text */
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #64748B;

  /* Surfaces */
  --surface: #FFFFFF;
  --surface-secondary: #F8FAFC;
  --border: #E2E8F0;
}
22. Final Design Principle
The goal is not to make diagrams fancy.
The goal is:
Make complex technical information feel as easy to scan as a polished product UI.
When uncertain, prefer:
less decoration + smaller icons + better spacing + stronger hierarchy.
23. One-Line Specification
ChatGPT-inspired rich-card architecture UI: Inter/system sans typography, Lucide 2 px rounded outline icons at 16–18 px, 14 px rounded cards, 20 px padding, 4 px spacing grid, 1 px subtle borders, restrained shadows, semantic green/blue/amber/red states, compact labels, and clean directional flow.