import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { notFound } from 'next/navigation';
import ExcalidrawWrapper from '@/components/ExcalidrawWrapper';
import { listSnapshots } from '@/lib/list-snapshots';

/**
 * Snapshot viewer route — loads a committed .excalidraw.json file from
 * the /snapshots directory. Navigation between views lives inside
 * Excalidraw's MainMenu (Views submenu).
 */

interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function SnapshotPage({ params }: PageProps) {
  const { name } = await params;

  // Prevent directory traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    notFound();
  }

  let snapshot: {
    _format?: 'skeleton';
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

  const snapshots = await listSnapshots();

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ExcalidrawWrapper
        snapshotKey={name}
        initialSnapshot={snapshot}
        snapshots={snapshots}
      />
    </main>
  );
}

// Pre-generate static params for known snapshots
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
