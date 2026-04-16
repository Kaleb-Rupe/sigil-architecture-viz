'use client';

/**
 * ExcalidrawCanvas — inner client component that imports Excalidraw AND
 * MainMenu directly so we can pass MainMenu as a child.
 *
 * This is loaded via next/dynamic (ssr: false) from ExcalidrawWrapper
 * because @excalidraw/excalidraw touches `window` at module load time.
 */

import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

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
}

export default function ExcalidrawCanvas({
  elements,
  appState,
  onChange,
  onExportJSON,
  onImportJSON,
  onReset,
}: ExcalidrawCanvasProps) {
  return (
    <Excalidraw
      initialData={{ elements: elements as never, appState }}
      UIOptions={{ canvasActions: { saveToActiveFile: false } }}
      onChange={onChange as never}
    >
      <MainMenu>
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Export />
        <MainMenu.Separator />
        <MainMenu.Item onSelect={onExportJSON}>
          Export snapshot JSON
        </MainMenu.Item>
        <MainMenu.Item onSelect={onImportJSON}>
          Import snapshot JSON
        </MainMenu.Item>
        <MainMenu.Separator />
        <MainMenu.DefaultItems.ToggleTheme />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
        <MainMenu.Separator />
        <MainMenu.Item onSelect={onReset}>
          Reset to canonical
        </MainMenu.Item>
      </MainMenu>
    </Excalidraw>
  );
}
