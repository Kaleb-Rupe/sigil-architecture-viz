#!/usr/bin/env tsx
/**
 * Generates all flow snapshot files in /snapshots/flow-*.excalidraw.json.
 * Uses only relative imports so tsx can run this standalone (no Next.js
 * path aliases). Run with: `pnpm tsx scripts/generate-flows.mts`
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateFlowElements } from '../lib/flows/renderer.js';
import type { FlowDefinition } from '../lib/flows/types.js';

// All flow definitions — each is imported from its own file for isolation
import { CREATE_VAULT_FLOW } from '../lib/flows/definitions/create-vault.js';

const FLOWS: FlowDefinition[] = [CREATE_VAULT_FLOW];

const __dirname = dirname(fileURLToPath(import.meta.url));
const snapshotsDir = join(__dirname, '..', 'snapshots');
mkdirSync(snapshotsDir, { recursive: true });

for (const flow of FLOWS) {
  const { elements } = generateFlowElements(flow);

  const snapshot = {
    elements,
    appState: {
      viewBackgroundColor: '#0F0F0F',
    },
    savedAt: new Date().toISOString(),
  };

  const path = join(snapshotsDir, `${flow.name}.excalidraw.json`);
  writeFileSync(path, JSON.stringify(snapshot, null, 2));
  console.log(`✓ ${flow.name} — ${elements.length} elements → ${path}`);
}

console.log(`\n✓ Generated ${FLOWS.length} flow snapshot(s).`);
