# Snapshots — Visual Communication Layer

This directory holds committed Excalidraw snapshots. Each `.excalidraw.json`
file becomes a viewable diagram at `/s/[filename]`.

The **main page** (`/`) always shows the **canonical architecture** rendered
live from the code in `data/onchain.ts` + `data/sdk.ts`. Snapshots are for
**proposed changes, feedback, and decisions** — not the base state.

## Collaboration workflow

```
Don commits       → snapshots/proposed-mcp-gateway.excalidraw.json
                  → Kaleb visits /s/proposed-mcp-gateway
                  → Kaleb annotates (sticky notes, arrows, text)
                  → Kaleb clicks "Export JSON"
                  → Kaleb commits kaleb-feedback-mcp-gateway.excalidraw.json
                  → Don reads, iterates, commits revised snapshot
```

Git history becomes a visual conversation log. Each commit is a message.

## Naming conventions

- `proposed-[topic].excalidraw.json` — Don's architectural proposals
- `kaleb-[topic].excalidraw.json` — Kaleb's responses / feedback
- `decision-[topic].excalidraw.json` — finalized decisions
- `wip-[topic].excalidraw.json` — work-in-progress explorations

## Creating a new snapshot

### From the browser (Kaleb)
1. Open the visualizer (main page or an existing snapshot)
2. Make your edits — drag elements, add sticky notes, draw arrows
3. Click **Export JSON** in the top-right toolbar
4. Save the file to `snapshots/[topic].excalidraw.json`
5. Commit + push — it auto-deploys to `/s/[topic]`

### Programmatically (Don)
1. Write the `.excalidraw.json` file directly to `snapshots/`
2. Commit + push
3. Tell Kaleb: "Check out /s/[topic] for my proposal"

## Local edits persistence

Edits to the main page (`/`) auto-save to `localStorage` every 2 seconds.
They persist across reloads but are **per-browser**. To share your edits
with Don or another device: export → commit → reference by URL.

**Reset button** in the toolbar wipes localStorage and regenerates the
canonical architecture from current code data.
