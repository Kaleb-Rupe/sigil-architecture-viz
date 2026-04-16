# Sigil Architecture Visualizer

Interactive architecture map of the [Sigil](https://github.com/Sigil-Trade/sigil)
on-chain program + SDK. Built with Next.js + [Excalidraw](https://excalidraw.com)
for visual exploration, annotation, and async collaboration.

🔗 **Live:** _[will be set after Vercel deploy]_

## What this is

A living, interactive map of how Sigil works — every on-chain instruction,
every PDA account, every SDK module, and how they connect. Instead of reading
700 lines of barrel exports and 35 instruction handlers to understand the
system, you can **see** it.

The canonical view (`/`) renders live from the code data. Add a new
instruction to the on-chain program or a new SDK module, regenerate the data
files, and the diagram updates.

## Why

Two reasons:

1. **Observation.** Keeping an accurate mental model across 35 instructions,
   12 PDAs, 38 events, and ~40 SDK modules gets hard. This makes the whole
   topology visible at a glance — for onboarding, debugging, and planning.

2. **Visual communication.** The architecture becomes a shared canvas between
   Kaleb and Don (the AI assistant). Don commits proposed changes as
   `.excalidraw.json` snapshots. Kaleb views them at `/s/[name]`, annotates
   with sticky notes, commits feedback back. Git history becomes a visual
   conversation log.

## What's on the map

- **35 on-chain instructions** grouped by domain (vault lifecycle, agent
  management, authorization, policy, constraints, escrow, transfer,
  assertions)
- **12 PDA account types** with seeds, sizes, and relationships
- **38 events** emitted across all instructions
- **~40 SDK modules** across 5 subpaths (root, dashboard, x402, tee, errors)
  with dependency edges
- **Unimplemented features** (MCP gateway, CLI, React hooks) shown as dimmed
  nodes so you can see what's planned vs built

## Getting started

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm build         # production build
```

## Interactivity

Excalidraw provides the full editing surface:

- **Drag** any element to rearrange the layout
- **Add** sticky notes, shapes, arrows, text anywhere
- **Zoom/pan** infinitely — ⌘+scroll to zoom, space+drag to pan
- **Export** as PNG/SVG via Excalidraw's menu, or as JSON via the toolbar
- **Auto-save** — your edits persist to localStorage every 2 seconds

Toolbar buttons (top-right):
- **Export JSON** — download the current state as a snapshot
- **Import JSON** — load a previously exported snapshot
- **Reset** — wipe local edits, regenerate canonical view from code

## Collaboration workflow

Snapshots in `/snapshots/*.excalidraw.json` are viewable at `/s/[name]`.

```
Don commits  snapshots/proposed-mcp-gateway.excalidraw.json
             ↓
Kaleb opens  /s/proposed-mcp-gateway
             ↓
Kaleb annotates + exports + commits snapshots/kaleb-feedback-mcp-gateway.excalidraw.json
             ↓
Don iterates based on feedback, commits a revised snapshot
```

See [`snapshots/README.md`](./snapshots/README.md) for naming conventions.

## Keeping the data fresh

When the on-chain program or SDK architecture changes, update:

- `data/onchain.ts` — instructions + PDAs + events
- `data/sdk.ts` — SDK modules + dependencies
- `lib/generate-elements.ts` — layout + rendering logic

The diagram regenerates automatically from these sources on next build.

## Tech

- [Next.js 16](https://nextjs.org) — static export, no backend
- [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) —
  the hand-drawn diagram engine (MIT)
- [Tailwind CSS 4](https://tailwindcss.com) — styling
- Deployed on [Vercel](https://vercel.com)

No database, no auth, no RPC calls. Pure static visualization with
client-side persistence.

## License

MIT — feel free to fork this pattern for your own project's architecture map.
