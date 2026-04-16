'use client';

import { useEffect, useRef, useState } from 'react';
import type { SnapshotEntry } from '@/lib/list-snapshots';

interface NavMenuProps {
  /** Current snapshot slug, or 'canonical' for the main page. */
  currentSlug: string;
  /** All available snapshots — passed in from server component. */
  snapshots: SnapshotEntry[];
}

const CATEGORY_LABELS: Record<SnapshotEntry['category'], string> = {
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

export default function NavMenu({ currentSlug, snapshots }: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open]);

  const grouped = new Map<SnapshotEntry['category'], SnapshotEntry[]>();
  snapshots.forEach((s) => {
    const list = grouped.get(s.category) ?? [];
    list.push(s);
    grouped.set(s.category, list);
  });

  const currentLabel =
    currentSlug === 'canonical'
      ? 'Canonical Architecture'
      : (snapshots.find((s) => s.slug === currentSlug)?.label ??
        currentSlug);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: 12,
        left: 60,
        zIndex: 20,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'rgba(15, 15, 15, 0.92)',
          border: '1px solid #D4A843',
          color: '#D4A843',
          padding: '6px 12px',
          fontFamily: 'monospace',
          fontSize: 12,
          cursor: 'pointer',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ opacity: 0.6 }}>view:</span>
        <span>{currentLabel}</span>
        <span style={{ opacity: 0.6 }}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 6,
            background: 'rgba(15, 15, 15, 0.95)',
            border: '1px solid #D4A843',
            borderRadius: 4,
            minWidth: 280,
            maxHeight: '70vh',
            overflowY: 'auto',
            padding: 4,
          }}
        >
          {/* Canonical (always first) */}
          <NavLink
            href="/"
            label="Canonical Architecture"
            description="Live-rendered from code"
            active={currentSlug === 'canonical'}
          />

          {/* Grouped snapshots */}
          {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((category) => (
            <div key={category} style={{ marginTop: 8 }}>
              <div
                style={{
                  color: '#9CA3AF',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  padding: '4px 8px',
                  opacity: 0.7,
                }}
              >
                {CATEGORY_LABELS[category]}
              </div>
              {grouped.get(category)!.map((snap) => (
                <NavLink
                  key={snap.slug}
                  href={`/s/${snap.slug}`}
                  label={snap.label}
                  active={currentSlug === snap.slug}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  label,
  description,
  active,
}: {
  href: string;
  label: string;
  description?: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        padding: '8px 10px',
        color: active ? '#D4A843' : '#E5E7EB',
        background: active ? 'rgba(212, 168, 67, 0.15)' : 'transparent',
        fontFamily: 'monospace',
        fontSize: 12,
        textDecoration: 'none',
        borderRadius: 3,
        borderLeft: active ? '2px solid #D4A843' : '2px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div>{label}</div>
      {description && (
        <div
          style={{
            fontSize: 10,
            opacity: 0.5,
            marginTop: 2,
          }}
        >
          {description}
        </div>
      )}
    </a>
  );
}
