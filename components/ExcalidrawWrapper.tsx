'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { generateElements } from '@/lib/generate-elements';
import type { SnapshotEntry } from '@/lib/list-snapshots';

/**
 * ExcalidrawWrapper — state + persistence layer on top of the Excalidraw
 * canvas. Renders ExcalidrawCanvas (loaded client-side via next/dynamic
 * because @excalidraw/excalidraw touches `window` at module load).
 *
 * Toolbar actions (Export/Import/Reset) are passed to ExcalidrawCanvas
 * where they render as MainMenu items in Excalidraw's native hamburger
 * menu — NO floating toolbar overlay.
 */

// Load the canvas component only on the client
const ExcalidrawCanvas = dynamic(
  () => import('@/components/ExcalidrawCanvas'),
  { ssr: false }
);

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'sigil-arch-viz:';

interface Snapshot {
  /** If "skeleton", elements need convertToExcalidrawElements(). */
  _format?: 'skeleton';
  elements: unknown[];
  appState: {
    viewBackgroundColor?: string;
  };
  savedAt: string;
}

function loadSnapshot(key: string): Snapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

function saveSnapshot(key: string, snapshot: Snapshot) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('[sigil-arch-viz] Failed to save to localStorage:', err);
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export interface ExcalidrawWrapperProps {
  /** Snapshot identifier. Defaults to "canonical". */
  snapshotKey?: string;
  /** Optional pre-loaded snapshot (used by /s/[name] routes). */
  initialSnapshot?: Snapshot;
  /** All available snapshots — piped into the Views submenu in MainMenu. */
  snapshots?: SnapshotEntry[];
}

export default function ExcalidrawWrapper({
  snapshotKey = 'canonical',
  initialSnapshot,
  snapshots = [],
}: ExcalidrawWrapperProps) {
  // Canonical architecture rendered from current code data
  const canonical = useMemo(() => generateElements(), []);

  const [initialData, setInitialData] = useState<{
    elements: unknown[];
    appState: {
      theme: 'dark';
      viewBackgroundColor: string;
      currentItemFontFamily: number;
    };
  } | null>(null);

  // Load elements: priority = initialSnapshot > localStorage > canonical
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (initialSnapshot) {
        const elements =
          initialSnapshot._format === 'skeleton'
            ? await convertSkeletonsToElements(initialSnapshot.elements)
            : initialSnapshot.elements;
        if (cancelled) return;
        setInitialData({
          elements,
          appState: {
            theme: 'dark',
            viewBackgroundColor:
              initialSnapshot.appState.viewBackgroundColor ?? '#0F0F0F',
            currentItemFontFamily: 1,
          },
        });
        return;
      }

      const persisted = loadSnapshot(snapshotKey);
      if (persisted) {
        const elements =
          persisted._format === 'skeleton'
            ? await convertSkeletonsToElements(persisted.elements)
            : persisted.elements;
        if (cancelled) return;
        setInitialData({
          elements,
          appState: {
            theme: 'dark',
            viewBackgroundColor:
              persisted.appState.viewBackgroundColor ?? '#0F0F0F',
            currentItemFontFamily: 1,
          },
        });
        return;
      }

      if (cancelled) return;
      setInitialData({
        elements: canonical.elements,
        appState: {
          theme: 'dark',
          viewBackgroundColor: '#0F0F0F',
          currentItemFontFamily: 1,
        },
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [snapshotKey, initialSnapshot, canonical.elements]);

  async function convertSkeletonsToElements(
    skeletons: unknown[]
  ): Promise<unknown[]> {
    const mod = await import('@excalidraw/excalidraw');
    return mod.convertToExcalidrawElements(skeletons as never, {
      regenerateIds: true,
    }) as unknown[];
  }

  // Auto-save (2s debounce)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = useCallback(
    (elements: readonly unknown[], appState: unknown) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const state = appState as { viewBackgroundColor?: string };
        saveSnapshot(snapshotKey, {
          elements: [...elements],
          appState: {
            viewBackgroundColor: state.viewBackgroundColor,
          },
          savedAt: new Date().toISOString(),
        });
      }, 2000);
    },
    [snapshotKey]
  );

  // ─── MainMenu actions ─────────────────────────────────────────────────────

  const handleExportJSON = useCallback(() => {
    const persisted = loadSnapshot(snapshotKey);
    const snapshot = persisted ?? {
      elements: canonical.elements,
      appState: { viewBackgroundColor: '#0F0F0F' },
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snapshotKey}-${new Date().toISOString().split('T')[0]}.excalidraw.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [snapshotKey, canonical.elements]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.excalidraw';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Snapshot;
        saveSnapshot(snapshotKey, parsed);
        window.location.reload();
      } catch (err) {
        alert('Failed to import: invalid JSON');
        console.error(err);
      }
    };
    input.click();
  }, [snapshotKey]);

  const handleReset = useCallback(() => {
    if (!confirm('Reset to the canonical architecture? Your edits will be lost.'))
      return;
    localStorage.removeItem(STORAGE_KEY_PREFIX + snapshotKey);
    window.location.reload();
  }, [snapshotKey]);

  if (!initialData) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#D4A843',
          fontFamily: 'monospace',
        }}
      >
        Loading architecture...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ExcalidrawCanvas
        elements={initialData.elements}
        appState={initialData.appState}
        onChange={handleChange}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onReset={handleReset}
        currentSlug={snapshotKey}
        snapshots={snapshots}
      />
      {/* Current view label — small, unobtrusive, bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 10,
          color: '#D4A843',
          fontFamily: 'monospace',
          fontSize: 11,
          background: 'rgba(15, 15, 15, 0.7)',
          padding: '4px 8px',
          borderRadius: 4,
          border: '1px solid rgba(212, 168, 67, 0.4)',
          pointerEvents: 'none',
        }}
      >
        {snapshotKey === 'canonical'
          ? 'canonical'
          : snapshots.find((s) => s.slug === snapshotKey)?.label ?? snapshotKey}
      </div>
    </div>
  );
}
