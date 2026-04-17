'use client';

/**
 * ExcalidrawCanvas — inner client component that imports Excalidraw AND
 * MainMenu directly so we can pass MainMenu as a child.
 *
 * Loaded via next/dynamic (ssr: false) from ExcalidrawWrapper because
 * @excalidraw/excalidraw touches `window` at module load time.
 *
 * MainMenu strategy: keep ALL useful Excalidraw defaults (Open, Find,
 * Help, etc.), add our own actions, and add a Views group for navigation
 * between snapshots. This replaces the separate NavMenu overlay.
 */

import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { SnapshotEntry } from '@/lib/list-snapshots';

export interface ExcalidrawCanvasProps {
  elements: unknown[];
  appState: {
    theme: 'dark';
    viewBackgroundColor: string;
    currentItemFontFamily: number;
  };
  onChange: (elements: readonly unknown[], appState: unknown) => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onReset: () => void;
  /** Current view slug ('canonical' or a snapshot name). */
  currentSlug: string;
  /** All available snapshots for the Views submenu. */
  snapshots: SnapshotEntry[];
}

const CATEGORY_TITLES: Record<SnapshotEntry['category'], string> = {
  flow: 'Flows',
  proposed: 'Proposed',
  decision: 'Decisions',
  kaleb: 'Feedback',
  other: 'Other',
};

const CATEGORY_ORDER: SnapshotEntry['category'][] = [
  'flow',
  'proposed',
  'kaleb',
  'decision',
  'other',
];

export default function ExcalidrawCanvas({
  elements,
  appState,
  onChange,
  onExportJSON,
  onImportJSON,
  onReset,
  currentSlug,
  snapshots,
}: ExcalidrawCanvasProps) {
  // Group snapshots by category for the Views submenu
  const grouped = new Map<SnapshotEntry['category'], SnapshotEntry[]>();
  snapshots.forEach((s) => {
    const list = grouped.get(s.category) ?? [];
    list.push(s);
    grouped.set(s.category, list);
  });

  const navigate = (href: string) => {
    window.location.href = href;
  };

  return (
    <Excalidraw
      initialData={{ elements: elements as never, appState }}
      onChange={onChange as never}
    >
      <MainMenu>
        {/* ─── Views (navigation) ──────────────────────────────────────── */}
        <MainMenu.Group title="Views">
          <MainMenu.Item
            onSelect={() => navigate('/')}
            selected={currentSlug === 'canonical'}
          >
            Canonical Architecture
          </MainMenu.Item>
          {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((category) => (
            <MainMenu.Group key={category} title={CATEGORY_TITLES[category]}>
              {grouped.get(category)!.map((snap) => (
                <MainMenu.Item
                  key={snap.slug}
                  onSelect={() => navigate(`/s/${snap.slug}`)}
                  selected={currentSlug === snap.slug}
                >
                  {snap.label}
                </MainMenu.Item>
              ))}
            </MainMenu.Group>
          ))}
        </MainMenu.Group>

        <MainMenu.Separator />

        {/* ─── Sigil actions ──────────────────────────────────────────── */}
        <MainMenu.Item onSelect={onExportJSON}>
          Export snapshot JSON
        </MainMenu.Item>
        <MainMenu.Item onSelect={onImportJSON}>
          Import snapshot JSON
        </MainMenu.Item>
        <MainMenu.Item onSelect={onReset}>Reset to canonical</MainMenu.Item>

        <MainMenu.Separator />

        {/* ─── Excalidraw defaults (restore the useful ones) ──────────── */}
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.SearchMenu />
        <MainMenu.DefaultItems.Help />

        <MainMenu.Separator />

        <MainMenu.DefaultItems.ToggleTheme />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
      </MainMenu>
    </Excalidraw>
  );
}
