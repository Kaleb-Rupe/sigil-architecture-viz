import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

import { generateFlowElements } from '@/lib/flows/renderer';
import type { FlowDefinition } from '@/lib/flows/types';
import { CREATE_VAULT_FLOW } from '@/lib/flows/definitions/create-vault';

/**
 * Dev-only route to regenerate all flow snapshots.
 * Hit GET /api/regenerate-flows while `pnpm dev` is running.
 * Writes snapshots/flow-*.excalidraw.json for every defined flow.
 */

const FLOWS: FlowDefinition[] = [CREATE_VAULT_FLOW];

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 });
  }

  const snapshotsDir = join(process.cwd(), 'snapshots');
  mkdirSync(snapshotsDir, { recursive: true });

  const results: { name: string; elements: number; path: string }[] = [];

  for (const flow of FLOWS) {
    const { elements } = generateFlowElements(flow);
    const snapshot = {
      elements,
      appState: { viewBackgroundColor: '#0F0F0F' },
      savedAt: new Date().toISOString(),
    };
    const path = join(snapshotsDir, `${flow.name}.excalidraw.json`);
    writeFileSync(path, JSON.stringify(snapshot, null, 2));
    results.push({ name: flow.name, elements: elements.length, path });
  }

  return NextResponse.json({ generated: results.length, results });
}
