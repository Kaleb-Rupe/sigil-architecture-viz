import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { notFound } from 'next/navigation';
import ExcalidrawWrapper from '@/components/ExcalidrawWrapper';

/**
 * Snapshot viewer route — loads a committed .excalidraw.json file from
 * the /snapshots directory. Used for the collaboration workflow:
 * Don commits a snapshot to propose an architecture change, Kaleb views
 * it at /s/[name], annotates, and commits his feedback back.
 */

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function SnapshotPage({ params }: PageProps) {
  const { name } = await params;

  // Prevent directory traversal — only allow alphanumeric + dash + underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    notFound();
  }

  let snapshot: {
    elements: unknown[];
    appState: { viewBackgroundColor?: string };
    savedAt: string;
  } | null = null;

  try {
    const path = join(process.cwd(), 'snapshots', `${name}.excalidraw.json`);
    const content = await readFile(path, 'utf-8');
    snapshot = JSON.parse(content);
  } catch {
    notFound();
  }

  if (!snapshot) {
    notFound();
  }

  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <ExcalidrawWrapper snapshotKey={name} initialSnapshot={snapshot} />
    </main>
  );
}

// Pre-generate static params for known snapshots so they're cacheable
export async function generateStaticParams() {
  try {
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(join(process.cwd(), 'snapshots'));
    return files
      .filter((f) => f.endsWith('.excalidraw.json'))
      .map((f) => ({ name: f.replace(/\.excalidraw\.json$/, '') }));
  } catch {
    return [];
  }
}
