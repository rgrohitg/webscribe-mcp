import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================================
// ORBITAL — Warp-inspired design system
//
// Atmosphere: warm near-black, warm parchment text, almost-monochromatic.
// No bold weight anywhere (Regular 400 dominant, Medium 500 only for emphasis).
// Uppercase labels with wide tracking as editorial signal.
// Pill-shaped buttons. No bright accent colors. Mist borders, no shadows.
// ============================================================================

// ---------- Tokens ----------------------------------------------------------

const C = {
  // Canvas — warm near-black, never blue-tinted
  canvas:        '#0a0807',
  canvasElev:    '#13110f',
  surface1:      '#1a1714',
  surface2:      '#211e1a',

  // Text — warm parchment, never pure white
  parchment:     '#faf9f6',
  ash:           '#afaeac',
  stone:         '#868584',
  purpleTint:    '#666469',

  // Buttons & dark interactive
  earth:         '#353534',
  charcoal:      '#454545',

  // Borders — semi-transparent, ghostly
  mist:          'rgba(226, 226, 226, 0.18)',
  mistStrong:    'rgba(226, 226, 226, 0.35)',
  mistSoft:      'rgba(226, 226, 226, 0.08)',

  // Frosted overlays
  veil:          'rgba(255, 255, 255, 0.04)',
  veilStrong:    'rgba(255, 255, 255, 0.08)',

  // Subtle warm accents (used very sparingly)
  ember:         '#c9a47b',  // warm tone for active indicator (used once or twice)
};

const R = { sm: 4, md: 6, lg: 8, xl: 12, xxl: 14, pill: 9999 };
const SP = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, section: 96 };

// Geist is the closest open-source substitute to Matter (geometric, soft).
const FONT = `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif`;
const MONO = `'Geist Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', monospace`;

// ---------- Data ------------------------------------------------------------

const IM = "im" + "port";

const TREE_MIGRATION = [
  { id: 1, name: "src", type: "dir", d: 0, par: null, open: true },
  { id: 2, name: "agents", type: "dir", d: 1, par: 1, open: true },
  { id: 3, name: "healer.ts", type: "file", d: 2, par: 2 },
  { id: 4, name: "generator.ts", type: "file", d: 2, par: 2 },
  { id: 5, name: "analyst.ts", type: "file", d: 2, par: 2 },
  { id: 6, name: "components", type: "dir", d: 1, par: 1, open: false },
  { id: 7, name: "Dashboard.tsx", type: "file", d: 2, par: 6 },
  { id: 8, name: "index.ts", type: "file", d: 1, par: 1 },
  { id: 9, name: "tests", type: "dir", d: 0, par: null, open: true },
  { id: 10, name: "batch.spec.ts", type: "file", d: 1, par: 9 },
  { id: 11, name: "orbital.config.json", type: "file", d: 0, par: null },
  { id: 12, name: "package.json", type: "file", d: 0, par: null },
];

const TREE_BATCHPROBE = [
  { id: 1, name: "src", type: "dir", d: 0, par: null, open: true },
  { id: 2, name: "probe.ts", type: "file", d: 1, par: 1 },
  { id: 3, name: "connectors", type: "dir", d: 1, par: 1, open: true },
  { id: 4, name: "s3.ts", type: "file", d: 2, par: 3 },
  { id: 5, name: "databricks.ts", type: "file", d: 2, par: 3 },
  { id: 6, name: "config", type: "dir", d: 0, par: null, open: false },
  { id: 7, name: "package.json", type: "file", d: 0, par: null },
];

const TREE_ANALYST = [
  { id: 1, name: "bot.py", type: "file", d: 0, par: null },
  { id: 2, name: "prompts", type: "dir", d: 0, par: null, open: true },
  { id: 3, name: "system.md", type: "file", d: 1, par: 2 },
  { id: 4, name: "examples.md", type: "file", d: 1, par: 2 },
  { id: 5, name: "data", type: "dir", d: 0, par: null, open: false },
  { id: 6, name: "requirements.txt", type: "file", d: 0, par: null },
];

const CODE_MIGRATION = {
  "healer.ts": `${IM} { Agent } from '../core/Agent';
${IM} { TestResult } from '../types';

export class HealerAgent extends Agent {
  name = 'Healer';

  async process(results: TestResult[]) {
    const failing = results.filter(r => !r.passed);

    for (const test of failing) {
      const fix = await this.claude.complete(test.code);
      await this.applyFix(test.path, fix);
    }

    return this.rerun(failing);
  }
}`,
  "batch.spec.ts": `${IM} { BatchProbe } from '../src';
${IM} { s3, databricks } from '../src/connectors';

describe('Pipeline Regression Suite', () => {
  let probe: BatchProbe;

  beforeAll(async () => {
    probe = new BatchProbe({
      connectors: [s3, databricks],
      threshold: 0.02,
    });
    await probe.connect();
  });

  it('validates S3 output schema', async () => {
    const result = await probe.check('s3://data/output/');
    expect(result.schema).toMatchSnapshot();
  });
});`,
  "orbital.config.json": `{
  "workspace": "~/projects/migration",
  "port": 4242,
  "mcpServers": {
    "filesystem": { "command": "npx", "autoStart": true },
    "qa-agent":   { "command": "node", "autoStart": true },
    "github":     { "command": "npx", "autoStart": false }
  }
}`,
  "package.json": `{
  "name": "migration-project",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "orbital": "npx orbital --workspace ."
  }
}`,
};

const CODE_BATCHPROBE = {
  "probe.ts": `${IM} { Connector } from './connectors';

export class BatchProbe {
  connectors: Connector[];
  threshold: number;

  constructor(opts: { connectors: Connector[], threshold: number }) {
    this.connectors = opts.connectors;
    this.threshold = opts.threshold;
  }

  async connect() {
    await Promise.all(
      this.connectors.map(c => c.connect())
    );
  }
}`,
  "s3.ts": `${IM} { S3Client } from '@aws-sdk/client-s3';

export const s3 = {
  name: 's3',
  async connect() {
    this.client = new S3Client({ region: 'eu-west-1' });
  },
};`,
  "databricks.ts": `// TODO: implement Databricks connector
// Status: STUB`,
};

const CODE_ANALYST = {
  "bot.py": `from anthropic import Anthropic

client = Anthropic()

def analyse(text: str) -> str:
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": text}]
    )
    return response.content[0].text`,
  "system.md": `# Analyst Bot System Prompt

You are a financial data analyst. Given raw data,
produce concise summaries with key trends, numerical
highlights and risk flags.`,
};

const MSGS_MIGRATION = [
  { role: "a", txt: "Connected to ~/projects/migration. 3 MCP servers active, 47 files indexed.", ts: "14:32" },
  { role: "u", txt: "Analyse the healer agent for async issues", ts: "14:33" },
  { role: "a", txt: "Reading src/agents/healer.ts.\n\nFound two issues.\n\nFirst, sequential await in loop — slow for large sets. Use Promise.all with concurrency limit.\n\nSecond, no error boundary — throws abort the loop. Wrap in try/catch.\n\nGenerate fixes?", ts: "14:33" },
];

const MSGS_BATCHPROBE = [
  { role: "a", txt: "Connected to ~/code/batchprobe. 2 MCP servers active, 23 files indexed.", ts: "13:48" },
  { role: "u", txt: "Implement the databricks connector", ts: "14:11" },
  { role: "a", txt: "Reading src/connectors/databricks.ts — currently a stub.\n\nWill implement using @databricks/sql-driver. Connecting now.", ts: "14:11" },
];

const MSGS_ANALYST = [
  { role: "a", txt: "Connected to ~/code/analyst. Session paused 1h ago.", ts: "13:02" },
  { role: "u", txt: "Run the bot on yesterday's earnings data", ts: "13:02" },
  { role: "a", txt: "Done. Output saved to data/q3_summary.md.\n\nKey findings.\n\nRevenue +18% YoY. Operating margin compressed by 2pp. Asia-Pacific outperformed.", ts: "13:03" },
];

const TERM_MIGRATION = [
  { t: "c", v: "npx orbital --workspace ~/projects/migration" },
  { t: "o", v: "" },
  { t: "o", v: "  Orbital v0.4.2" },
  { t: "o", v: "" },
  { t: "o", v: "  filesystem    pid 12847    8 tools" },
  { t: "o", v: "  qa-agent      pid 12901   12 tools" },
  { t: "o", v: "  database      pid 13005    5 tools" },
  { t: "o", v: "  github        — autoStart false" },
  { t: "o", v: "" },
  { t: "o", v: "  Ready  →  http://localhost:4242" },
  { t: "o", v: "" },
  { t: "c", v: "git status" },
  { t: "o", v: "On branch feature/healer-v2" },
  { t: "o", v: "  modified: src/agents/healer.ts" },
];

const TERM_BATCHPROBE = [
  { t: "c", v: "npx orbital --workspace ~/code/batchprobe" },
  { t: "o", v: "" },
  { t: "o", v: "  Orbital v0.4.2" },
  { t: "o", v: "" },
  { t: "o", v: "  filesystem    pid 22104    8 tools" },
  { t: "o", v: "  database      pid 22198    5 tools" },
  { t: "o", v: "" },
  { t: "o", v: "  Ready  →  http://localhost:4243" },
  { t: "o", v: "" },
  { t: "c", v: "npm test" },
  { t: "o", v: "  probe.test.ts        ok" },
  { t: "o", v: "  s3.test.ts           ok" },
  { t: "o", v: "  databricks.test.ts   skipped" },
];

const TERM_ANALYST = [
  { t: "c", v: "npx orbital --workspace ~/code/analyst" },
  { t: "o", v: "" },
  { t: "o", v: "  Orbital v0.4.2" },
  { t: "o", v: "" },
  { t: "o", v: "  session idle since 13:03" },
  { t: "o", v: "" },
  { t: "c", v: "python bot.py" },
  { t: "o", v: "Output written to data/q3_summary.md" },
];

const MCP_MIGRATION = [
  { id: "fs", name: "Filesystem", code: "FS", status: "running", pid: 12847, tools: 8, desc: "File operations" },
  { id: "qa", name: "QA Agent",   code: "QA", status: "running", pid: 12901, tools: 12, desc: "Test gen and healing" },
  { id: "gh", name: "GitHub",     code: "GH", status: "stopped", pid: null,  tools: 6,  desc: "Issues, PRs" },
  { id: "db", name: "Database",   code: "DB", status: "running", pid: 13005, tools: 5,  desc: "SQL plus Databricks" },
];

const MCP_BATCHPROBE = [
  { id: "fs", name: "Filesystem", code: "FS", status: "running", pid: 22104, tools: 8, desc: "File operations" },
  { id: "db", name: "Database",   code: "DB", status: "running", pid: 22198, tools: 5, desc: "SQL plus Databricks" },
];

const MCP_ANALYST = [
  { id: "fs", name: "Filesystem", code: "FS", status: "stopped", pid: null, tools: 8, desc: "File operations" },
];

const SESSIONS_INIT = {
  s1: {
    id: "s1", name: "migration-project", workspace: "~/projects/migration",
    branch: "feature/healer-v2", status: "idle", pid: 87123, port: 4242,
    lastActivity: "2 min ago", activeFile: "healer.ts",
    tabs: ["healer.ts", "batch.spec.ts"], tree: TREE_MIGRATION, code: CODE_MIGRATION,
    msgs: MSGS_MIGRATION, term: TERM_MIGRATION, mcps: MCP_MIGRATION,
  },
  s2: {
    id: "s2", name: "batchprobe", workspace: "~/code/batchprobe",
    branch: "main", status: "busy", pid: 87456, port: 4243,
    lastActivity: "now", activeFile: "probe.ts",
    tabs: ["probe.ts", "s3.ts", "databricks.ts"], tree: TREE_BATCHPROBE, code: CODE_BATCHPROBE,
    msgs: MSGS_BATCHPROBE, term: TERM_BATCHPROBE, mcps: MCP_BATCHPROBE,
  },
  s3: {
    id: "s3", name: "analyst-bot", workspace: "~/code/analyst",
    branch: "develop", status: "stopped", pid: null, port: 4244,
    lastActivity: "1 hour ago", activeFile: "bot.py",
    tabs: ["bot.py", "system.md"], tree: TREE_ANALYST, code: CODE_ANALYST,
    msgs: MSGS_ANALYST, term: TERM_ANALYST, mcps: MCP_ANALYST,
  },
};

const CMDS = [
  { k: "/migrate", label: "Analyse migration progress" },
  { k: "/test",    label: "Run full test suite" },
  { k: "/fix",     label: "Auto-fix failing tests" },
  { k: "/scan",    label: "Scan codebase structure" },
  { k: "/diff",    label: "Git diff summary" },
  { k: "/docs",    label: "Generate documentation" },
];

// ---------- Helpers ---------------------------------------------------------

const nowTs = () => new Date().toTimeString().slice(0, 5);
const pad3 = (n) => String(n).padStart(3, "0");
const statusLabel = (s) => s === "busy" ? "WORKING" : s === "idle" ? "IDLE" : "STOPPED";

function genReply(msg, sessName) {
  const l = msg.toLowerCase();
  if (l.includes("fix") || l.includes("generate"))
    return `Applying fixes.\n\nUsing tool: filesystem.write_file.\n\nFile written. Run /test to verify?`;
  if (l.includes("/test") || l.includes("test"))
    return `Running test suite for ${sessName}.\n\n21 passed. 3 failed. 12.4 seconds.\n\nAuto-heal these?`;
  if (l.includes("/scan") || l.includes("scan"))
    return `Workspace scan: ${sessName}.\n\nFound TypeScript files across modules. MCP servers active.`;
  return `Analysing your request in ${sessName}.\n\nMCP servers ready. What would you like to work on?`;
}

// ---------- Drag hooks ------------------------------------------------------

function useDragH(init, min, max) {
  const [w, setW] = useState(init);
  const ref = useRef(init); ref.current = w;
  const drag = useCallback((e) => {
    e.preventDefault();
    const x0 = e.clientX, w0 = ref.current;
    const mv = (ev) => setW(Math.max(min, Math.min(max, w0 + ev.clientX - x0)));
    const up = () => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  }, [min, max]);
  return [w, drag];
}

function useDragHR(init, min, max) {
  const [w, setW] = useState(init);
  const ref = useRef(init); ref.current = w;
  const drag = useCallback((e) => {
    e.preventDefault();
    const x0 = e.clientX, w0 = ref.current;
    const mv = (ev) => setW(Math.max(min, Math.min(max, w0 + x0 - ev.clientX)));
    const up = () => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  }, [min, max]);
  return [w, drag];
}

function useDragVR(init, min, max) {
  const [h, setH] = useState(init);
  const ref = useRef(init); ref.current = h;
  const drag = useCallback((e) => {
    e.preventDefault();
    const y0 = e.clientY, h0 = ref.current;
    const mv = (ev) => setH(Math.max(min, Math.min(max, h0 + y0 - ev.clientY)));
    const up = () => { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  }, [min, max]);
  return [h, drag];
}

// ---------- Atoms -----------------------------------------------------------

function StatusDot({ status, size = 7 }) {
  // Monochromatic — only opacity & filled/hollow distinguish state
  if (status === "stopped") {
    return <span aria-hidden="true" style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", border: `1.5px solid ${C.stone}`, background: "transparent", flexShrink: 0 }} />;
  }
  return <span aria-hidden="true" style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: status === "busy" ? C.parchment : C.ash, flexShrink: 0 }} />;
}

const upperLabel = (size = 12, color = C.stone) => ({
  fontSize: size,
  fontWeight: 400,
  letterSpacing: size <= 12 ? "2.4px" : "1.4px",
  textTransform: "uppercase",
  color,
  fontFamily: FONT,
});

// ============================================================================
// WELCOME
// ============================================================================

function Welcome({ sessions, onEnter }) {
  const list = Object.values(sessions);
  const activeCount = list.filter((s) => s.status !== "stopped").length;

  return (
    <div style={{ minHeight: "100vh", background: C.canvas, color: C.ash, fontFamily: FONT, overflow: "auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.surface2}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.charcoal}; }
        button:focus-visible, a:focus-visible { outline: 1px solid ${C.parchment}; outline-offset: 3px; border-radius: 2px; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      {/* Top nav */}
      <nav style={{ height: 72, display: "flex", alignItems: "center", padding: "0 32px", position: "sticky", top: 0, background: C.canvas, zIndex: 10, borderBottom: `1px solid ${C.mistSoft}` }}>
        <a href="#" style={{ fontSize: 18, fontWeight: 400, color: C.parchment, textDecoration: "none", letterSpacing: "-0.02em" }}>
          Orbital
        </a>
        <div style={{ display: "flex", gap: 32, marginLeft: 48, fontSize: 14, color: C.stone }}>
          <a href="#" style={{ color: C.stone, textDecoration: "none" }}>Sessions</a>
          <a href="#" style={{ color: C.stone, textDecoration: "none" }}>Servers</a>
          <a href="#" style={{ color: C.stone, textDecoration: "none" }}>Docs</a>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ ...upperLabel(11, C.stone) }}>v0.4.2</span>
      </nav>

      <main>
        {/* HERO */}
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: `${SP.section + 32}px 32px ${SP.section}px` }}>
          <div style={{ ...upperLabel(12, C.stone), marginBottom: 32 }}>
            ◐ &nbsp;Multi-session shell
          </div>
          <h1 style={{ fontSize: 88, fontWeight: 400, lineHeight: 1.0, color: C.parchment, letterSpacing: "-2.6px", marginBottom: 32, fontFamily: FONT }}>
            One surface for<br/>every Claude Code<br/>session you run.
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.4, color: C.ash, letterSpacing: "-0.2px", maxWidth: 580, marginBottom: 48 }}>
            Connect to running sessions across your machine, orchestrate MCP servers, and drive your workspaces from a single surface. Localhost only. No telemetry.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button style={pillBtn("primary")}>Start session</button>
            <button style={pillBtn("ghost")}>Browse workspaces →</button>
          </div>
        </section>

        {/* SESSIONS */}
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: `0 32px ${SP.section}px` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48, paddingBottom: 24, borderBottom: `1px solid ${C.mistSoft}` }}>
            <span style={upperLabel(12, C.parchment)}>Active sessions</span>
            <span style={upperLabel(11, C.stone)}>· {activeCount} running · {list.length - activeCount} stopped</span>
            <div style={{ flex: 1 }} />
            <span style={upperLabel(11, C.stone)}>Press ⌘ 1-9 to jump</span>
          </div>

          {/* Editorial vertical stack — each session a generous card */}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
            {list.map((s, idx) => {
              const stopped = s.status === "stopped";
              const num = pad3(idx + 1);
              const runningMcp = s.mcps.filter((m) => m.status === "running").length;
              const fileCount = s.tree.filter((n) => n.type === "file").length;
              return (
                <li key={s.id}>
                  <button onClick={() => onEnter(s.id)}
                    style={{ width: "100%", textAlign: "left", background: C.canvasElev, border: `1px solid ${C.mist}`, borderRadius: R.xxl, padding: SP.xl, cursor: "pointer", fontFamily: FONT, color: "inherit", transition: "border-color 200ms, background 200ms", opacity: stopped ? 0.55 : 1 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.mistStrong; e.currentTarget.style.background = C.surface1; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.mist; e.currentTarget.style.background = C.canvasElev; }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
                      {/* Number column */}
                      <div style={{ minWidth: 64 }}>
                        <div style={{ ...upperLabel(11, C.stone) }}>{num}</div>
                      </div>

                      {/* Main content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Status label row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                          <StatusDot status={s.status} size={7} />
                          <span style={upperLabel(11, stopped ? C.stone : C.parchment)}>{statusLabel(s.status)}</span>
                          <span style={upperLabel(11, C.stone)}>·</span>
                          <span style={upperLabel(11, C.stone)}>{s.lastActivity.toUpperCase()}</span>
                        </div>

                        {/* Name */}
                        <div style={{ fontSize: 36, fontWeight: 400, color: C.parchment, lineHeight: 1.1, letterSpacing: "-0.7px", marginBottom: 16 }}>
                          {s.name}
                        </div>

                        {/* Workspace path */}
                        <div style={{ fontSize: 16, color: C.stone, marginBottom: 28, fontFamily: MONO, letterSpacing: "-0.2px" }}>
                          {s.workspace}
                        </div>

                        {/* Meta row */}
                        <div style={{ display: "flex", gap: 32, fontSize: 14, color: C.ash, letterSpacing: "-0.1px" }}>
                          <span>{s.branch}</span>
                          <span style={{ color: C.purpleTint }}>·</span>
                          <span>{runningMcp}/{s.mcps.length} mcp servers</span>
                          <span style={{ color: C.purpleTint }}>·</span>
                          <span>{fileCount} files</span>
                          <span style={{ color: C.purpleTint }}>·</span>
                          <span style={{ fontFamily: MONO, fontSize: 13 }}>:{s.port}</span>
                        </div>
                      </div>

                      {/* Right: enter affordance */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 22, color: C.stone, transition: "color 200ms" }}>→</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* DIVIDER */}
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: `0 32px ${SP.section}px` }}>
          <div style={{ borderTop: `1px solid ${C.mistSoft}`, paddingTop: SP.xxl, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div>
              <div style={{ ...upperLabel(11, C.stone), marginBottom: 16 }}>Connect</div>
              <h3 style={{ fontSize: 28, fontWeight: 400, color: C.parchment, letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 16 }}>
                Attach to a Claude Code session running in your shell.
              </h3>
              <p style={{ fontSize: 16, color: C.ash, lineHeight: 1.5, letterSpacing: "-0.16px", marginBottom: 24 }}>
                Orbital detects active processes on your machine and surfaces them here. Each session keeps its own MCP state, terminal history, and chat.
              </p>
              <button style={pillBtn("primary", "small")}>Detect running</button>
            </div>
            <div>
              <div style={{ ...upperLabel(11, C.stone), marginBottom: 16 }}>Start fresh</div>
              <h3 style={{ fontSize: 28, fontWeight: 400, color: C.parchment, letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 16 }}>
                Open a workspace and spawn a new session.
              </h3>
              <p style={{ fontSize: 16, color: C.ash, lineHeight: 1.5, letterSpacing: "-0.16px", marginBottom: 24 }}>
                Pick any directory. Orbital will read your config, autostart MCP servers, and put Claude Code on the line.
              </p>
              <button style={pillBtn("primary", "small")}>Open workspace</button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: `1px solid ${C.mistSoft}`, padding: "32px" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", gap: 36, fontSize: 13, color: C.stone, fontFamily: MONO }}>
              <span>↵ Enter</span>
              <span>⌘N New</span>
              <span>⌘1-9 Jump</span>
              <span>⌘K Commands</span>
            </div>
            <div style={{ ...upperLabel(11, C.stone) }}>
              Localhost · No telemetry · Open source
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function pillBtn(variant, size) {
  const base = {
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: size === "small" ? 14 : 15,
    padding: size === "small" ? "11px 22px" : "13px 28px",
    borderRadius: R.pill,
    border: "none",
    cursor: "pointer",
    transition: "background 200ms, color 200ms",
    letterSpacing: "-0.1px",
    minHeight: size === "small" ? 40 : 46,
  };
  if (variant === "primary") {
    return { ...base, background: C.earth, color: C.ash };
  }
  if (variant === "ghost") {
    return { ...base, background: "transparent", color: C.parchment, padding: size === "small" ? "11px 14px" : "13px 18px" };
  }
  return base;
}

// ============================================================================
// IDE
// ============================================================================

function IDE({ sessions, setSessions, activeId, setActiveId, onBack }) {
  const sess = sessions[activeId];

  const [leftW, leftDrag]   = useDragH(232, 180, 360);
  const [rightW, rightDrag] = useDragHR(380, 280, 520);
  const [termH, termDrag]   = useDragVR(220, 100, 420);

  const [lTab, setLTab]       = useState("files");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQ, setCmdQ]       = useState("");
  const [cmdHL, setCmdHL]     = useState(0);
  const [chatIn, setChatIn]   = useState("");
  const [termIn, setTermIn]   = useState("");
  const [busy, setBusy]       = useState(false);

  const chatEnd = useRef(null);
  const termEnd = useRef(null);
  const cmdRef  = useRef(null);

  const updateSess = useCallback((updater) => {
    setSessions((s) => ({ ...s, [activeId]: updater(s[activeId]) }));
  }, [activeId, setSessions]);

  useEffect(() => { if (chatEnd.current) chatEnd.current.scrollIntoView({ behavior: "smooth" }); }, [sess.msgs]);
  useEffect(() => { if (termEnd.current) termEnd.current.scrollIntoView({ behavior: "smooth" }); }, [sess.term]);
  useEffect(() => { if (cmdOpen && cmdRef.current) setTimeout(() => cmdRef.current.focus(), 50); if (!cmdOpen) setCmdHL(0); }, [cmdOpen]);
  useEffect(() => { setCmdHL(0); }, [cmdQ]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen((v) => !v); setCmdQ(""); return; }
      if (e.key === "Escape") { setCmdOpen(false); return; }
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const list = Object.values(sessions);
        if (list[idx]) { e.preventDefault(); setActiveId(list[idx].id); }
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [sessions, setActiveId]);

  const stream = useCallback((reply) => {
    setBusy(true);
    const base = { role: "a", txt: "", ts: nowTs() };
    updateSess((s) => ({ ...s, msgs: [...s.msgs, base] }));
    let i = 0;
    const iv = setInterval(() => {
      i += 5;
      updateSess((s) => {
        const u = [...s.msgs];
        u[u.length - 1] = { role: "a", txt: reply.slice(0, i), ts: base.ts };
        return { ...s, msgs: u };
      });
      if (i >= reply.length) { clearInterval(iv); setBusy(false); }
    }, 16);
  }, [updateSess]);

  const send = () => {
    const inp = chatIn.trim();
    if (!inp || busy) return;
    updateSess((s) => ({ ...s, msgs: [...s.msgs, { role: "u", txt: inp, ts: nowTs() }] }));
    setChatIn("");
    setTimeout(() => stream(genReply(inp, sess.name)), 280);
  };

  const runCmd = (k) => {
    setCmdOpen(false);
    updateSess((s) => ({ ...s, msgs: [...s.msgs, { role: "u", txt: k, ts: nowTs() }] }));
    setTimeout(() => stream(genReply(k, sess.name)), 280);
  };

  const execTerm = () => {
    const cmd = termIn.trim();
    if (!cmd) return;
    if (cmd === "clear") { updateSess((s) => ({ ...s, term: [] })); setTermIn(""); return; }
    let out = [];
    if (cmd.startsWith("git log")) out = [{ t: "o", v: "commit a3f2b1c  feat: latest changes" }];
    else if (cmd.startsWith("git")) out = [{ t: "o", v: "On branch " + sess.branch }];
    else if (cmd.startsWith("npm") || cmd.startsWith("npx")) out = [{ t: "o", v: "  Running" }, { t: "o", v: "  Done in 1.2s" }];
    else if (cmd === "ls") out = [{ t: "o", v: sess.tree.filter((n) => n.d === 0).map((n) => n.name + (n.type === "dir" ? "/" : "")).join("  ") }];
    else out = [{ t: "o", v: cmd + ": executed" }];
    updateSess((s) => ({ ...s, term: [...s.term, { t: "c", v: cmd }, ...out, { t: "o", v: "" }] }));
    setTermIn("");
  };

  const toggleMcp = (id) => {
    updateSess((s) => ({
      ...s,
      mcps: s.mcps.map((m) => (m.id === id ? { ...m, status: m.status === "running" ? "stopped" : "running", pid: m.status === "running" ? null : Math.floor(Math.random() * 9000 + 10000) } : m)),
    }));
  };

  const toggleDir = (id) => updateSess((s) => ({ ...s, tree: s.tree.map((f) => (f.id === id ? { ...f, open: !f.open } : f)) }));
  const openFile = (name) => updateSess((s) => ({ ...s, activeFile: name, tabs: s.tabs.includes(name) ? s.tabs : [...s.tabs, name] }));
  const closeTab = (name, e) => {
    e.stopPropagation();
    updateSess((s) => {
      const nxt = s.tabs.filter((t) => t !== name);
      return { ...s, tabs: nxt, activeFile: s.activeFile === name ? nxt[nxt.length - 1] || "" : s.activeFile };
    });
  };

  const visNodes = () => {
    const openDirs = new Set(sess.tree.filter((f) => f.type === "dir" && f.open).map((f) => f.id));
    return sess.tree.filter((f) => {
      if (f.d === 0) return true;
      if (f.d === 1) return openDirs.has(f.par);
      if (f.d === 2) {
        const pDir = sess.tree.find((x) => x.id === f.par);
        return openDirs.has(f.par) && (pDir ? openDirs.has(pDir.par) : true);
      }
      return false;
    });
  };

  const runningN = sess.mcps.filter((m) => m.status === "running").length;
  const filtCmds = CMDS.filter((c) => !cmdQ || (c.k + " " + c.label).toLowerCase().includes(cmdQ.toLowerCase()));
  const sessList = Object.values(sessions);
  const sessIdx = sessList.findIndex((s) => s.id === activeId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.canvas, color: C.ash, overflow: "hidden", fontFamily: FONT, userSelect: "none", fontSize: 14, letterSpacing: "-0.1px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, textarea { border: none; background: transparent; color: inherit; font-family: inherit; font-size: inherit; }
        input:focus-visible, textarea:focus-visible { outline: 1px solid ${C.parchment}; outline-offset: 1px; border-radius: 2px; }
        button { border: none; background: transparent; color: inherit; cursor: pointer; font-family: inherit; font-size: inherit; }
        button:focus-visible { outline: 1px solid ${C.parchment}; outline-offset: 2px; border-radius: 2px; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.surface2}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.charcoal}; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      {/* TOP NAV */}
      <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0, gap: 24, borderBottom: `1px solid ${C.mistSoft}` }}>
        <button onClick={onBack} style={{ fontSize: 16, fontWeight: 400, color: C.parchment, letterSpacing: "-0.2px" }}>
          Orbital
        </button>

        <div style={{ height: 14, width: 1, background: C.mistSoft }} />

        {/* Workspace */}
        <div style={{ fontSize: 13, color: C.ash, fontFamily: MONO, letterSpacing: "-0.1px" }}>
          {sess.workspace}
        </div>

        <div style={{ height: 14, width: 1, background: C.mistSoft }} />

        {/* MCP indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {sess.mcps.map((m) => (
            <div key={m.id} title={m.desc + (m.pid ? " · pid " + m.pid : "")}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: m.status === "running" ? C.parchment : C.stone, fontFamily: MONO, opacity: m.status === "running" ? 1 : 0.5 }}>
              <StatusDot status={m.status === "running" ? "idle" : "stopped"} size={5} />
              {m.code}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={() => { setCmdOpen(true); setCmdQ(""); }}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 14px", border: `1px solid ${C.mist}`, borderRadius: R.pill, fontSize: 13, color: C.stone, transition: "border-color 200ms, color 200ms" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.mistStrong; e.currentTarget.style.color = C.parchment; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.mist; e.currentTarget.style.color = C.stone; }}>
          <span>Search commands</span>
          <kbd style={{ ...upperLabel(10, C.stone), letterSpacing: "1.4px" }}>⌘ K</kbd>
        </button>
      </div>

      {/* SESSION TABS */}
      <div style={{ height: 40, display: "flex", alignItems: "stretch", flexShrink: 0, borderBottom: `1px solid ${C.mist}`, paddingLeft: 8 }}>
        <div role="tablist" aria-label="Sessions" style={{ display: "flex", flex: 1, overflowX: "auto" }}>
          {sessList.map((s, idx) => {
            const active = s.id === activeId;
            const num = pad3(idx + 1);
            return (
              <button key={s.id} role="tab" aria-selected={active} onClick={() => setActiveId(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 18px", minWidth: 200, borderRight: `1px solid ${C.mistSoft}`, background: "transparent", position: "relative", marginBottom: -1, transition: "background 200ms", whiteSpace: "nowrap" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.veil; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                {active && <div aria-hidden="true" style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 1, background: C.parchment }} />}
                <span style={{ ...upperLabel(10, active ? C.parchment : C.stone), letterSpacing: "1.6px" }}>{num}</span>
                <StatusDot status={s.status} size={6} />
                <span style={{ fontSize: 13, color: active ? C.parchment : C.stone, fontWeight: active ? 500 : 400, letterSpacing: "-0.1px" }}>
                  {s.name}
                </span>
              </button>
            );
          })}
          <button onClick={onBack} aria-label="New session"
            style={{ padding: "0 18px", color: C.stone, fontSize: 16, transition: "color 200ms" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.parchment)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.stone)}>
            +
          </button>
        </div>

        <button onClick={onBack}
          style={{ padding: "0 18px", borderLeft: `1px solid ${C.mistSoft}`, ...upperLabel(11, C.stone), display: "flex", alignItems: "center", gap: 10, transition: "color 200ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = C.parchment)}
          onMouseLeave={(e) => (e.currentTarget.style.color = C.stone)}>
          All sessions
        </button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT */}
        <div style={{ width: leftW, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: `1px solid ${C.mistSoft}`, overflow: "hidden" }}>
          <div style={{ display: "flex", height: 36, flexShrink: 0, borderBottom: `1px solid ${C.mistSoft}` }}>
            {[["files", "Files"], ["mcp", "MCP"], ["dash", "Stats"]].map(([v, l]) => (
              <button key={v} role="tab" aria-selected={lTab === v} onClick={() => setLTab(v)}
                style={{ flex: 1, ...upperLabel(11, lTab === v ? C.parchment : C.stone), borderBottom: lTab === v ? `1px solid ${C.parchment}` : "1px solid transparent", marginBottom: -1, transition: "color 200ms" }}>
                {l}
              </button>
            ))}
          </div>

          {/* FILES */}
          {lTab === "files" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
              {visNodes().map((n) => {
                const isActive = sess.activeFile === n.name;
                return (
                  <div key={n.id} onClick={() => (n.type === "dir" ? toggleDir(n.id) : openFile(n.name))}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 16px", paddingLeft: 16 + n.d * 18, cursor: "pointer", background: isActive ? C.veil : "transparent", color: isActive ? C.parchment : C.ash, transition: "background 100ms" }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.veil; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                    {n.type === "dir" ? (
                      <span style={{ color: C.stone, fontSize: 9, width: 12, textAlign: "center" }}>{n.open ? "▾" : "▸"}</span>
                    ) : (
                      <span style={{ width: 12 }} />
                    )}
                    <span style={{ fontSize: 13, color: n.type === "dir" ? C.stone : isActive ? C.parchment : C.ash, fontFamily: MONO, letterSpacing: "-0.1px" }}>{n.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* MCP */}
          {lTab === "mcp" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {sess.mcps.map((s) => (
                <div key={s.id} style={{ borderBottom: `1px solid ${C.mistSoft}`, padding: "16px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <StatusDot status={s.status === "running" ? "idle" : "stopped"} size={7} />
                      <span style={{ fontSize: 14, color: s.status === "running" ? C.parchment : C.stone, fontWeight: 400, letterSpacing: "-0.15px" }}>{s.name}</span>
                    </div>
                    <button onClick={() => toggleMcp(s.id)}
                      style={{ ...upperLabel(10, C.ash), padding: "6px 14px", borderRadius: R.pill, border: `1px solid ${C.mist}`, transition: "all 200ms" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.mistStrong; e.currentTarget.style.color = C.parchment; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.mist; e.currentTarget.style.color = C.ash; }}>
                      {s.status === "running" ? "Stop" : "Start"}
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: C.ash, marginBottom: 10, letterSpacing: "-0.1px" }}>{s.desc}</div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.stone, fontFamily: MONO }}>
                    {s.pid && <span>pid {s.pid}</span>}
                    <span>{s.tools} tools</span>
                  </div>
                </div>
              ))}
              <button style={{ width: "100%", marginTop: 16, padding: "12px", ...upperLabel(11, C.stone), border: `1px dashed ${C.mist}`, borderRadius: R.pill, transition: "all 200ms" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.mistStrong; e.currentTarget.style.color = C.parchment; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.mist; e.currentTarget.style.color = C.stone; }}>
                + Add server
              </button>
            </div>
          )}

          {/* DASH */}
          {lTab === "dash" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              <div style={{ ...upperLabel(11, C.stone), marginBottom: 18 }}>Session</div>
              {[
                { label: "Files indexed", value: sess.tree.filter((n) => n.type === "file").length },
                { label: "MCP tools", value: sess.mcps.reduce((sum, m) => sum + (m.status === "running" ? m.tools : 0), 0) },
                { label: "Active MCP", value: runningN, max: sess.mcps.length },
                { label: "Messages", value: sess.msgs.length },
              ].map((m) => (
                <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 0", borderBottom: `1px solid ${C.mistSoft}` }}>
                  <span style={{ fontSize: 13, color: C.ash, letterSpacing: "-0.1px" }}>{m.label}</span>
                  <span style={{ fontSize: 28, fontWeight: 400, color: C.parchment, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.7px" }}>
                    {m.value}{m.max !== undefined && <span style={{ color: C.stone, fontSize: 16 }}>/{m.max}</span>}
                  </span>
                </div>
              ))}

              <div style={{ ...upperLabel(11, C.stone), marginTop: 32, marginBottom: 14 }}>Test pass · 7d</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 56 }}>
                {[72, 85, 68, 91, 87, 94, 87].map((v, i) => (
                  <div key={i} style={{ flex: 1, height: v + "%", background: C.parchment, opacity: 0.7, borderRadius: 1 }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, ...upperLabel(10, C.stone), letterSpacing: "1.4px" }}>
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
              </div>

              <div style={{ ...upperLabel(11, C.stone), marginTop: 32, marginBottom: 14 }}>Cortex pipeline</div>
              {[
                { label: "S3 ingestion", ok: true, val: "2.4M / hr" },
                { label: "Databricks", ok: true, val: "Running" },
                { label: "Schema check", ok: false, val: "2 warnings" },
                { label: "Data quality", ok: true, val: "99.2%" },
              ].map((r, i, arr) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.mistSoft}` : "none" }}>
                  <span style={{ fontSize: 13, color: C.ash }}>{r.label}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot status={r.ok ? "idle" : "busy"} size={6} />
                    <span style={{ fontSize: 12, color: r.ok ? C.parchment : C.ash, fontFamily: MONO, letterSpacing: "-0.1px" }}>{r.val}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div onMouseDown={leftDrag} style={{ width: 4, background: "transparent", flexShrink: 0, cursor: "col-resize", transition: "background 200ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.mist)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} />

        {/* CENTER */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Editor */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Tabs */}
            <div style={{ display: "flex", flexShrink: 0, overflowX: "auto", height: 36, borderBottom: `1px solid ${C.mistSoft}` }}>
              {sess.tabs.map((tab) => {
                const active = sess.activeFile === tab;
                return (
                  <div key={tab} onClick={() => updateSess((s) => ({ ...s, activeFile: tab }))}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderRight: `1px solid ${C.mistSoft}`, background: active ? C.veil : "transparent", flexShrink: 0, whiteSpace: "nowrap", cursor: "pointer", transition: "background 100ms" }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.veil; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ fontSize: 13, color: active ? C.parchment : C.stone, fontFamily: MONO, letterSpacing: "-0.1px" }}>{tab}</span>
                    <button onClick={(e) => closeTab(tab, e)} aria-label={`Close ${tab}`}
                      style={{ fontSize: 14, color: C.purpleTint, padding: "0 2px", lineHeight: 1, transition: "color 100ms" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.parchment)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.purpleTint)}>×</button>
                  </div>
                );
              })}
              {sess.tabs.length === 0 && <div style={{ display: "flex", alignItems: "center", padding: "0 16px", ...upperLabel(11, C.stone) }}>No files open</div>}
            </div>

            {/* Code */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {sess.code[sess.activeFile] ? (
                <div style={{ display: "flex", minHeight: "100%" }}>
                  <div style={{ minWidth: 56, paddingRight: 18, textAlign: "right", paddingLeft: 16, paddingTop: 24, paddingBottom: 24, fontSize: 12, lineHeight: "1.7", color: C.purpleTint, fontFamily: MONO, fontVariantNumeric: "tabular-nums" }}>
                    {sess.code[sess.activeFile].split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
                  </div>
                  <pre style={{ fontSize: 13, lineHeight: "1.7", color: C.ash, flex: 1, padding: "24px 28px", whiteSpace: "pre-wrap", margin: 0, fontFamily: MONO, letterSpacing: "-0.1px" }}>{sess.code[sess.activeFile]}</pre>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", ...upperLabel(11, C.stone) }}>Select a file</div>
              )}
            </div>
          </div>

          <div onMouseDown={termDrag} style={{ height: 4, background: "transparent", flexShrink: 0, cursor: "row-resize", transition: "background 200ms" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.mist)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} />

          {/* TERMINAL */}
          <div style={{ height: termH, flexShrink: 0, display: "flex", flexDirection: "column", borderTop: `1px solid ${C.mistSoft}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 18px", height: 32, flexShrink: 0, borderBottom: `1px solid ${C.mistSoft}` }}>
              <span style={upperLabel(11, C.parchment)}>Terminal</span>
              <span style={{ fontSize: 11, color: C.stone, fontFamily: MONO }}>bash · {sess.workspace}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => updateSess((s) => ({ ...s, term: [] }))}
                style={{ ...upperLabel(10, C.stone), padding: "4px 10px", borderRadius: R.pill, border: `1px solid ${C.mist}`, transition: "all 200ms" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.parchment; e.currentTarget.style.borderColor = C.mistStrong; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.stone; e.currentTarget.style.borderColor = C.mist; }}>
                Clear
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", fontFamily: MONO, fontSize: 13, lineHeight: 1.7 }}>
              {sess.term.map((ln, i) => (
                <div key={i} style={{ color: ln.t === "c" ? C.parchment : C.ash, display: "flex", wordBreak: "break-all", letterSpacing: "-0.1px" }}>
                  {ln.t === "c" && <span style={{ color: C.purpleTint, marginRight: 12 }}>›</span>}
                  <span style={{ whiteSpace: "pre-wrap" }}>{ln.v}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                <span style={{ color: C.purpleTint }}>›</span>
                <input value={termIn} onChange={(e) => setTermIn(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") execTerm(); }}
                  aria-label="Terminal input"
                  style={{ flex: 1, color: C.parchment, fontFamily: MONO, fontSize: 13, caretColor: C.parchment, letterSpacing: "-0.1px" }} autoComplete="off" />
              </div>
              <div ref={termEnd} />
            </div>
          </div>
        </div>

        <div onMouseDown={rightDrag} style={{ width: 4, background: "transparent", flexShrink: 0, cursor: "col-resize", transition: "background 200ms" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.mist)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")} />

        {/* RIGHT — CHAT */}
        <div style={{ width: rightW, flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: `1px solid ${C.mistSoft}`, overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "0 18px", height: 52, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, borderBottom: `1px solid ${C.mistSoft}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 400, color: C.parchment, letterSpacing: "-0.2px" }}>Claude</div>
              <div style={{ ...upperLabel(10, C.stone), marginTop: 3 }}>Session {pad3(sessIdx + 1)} · sonnet 4.5</div>
            </div>
            <StatusDot status={sess.status} size={7} />
          </div>

          {/* /commands quick row */}
          <div style={{ padding: "10px 14px", flexShrink: 0, overflowX: "auto", borderBottom: `1px solid ${C.mistSoft}` }}>
            <div style={{ display: "flex", gap: 6, width: "max-content" }}>
              {CMDS.slice(0, 4).map((c) => (
                <button key={c.k} onClick={() => runCmd(c.k)}
                  style={{ padding: "5px 12px", borderRadius: R.pill, border: `1px solid ${C.mist}`, background: "transparent", color: C.stone, fontSize: 12, fontFamily: MONO, whiteSpace: "nowrap", letterSpacing: "-0.1px", transition: "all 200ms" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.mistStrong; e.currentTarget.style.color = C.parchment; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.mist; e.currentTarget.style.color = C.stone; }}>
                  {c.k}
                </button>
              ))}
            </div>
          </div>

          {/* Messages — editorial transcript style, no bubbles */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 28 }}>
            {sess.msgs.map((m, i) => {
              const isUser = m.role === "u";
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
                    <span style={upperLabel(10, isUser ? C.parchment : C.stone)}>
                      {isUser ? "You" : "Claude"}
                    </span>
                    <span style={{ fontSize: 11, color: C.purpleTint, fontFamily: MONO }}>{m.ts}</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.55, color: isUser ? C.parchment : C.ash, whiteSpace: "pre-wrap", wordBreak: "break-word", letterSpacing: "-0.15px" }}>
                    {m.txt}
                    {busy && i === sess.msgs.length - 1 && m.role === "a" && (
                      <span style={{ display: "inline-block", width: 6, height: 14, background: C.parchment, marginLeft: 3, verticalAlign: "text-bottom", animation: "blink 0.7s step-end infinite" }} />
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEnd} />
            <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* Input */}
          <div style={{ padding: 14, flexShrink: 0, borderTop: `1px solid ${C.mistSoft}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${C.mist}`, borderRadius: R.pill, padding: "10px 16px", transition: "border-color 200ms" }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = C.mistStrong)}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = C.mist)}>
              <input value={chatIn} onChange={(e) => setChatIn(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={sess.status === "stopped" ? "Session stopped" : busy ? "Thinking" : "Ask Claude"}
                disabled={busy || sess.status === "stopped"}
                aria-label="Message Claude" aria-busy={busy}
                style={{ flex: 1, fontSize: 14, color: C.parchment, lineHeight: 1.5, letterSpacing: "-0.15px" }} />
              <button onClick={send} disabled={!chatIn.trim() || busy || sess.status === "stopped"}
                aria-label="Send"
                style={{ width: 28, height: 28, borderRadius: "50%", background: chatIn.trim() && !busy && sess.status !== "stopped" ? C.earth : "transparent", color: chatIn.trim() && !busy && sess.status !== "stopped" ? C.parchment : C.purpleTint, fontSize: 13, transition: "all 200ms", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {busy ? <span style={{ display: "inline-block", width: 10, height: 10, border: "1.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : "↵"}
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.stone, display: "flex", justifyContent: "space-between", fontFamily: MONO }}>
              <span>↵ Send</span>
              <span>⌘ K Commands</span>
              <span>⌘ 1-9 Sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ height: 26, display: "flex", alignItems: "center", padding: "0 18px", gap: 18, flexShrink: 0, fontSize: 11, color: C.stone, fontFamily: MONO, borderTop: `1px solid ${C.mistSoft}` }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusDot status={sess.status} size={6} />
          <span style={{ color: C.parchment }}>Session {pad3(sessIdx + 1)}</span>
          <span style={{ color: C.purpleTint }}>·</span>
          <span>{sess.name}</span>
        </span>
        <span>{runningN}/{sess.mcps.length} mcp</span>
        <span style={{ color: C.purpleTint }}>·</span>
        <span>{sess.branch}</span>
        <div style={{ flex: 1 }} />
        <span>Ln 1 · Col 1</span>
        <span style={{ color: C.purpleTint }}>·</span>
        <span style={{ color: C.parchment }}>claude-sonnet-4-5</span>
      </div>

      {/* COMMAND PALETTE */}
      {cmdOpen && (
        <div role="dialog" aria-label="Command palette"
          style={{ position: "fixed", inset: 0, background: "rgba(10,8,7,0.78)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "13vh" }}
          onClick={() => setCmdOpen(false)}>
          <div style={{ width: 560, background: C.canvasElev, border: `1px solid ${C.mistStrong}`, borderRadius: R.xxl, overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderBottom: `1px solid ${C.mistSoft}` }}>
              <span style={{ color: C.stone, fontSize: 16 }}>⌕</span>
              <input ref={cmdRef} value={cmdQ} onChange={(e) => setCmdQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setCmdHL((h) => Math.min(filtCmds.length - 1, h + 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setCmdHL((h) => Math.max(0, h - 1)); }
                  else if (e.key === "Enter" && filtCmds[cmdHL]) runCmd(filtCmds[cmdHL].k);
                }}
                placeholder="Type a command" aria-label="Search commands"
                style={{ flex: 1, fontSize: 16, color: C.parchment, fontWeight: 400, letterSpacing: "-0.2px" }} />
              <kbd style={{ ...upperLabel(10, C.stone), padding: "3px 10px", border: `1px solid ${C.mist}`, borderRadius: R.pill }}>esc</kbd>
            </div>
            <div role="listbox" style={{ maxHeight: 360, overflowY: "auto" }}>
              {filtCmds.length > 0 ? filtCmds.map((c, i) => (
                <div key={c.k} role="option" aria-selected={i === cmdHL}
                  onClick={() => runCmd(c.k)} onMouseEnter={() => setCmdHL(i)}
                  style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 22px", cursor: "pointer", background: i === cmdHL ? C.veil : "transparent", borderBottom: `1px solid ${C.mistSoft}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: C.parchment, minWidth: 100, letterSpacing: "-0.1px" }}>{c.k}</span>
                  <span style={{ fontSize: 13, color: C.ash, letterSpacing: "-0.15px" }}>{c.label}</span>
                </div>
              )) : <div style={{ padding: 28, textAlign: "center", ...upperLabel(11, C.stone) }}>No commands match</div>}
            </div>
            <div style={{ padding: "12px 22px", display: "flex", gap: 24, ...upperLabel(10, C.stone), letterSpacing: "1.4px", borderTop: `1px solid ${C.mistSoft}` }}>
              <span>↑↓ navigate</span>
              <span>↵ run</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// APP
// ============================================================================

export default function Orbital() {
  const [screen, setScreen] = useState("welcome");
  const [sessions, setSessions] = useState(SESSIONS_INIT);
  const [activeId, setActiveId] = useState(null);

  const enterSession = (id) => { setActiveId(id); setScreen("ide"); };

  if (screen === "welcome") {
    return <Welcome sessions={sessions} onEnter={enterSession} />;
  }
  return <IDE sessions={sessions} setSessions={setSessions} activeId={activeId} setActiveId={setActiveId} onBack={() => setScreen("welcome")} />;
}
