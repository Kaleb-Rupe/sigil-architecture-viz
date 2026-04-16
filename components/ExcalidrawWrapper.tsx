'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { generateElements } from '@/lib/generate-elements';

// Excalidraw uses browser APIs (canvas, window) so it must be loaded client-side only
const Excalidraw = dynamic(
  async () => {
    const mod = await import('@excalidraw/excalidraw');
    return mod.Excalidraw;
  },
  { ssr: false }
);

// ─── Persistence ────────────────────────────────────────────────────────────
// Auto-save to localStorage every 2 seconds of inactivity.
// Key is namespaced so different snapshots don't collide.

const STORAGE_KEY_PREFIX = 'sigil-arch-viz:';

interface Snapshot {
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
  /** Snapshot identifier. Defaults to "canonical" (the auto-generated architecture). */
  snapshotKey?: string;
  /** Optional pre-loaded elements (used by /s/[name] routes). */
  initialSnapshot?: Snapshot;
}

export default function ExcalidrawWrapper({
  snapshotKey = 'canonical',
  initialSnapshot,
}: ExcalidrawWrapperProps) {
  // Generate canonical architecture from current code data
  const canonical = useMemo(() => generateElements(), []);

  // Load persisted edits OR initial snapshot OR canonical
  const [initialData, setInitialData] = useState<{
    elements: unknown[];
    appState: { theme: 'dark'; viewBackgroundColor: string; currentItemFontFamily: number };
  } | null>(null);

  useEffect(() => {
    // 1. Pre-loaded snapshot takes precedence (used by /s/[name] routes)
    if (initialSnapshot) {
      setInitialData({
        elements: initialSnapshot.elements,
        appState: {
          theme: 'dark',
          viewBackgroundColor: initialSnapshot.appState.viewBackgroundColor ?? '#0F0F0F',
          currentItemFontFamily: 1,
        },
      });
      return;
    }
    // 2. Try localStorage
    const persisted = loadSnapshot(snapshotKey);
    if (persisted) {
      setInitialData({
        elements: persisted.elements,
        appState: {
          theme: 'dark',
          viewBackgroundColor: persisted.appState.viewBackgroundColor ?? '#0F0F0F',
          currentItemFontFamily: 1,
        },
      });
      return;
    }
    // 3. Fall back to canonical
    setInitialData({
      elements: canonical.elements,
      appState: {
        theme: 'dark',
        viewBackgroundColor: '#0F0F0F',
        currentItemFontFamily: 1,
      },
    });
  }, [snapshotKey, initialSnapshot, canonical.elements]);

  // Debounced auto-save
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

  // ─── Toolbar actions ──────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
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

  const handleImport = useCallback(() => {
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
    if (!confirm('Reset to the canonical architecture? Your edits will be lost.')) return;
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
      <Excalidraw
        initialData={{
          elements: initialData.elements as never,
          appState: initialData.appState,
        }}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
          },
        }}
        onChange={handleChange as never}
      />

      {/* Toolbar overlay — top-right */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <ToolbarButton onClick={handleExport} label="Export JSON" />
        <ToolbarButton onClick={handleImport} label="Import JSON" />
        <ToolbarButton onClick={handleReset} label="Reset" variant="danger" />
      </div>

      {/* Snapshot label — top-left */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 60,
          zIndex: 10,
          color: '#D4A843',
          fontFamily: 'monospace',
          fontSize: 12,
          background: 'rgba(15, 15, 15, 0.8)',
          padding: '4px 8px',
          borderRadius: 4,
          border: '1px solid #D4A843',
          pointerEvents: 'none',
        }}
      >
        snapshot: {snapshotKey}
      </div>
    </div>
  );
}

// ─── Toolbar button component ────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  label,
  variant = 'default',
}: {
  onClick: () => void;
  label: string;
  variant?: 'default' | 'danger';
}) {
  const bg =
    variant === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 168, 67, 0.15)';
  const border = variant === 'danger' ? '#ef4444' : '#D4A843';
  return (
    <button
      onClick={onClick}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color: border,
        padding: '6px 12px',
        fontFamily: 'monospace',
        fontSize: 12,
        cursor: 'pointer',
        borderRadius: 4,
      }}
    >
      {label}
    </button>
  );
}
