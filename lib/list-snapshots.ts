// Server-side helper to enumerate the /snapshots directory for navigation.
// Keeps filesystem access out of client components.

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface SnapshotEntry {
  /** URL slug (filename without extension). */
  slug: string;
  /** Display label (slug with dashes → spaces, title case). */
  label: string;
  /** Category inferred from slug prefix (flow-*, proposed-*, decision-*). */
  category: 'flow' | 'proposed' | 'decision' | 'kaleb' | 'other';
}

const CATEGORY_PREFIXES: Record<string, SnapshotEntry['category']> = {
  'flow-': 'flow',
  'proposed-': 'proposed',
  'decision-': 'decision',
  'kaleb-': 'kaleb',
};

function categorize(slug: string): SnapshotEntry['category'] {
  for (const [prefix, category] of Object.entries(CATEGORY_PREFIXES)) {
    if (slug.startsWith(prefix)) return category;
  }
  return 'other';
}

function labelize(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function listSnapshots(): Promise<SnapshotEntry[]> {
  try {
    const files = await readdir(join(process.cwd(), 'snapshots'));
    return files
      .filter((f) => f.endsWith('.excalidraw.json'))
      .map((f) => {
        const slug = f.replace(/\.excalidraw\.json$/, '');
        return {
          slug,
          label: labelize(slug),
          category: categorize(slug),
        };
      })
      .sort((a, b) => a.slug.localeCompare(b.slug));
  } catch {
    return [];
  }
}
