// ─── Excalidraw Element Generator ───────────────────────────────────────────
// Reads architecture data and produces Excalidraw-compatible element arrays.
// Every "labeled rectangle" is TWO elements: the rect + a bound text element.

import {
  INSTRUCTIONS,
  PDAS,
  INSTRUCTION_GROUPS,
  getInstructionsByGroup,
  type InstructionGroup,
} from '@/data/onchain';
import { SDK_MODULES, type SdkModule } from '@/data/sdk';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExcalidrawElement {
  id: string;
  type: 'rectangle' | 'text' | 'arrow' | 'line' | 'diamond' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: 'solid' | 'hachure' | 'cross-hatch';
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
  opacity: number;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  groupIds: string[];
  frameId: null;
  index: string;
  roundness: { type: number } | null;
  boundElements: Array<{ id: string; type: string }> | null;
  updated: number;
  link: null;
  locked: boolean;
  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  containerId?: string | null;
  originalText?: string;
  autoResize?: boolean;
  lineHeight?: number;
  // Arrow-specific
  startBinding?: { elementId: string; focus: number; gap: number; fixedPoint: null } | null;
  endBinding?: { elementId: string; focus: number; gap: number; fixedPoint: null } | null;
  lastCommittedPoint?: null;
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  points?: number[][];
  elbowed?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let _seed = 1000;
function nextSeed(): number {
  return _seed++;
}

let _idx = 0;
function nextIndex(): string {
  return `a${(_idx++).toString().padStart(5, '0')}`;
}

function makeRect(opts: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string;
  bg?: string;
  fill?: 'solid' | 'hachure' | 'cross-hatch';
  strokeW?: number;
  strokeS?: 'solid' | 'dashed' | 'dotted';
  rough?: number;
  opacity?: number;
  rounded?: boolean;
  groups?: string[];
  boundTextId?: string;
}): ExcalidrawElement {
  const boundElements: Array<{ id: string; type: string }> = [];
  if (opts.boundTextId) {
    boundElements.push({ id: opts.boundTextId, type: 'text' });
  }
  return {
    id: opts.id,
    type: 'rectangle',
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    angle: 0,
    strokeColor: opts.stroke ?? '#e2e8f0',
    backgroundColor: opts.bg ?? 'transparent',
    fillStyle: opts.fill ?? 'solid',
    strokeWidth: opts.strokeW ?? 1,
    strokeStyle: opts.strokeS ?? 'solid',
    roughness: opts.rough ?? 1,
    opacity: opts.opacity ?? 100,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    groupIds: opts.groups ?? [],
    frameId: null,
    index: nextIndex(),
    roundness: opts.rounded !== false ? { type: 3 } : null,
    boundElements: boundElements.length > 0 ? boundElements : null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

function makeText(opts: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  size?: number;
  family?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'middle' | 'bottom';
  containerId?: string | null;
  groups?: string[];
  opacity?: number;
}): ExcalidrawElement {
  return {
    id: opts.id,
    type: 'text',
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    angle: 0,
    strokeColor: opts.color ?? '#e2e8f0',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: opts.opacity ?? 100,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    groupIds: opts.groups ?? [],
    frameId: null,
    index: nextIndex(),
    roundness: null,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    text: opts.text,
    fontSize: opts.size ?? 16,
    fontFamily: opts.family ?? 1,
    textAlign: opts.align ?? 'center',
    verticalAlign: opts.vAlign ?? 'middle',
    containerId: opts.containerId ?? null,
    originalText: opts.text,
    autoResize: true,
    lineHeight: 1.25,
  };
}

function makeArrow(opts: {
  id: string;
  x: number;
  y: number;
  points: number[][];
  stroke?: string;
  strokeW?: number;
  strokeS?: 'solid' | 'dashed' | 'dotted';
  startId?: string;
  endId?: string;
  opacity?: number;
  groups?: string[];
}): ExcalidrawElement {
  return {
    id: opts.id,
    type: 'arrow',
    x: opts.x,
    y: opts.y,
    width: Math.abs(opts.points[1]?.[0] ?? 0),
    height: Math.abs(opts.points[1]?.[1] ?? 0),
    angle: 0,
    strokeColor: opts.stroke ?? '#f59e0b',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: opts.strokeW ?? 1,
    strokeStyle: opts.strokeS ?? 'solid',
    roughness: 1,
    opacity: opts.opacity ?? 60,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    groupIds: opts.groups ?? [],
    frameId: null,
    index: nextIndex(),
    roundness: { type: 2 },
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    startBinding: opts.startId
      ? { elementId: opts.startId, focus: 0, gap: 5, fixedPoint: null }
      : null,
    endBinding: opts.endId
      ? { elementId: opts.endId, focus: 0, gap: 5, fixedPoint: null }
      : null,
    lastCommittedPoint: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
    points: opts.points,
    elbowed: false,
  };
}

function makeLine(opts: {
  id: string;
  x: number;
  y: number;
  points: number[][];
  stroke?: string;
  strokeW?: number;
  strokeS?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
}): ExcalidrawElement {
  return {
    id: opts.id,
    type: 'line' as any,
    x: opts.x,
    y: opts.y,
    width: Math.abs(opts.points[1]?.[0] ?? 0),
    height: Math.abs(opts.points[1]?.[1] ?? 0),
    angle: 0,
    strokeColor: opts.stroke ?? '#f59e0b',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: opts.strokeW ?? 2,
    strokeStyle: opts.strokeS ?? 'dashed',
    roughness: 1,
    opacity: opts.opacity ?? 100,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    groupIds: [],
    frameId: null,
    index: nextIndex(),
    roundness: null,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    points: opts.points,
    lastCommittedPoint: null,
    startArrowhead: null,
    endArrowhead: null,
  };
}

/** Create a labeled rectangle (rect + bound text) */
function labeledRect(opts: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  stroke?: string;
  bg?: string;
  fill?: 'solid' | 'hachure' | 'cross-hatch';
  strokeW?: number;
  strokeS?: 'solid' | 'dashed' | 'dotted';
  rough?: number;
  opacity?: number;
  rounded?: boolean;
  groups?: string[];
  textSize?: number;
  textColor?: string;
  textFamily?: number;
}): ExcalidrawElement[] {
  const textId = `${opts.id}_text`;
  const rect = makeRect({
    ...opts,
    boundTextId: textId,
  });
  const text = makeText({
    id: textId,
    x: opts.x + 10,
    y: opts.y,
    width: opts.width - 20,
    height: opts.height,
    text: opts.label,
    size: opts.textSize ?? 14,
    color: opts.textColor ?? '#e2e8f0',
    family: opts.textFamily ?? 1,
    containerId: opts.id,
    groups: opts.groups,
    opacity: opts.opacity,
  });
  return [rect, text];
}

// ─── Layout Constants ───────────────────────────────────────────────────────

const CANVAS_PADDING = 60;
const GROUP_BOX_W = 350;
const GROUP_BOX_GAP = 50;
const IX_RECT_W = 160;
const IX_RECT_H = 36;
const IX_GAP = 6;
const IX_PADDING_TOP = 44;
const IX_PADDING_LEFT = 20;
const IX_COLS = 2;
const IX_COL_GAP = 8;

const PDA_RECT_W = 145;
const PDA_RECT_H = 55;
const PDA_GAP = 16;

const SDK_MODULE_W = 170;
const SDK_MODULE_H = 42;
const SDK_GAP = 8;
const SDK_GROUP_PAD_TOP = 44;
const SDK_GROUP_PAD_LEFT = 16;

// ─── District positions ─────────────────────────────────────────────────────

const ONCHAIN_X = CANVAS_PADDING;
const ONCHAIN_Y = CANVAS_PADDING;

const GROUP_LABELS: Record<InstructionGroup, string> = {
  vault: 'Vault (5)',
  agent: 'Agent (9)',
  auth: 'Auth (2)',
  policy: 'Policy (3)',
  constraints: 'Constraints (9)',
  escrow: 'Escrow (4)',
  transfer: 'Transfer (1)',
  assertions: 'Assertions (2)',
};

// ─── Main Generator ─────────────────────────────────────────────────────────

export function generateElements(): { elements: ExcalidrawElement[] } {
  // Reset counters
  _seed = 1000;
  _idx = 0;

  const elements: ExcalidrawElement[] = [];

  // Track element positions for arrow generation
  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ON-CHAIN DISTRICT
  // ═══════════════════════════════════════════════════════════════════════════

  // Compute group box heights
  const groupHeights: Record<string, number> = {};
  for (const g of INSTRUCTION_GROUPS) {
    const ixs = getInstructionsByGroup(g);
    const rows = Math.ceil(ixs.length / IX_COLS);
    groupHeights[g] = IX_PADDING_TOP + rows * (IX_RECT_H + IX_GAP) + 20;
  }

  // Row 1: vault, agent, auth, policy
  const row1Groups: InstructionGroup[] = ['vault', 'agent', 'auth', 'policy'];
  // Row 2: constraints, escrow, transfer, assertions
  const row2Groups: InstructionGroup[] = ['constraints', 'escrow', 'transfer', 'assertions'];

  const row1MaxH = Math.max(...row1Groups.map((g) => groupHeights[g]));
  const row2MaxH = Math.max(...row2Groups.map((g) => groupHeights[g]));

  const groupRow1Y = ONCHAIN_Y + 70;
  const groupRow2Y = groupRow1Y + row1MaxH + 40;

  const pdaRowY = groupRow2Y + row2MaxH + 50;
  const onchainDistrictH = pdaRowY + PDA_RECT_H + 40 - ONCHAIN_Y;
  const totalGroupsW = 4 * GROUP_BOX_W + 3 * GROUP_BOX_GAP;
  const onchainDistrictW = totalGroupsW + 2 * 40;

  // On-chain district container
  const onchainDistId = 'district_onchain';
  const onchainDistTextId = 'district_onchain_title';
  elements.push(
    makeRect({
      id: onchainDistId,
      x: ONCHAIN_X,
      y: ONCHAIN_Y,
      width: onchainDistrictW,
      height: onchainDistrictH,
      stroke: '#3B82F6',
      strokeW: 2,
      strokeS: 'solid',
      rough: 1,
      opacity: 40,
      bg: 'rgba(59, 130, 246, 0.03)',
      fill: 'solid',
      rounded: true,
    })
  );
  elements.push(
    makeText({
      id: onchainDistTextId,
      x: ONCHAIN_X + 20,
      y: ONCHAIN_Y + 12,
      width: 500,
      height: 36,
      text: 'ON-CHAIN PROGRAM (Sigil)',
      size: 28,
      color: '#3B82F6',
      family: 1,
      align: 'left',
    })
  );

  // ── Instruction Groups ────────────────────────────────────────────────────

  function renderGroupRow(
    groups: InstructionGroup[],
    startY: number,
    maxH: number
  ) {
    groups.forEach((g, col) => {
      const groupX = ONCHAIN_X + 40 + col * (GROUP_BOX_W + GROUP_BOX_GAP);
      const groupY = startY;
      const groupH = maxH;
      const groupId = `group_${g}`;
      const groupTextId = `group_${g}_label`;

      // Group box
      elements.push(
        makeRect({
          id: groupId,
          x: groupX,
          y: groupY,
          width: GROUP_BOX_W,
          height: groupH,
          stroke: '#475569',
          strokeW: 1,
          strokeS: 'dashed',
          rough: 1,
          opacity: 50,
          rounded: true,
        })
      );
      // Group label
      elements.push(
        makeText({
          id: groupTextId,
          x: groupX + 12,
          y: groupY + 8,
          width: GROUP_BOX_W - 24,
          height: 24,
          text: GROUP_LABELS[g],
          size: 15,
          color: '#94A3B8',
          family: 1,
          align: 'left',
        })
      );

      // Instructions inside group
      const ixs = getInstructionsByGroup(g);
      ixs.forEach((ix, i) => {
        const ixCol = i % IX_COLS;
        const ixRow = Math.floor(i / IX_COLS);
        const ixX = groupX + IX_PADDING_LEFT + ixCol * (IX_RECT_W + IX_COL_GAP);
        const ixY = groupY + IX_PADDING_TOP + ixRow * (IX_RECT_H + IX_GAP);
        const ixId = `ix_${ix.id}`;

        const ixEls = labeledRect({
          id: ixId,
          x: ixX,
          y: ixY,
          width: IX_RECT_W,
          height: IX_RECT_H,
          label: ix.displayName,
          stroke: '#3B82F6',
          bg: 'rgba(59, 130, 246, 0.12)',
          fill: 'solid',
          strokeW: 1,
          rough: 1,
          opacity: 100,
          rounded: true,
          textSize: 12,
          textColor: '#93C5FD',
          textFamily: 3,
        });
        elements.push(...ixEls);
        positions[ixId] = { x: ixX, y: ixY, w: IX_RECT_W, h: IX_RECT_H };
      });
    });
  }

  renderGroupRow(row1Groups, groupRow1Y, row1MaxH);
  renderGroupRow(row2Groups, groupRow2Y, row2MaxH);

  // ── PDA Row ───────────────────────────────────────────────────────────────

  const pdaTotalW = PDAS.length * PDA_RECT_W + (PDAS.length - 1) * PDA_GAP;
  const pdaStartX = ONCHAIN_X + (onchainDistrictW - pdaTotalW) / 2;

  // PDA section label
  elements.push(
    makeText({
      id: 'pda_section_label',
      x: ONCHAIN_X + 20,
      y: pdaRowY - 28,
      width: 200,
      height: 22,
      text: 'PDAs (12 Account Types)',
      size: 14,
      color: '#10B981',
      family: 1,
      align: 'left',
    })
  );

  PDAS.forEach((pda, i) => {
    const pdaX = pdaStartX + i * (PDA_RECT_W + PDA_GAP);
    const pdaY = pdaRowY;
    const pdaId = `pda_${pda.id}`;

    const sizeLabel = pda.zeroCopy ? `${pda.size} (ZC)` : pda.size;
    const pdaEls = labeledRect({
      id: pdaId,
      x: pdaX,
      y: pdaY,
      width: PDA_RECT_W,
      height: PDA_RECT_H,
      label: `${pda.displayName}\n${sizeLabel}`,
      stroke: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)',
      fill: 'solid',
      strokeW: 1,
      rough: 1,
      opacity: 100,
      rounded: true,
      textSize: 10,
      textColor: '#6EE7B7',
      textFamily: 3,
    });
    elements.push(...pdaEls);
    positions[pdaId] = { x: pdaX, y: pdaY, w: PDA_RECT_W, h: PDA_RECT_H };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. RPC BOUNDARY LINE
  // ═══════════════════════════════════════════════════════════════════════════

  const boundaryY = ONCHAIN_Y + onchainDistrictH + 40;
  elements.push(
    makeLine({
      id: 'rpc_boundary_line',
      x: ONCHAIN_X,
      y: boundaryY,
      points: [
        [0, 0],
        [onchainDistrictW, 0],
      ],
      stroke: '#F59E0B',
      strokeW: 3,
      strokeS: 'dashed',
      opacity: 70,
    })
  );
  elements.push(
    makeText({
      id: 'rpc_boundary_label',
      x: ONCHAIN_X + onchainDistrictW / 2 - 100,
      y: boundaryY - 28,
      width: 200,
      height: 24,
      text: 'RPC Boundary',
      size: 18,
      color: '#F59E0B',
      family: 1,
      align: 'center',
    })
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SDK DISTRICT
  // ═══════════════════════════════════════════════════════════════════════════

  const sdkDistY = boundaryY + 50;
  const sdkDistX = ONCHAIN_X;

  // Group SDK modules by subpath
  const sdkGroups: Record<string, SdkModule[]> = {};
  for (const mod of SDK_MODULES) {
    if (!sdkGroups[mod.subpath]) sdkGroups[mod.subpath] = [];
    sdkGroups[mod.subpath].push(mod);
  }

  const SDK_GROUP_LABELS: Record<string, string> = {
    root: 'Root Modules',
    dashboard: 'Dashboard (/dashboard)',
    x402: 'x402 (/x402)',
    tee: 'TEE (/tee)',
    errors: 'Errors (/errors)',
    core: 'Core Engine (/core)',
    testing: 'Testing (/testing)',
    integrations: 'Planned Integrations',
  };

  // Layout SDK groups in rows
  // Row 1 (large): root split into tx-builders, state/analytics, shield/misc
  // Row 2: dashboard, x402, tee, errors, core, integrations

  // Split root modules into sub-categories for layout
  const rootModules = sdkGroups['root'] ?? [];
  const rootTxBuilders = rootModules.filter((m) => m.category === 'tx-builder');
  const rootRpcConsumers = rootModules.filter((m) => m.category === 'rpc-consumer');
  const rootPureComputation = rootModules.filter(
    (m) => m.category === 'pure-computation'
  );
  const rootErrorHandling = rootModules.filter(
    (m) => m.category === 'error-handling'
  );
  const rootTypeDefs = rootModules.filter((m) => m.category === 'type-defs');

  // Sub-group definitions for the root subpath
  const sdkSubGroups = [
    {
      id: 'sdk_sg_tx',
      label: 'TX Builders & Executors',
      modules: [...rootTxBuilders, ...rootRpcConsumers],
    },
    {
      id: 'sdk_sg_analytics',
      label: 'Analytics & Pure Computation',
      modules: rootPureComputation,
    },
    {
      id: 'sdk_sg_infra',
      label: 'Errors, Types & Infrastructure',
      modules: [...rootErrorHandling, ...rootTypeDefs],
    },
  ];

  // Row 2 groups (non-root)
  const sdkRow2Entries = [
    { key: 'dashboard', modules: sdkGroups['dashboard'] ?? [] },
    { key: 'x402', modules: sdkGroups['x402'] ?? [] },
    { key: 'tee', modules: sdkGroups['tee'] ?? [] },
    { key: 'errors', modules: sdkGroups['errors'] ?? [] },
    { key: 'core', modules: sdkGroups['core'] ?? [] },
    { key: 'integrations', modules: sdkGroups['integrations'] ?? [] },
  ];

  // ── SDK Row 1: Root sub-groups ────────────────────────────────────────────

  const SDK_SUBGROUP_W = 380;
  const SDK_SUBGROUP_GAP = 30;
  const sdkRow1Y = sdkDistY + 70;

  // Compute heights for each sub-group
  function computeSdkGroupH(modules: SdkModule[], cols: number = 2): number {
    const rows = Math.ceil(modules.length / cols);
    return SDK_GROUP_PAD_TOP + rows * (SDK_MODULE_H + SDK_GAP) + 16;
  }

  const sdkRow1MaxH = Math.max(...sdkSubGroups.map((sg) => computeSdkGroupH(sg.modules)));

  sdkSubGroups.forEach((sg, col) => {
    const sgX = sdkDistX + 40 + col * (SDK_SUBGROUP_W + SDK_SUBGROUP_GAP);
    const sgY = sdkRow1Y;
    const sgH = sdkRow1MaxH;

    elements.push(
      makeRect({
        id: sg.id,
        x: sgX,
        y: sgY,
        width: SDK_SUBGROUP_W,
        height: sgH,
        stroke: '#6B7280',
        strokeW: 1,
        strokeS: 'dashed',
        rough: 1,
        opacity: 40,
        rounded: true,
      })
    );
    elements.push(
      makeText({
        id: `${sg.id}_label`,
        x: sgX + 12,
        y: sgY + 8,
        width: SDK_SUBGROUP_W - 24,
        height: 22,
        text: sg.label,
        size: 13,
        color: '#94A3B8',
        family: 1,
        align: 'left',
      })
    );

    sg.modules.forEach((mod, i) => {
      const modCol = i % 2;
      const modRow = Math.floor(i / 2);
      const modX = sgX + SDK_GROUP_PAD_LEFT + modCol * (SDK_MODULE_W + 8);
      const modY = sgY + SDK_GROUP_PAD_TOP + modRow * (SDK_MODULE_H + SDK_GAP);
      const modId = `sdk_${mod.id}`;

      const isPublic = mod.public;
      const isImpl = mod.implemented;
      const stroke = !isImpl ? '#374151' : isPublic ? '#8B5CF6' : '#6B7280';
      const bg = !isImpl
        ? 'rgba(55, 65, 81, 0.08)'
        : isPublic
          ? 'rgba(139, 92, 246, 0.12)'
          : 'rgba(107, 114, 128, 0.08)';
      const textColor = !isImpl ? '#4B5563' : isPublic ? '#C4B5FD' : '#9CA3AF';
      const modOpacity = !isImpl ? 50 : 100;
      const strokeStyle = !isImpl ? 'dashed' as const : 'solid' as const;

      const modEls = labeledRect({
        id: modId,
        x: modX,
        y: modY,
        width: SDK_MODULE_W,
        height: SDK_MODULE_H,
        label: mod.displayName,
        stroke,
        bg,
        fill: 'solid',
        strokeW: 1,
        strokeS: strokeStyle,
        rough: 1,
        opacity: modOpacity,
        rounded: true,
        textSize: 11,
        textColor,
        textFamily: 3,
      });
      elements.push(...modEls);
      positions[modId] = { x: modX, y: modY, w: SDK_MODULE_W, h: SDK_MODULE_H };
    });
  });

  // ── SDK Row 2: Non-root groups ────────────────────────────────────────────

  const sdkRow2Y = sdkRow1Y + sdkRow1MaxH + 40;
  const SDK_ROW2_GROUP_W = Math.floor(
    (onchainDistrictW - 80 - 5 * 20) / 6
  );
  const SDK_ROW2_GAP = 20;

  const sdkRow2Heights = sdkRow2Entries.map((e) =>
    computeSdkGroupH(e.modules, 1)
  );
  const sdkRow2MaxH = Math.max(...sdkRow2Heights, 120);

  sdkRow2Entries.forEach((entry, col) => {
    const grpX = sdkDistX + 40 + col * (SDK_ROW2_GROUP_W + SDK_ROW2_GAP);
    const grpY = sdkRow2Y;
    const grpH = sdkRow2MaxH;
    const grpId = `sdk_group_${entry.key}`;

    const isUnimpl = entry.key === 'integrations';
    const grpStroke = isUnimpl ? '#374151' : '#6B7280';
    const grpOpacity = isUnimpl ? 35 : 40;

    elements.push(
      makeRect({
        id: grpId,
        x: grpX,
        y: grpY,
        width: SDK_ROW2_GROUP_W,
        height: grpH,
        stroke: grpStroke,
        strokeW: 1,
        strokeS: 'dashed',
        rough: 1,
        opacity: grpOpacity,
        rounded: true,
      })
    );
    elements.push(
      makeText({
        id: `${grpId}_label`,
        x: grpX + 8,
        y: grpY + 8,
        width: SDK_ROW2_GROUP_W - 16,
        height: 22,
        text: SDK_GROUP_LABELS[entry.key] ?? entry.key,
        size: 12,
        color: isUnimpl ? '#4B5563' : '#94A3B8',
        family: 1,
        align: 'left',
      })
    );

    entry.modules.forEach((mod, i) => {
      const modX = grpX + 12;
      const modY = grpY + SDK_GROUP_PAD_TOP + i * (SDK_MODULE_H + SDK_GAP);
      const modId = `sdk_${mod.id}`;
      const modW = SDK_ROW2_GROUP_W - 24;

      const isPublic = mod.public;
      const isImpl = mod.implemented;
      const stroke = !isImpl ? '#374151' : isPublic ? '#8B5CF6' : '#6B7280';
      const bg = !isImpl
        ? 'rgba(55, 65, 81, 0.08)'
        : isPublic
          ? 'rgba(139, 92, 246, 0.12)'
          : 'rgba(107, 114, 128, 0.08)';
      const textColor = !isImpl ? '#4B5563' : isPublic ? '#C4B5FD' : '#9CA3AF';
      const modOpacity = !isImpl ? 50 : 100;
      const strokeStyle = !isImpl ? 'dashed' as const : 'solid' as const;

      const modEls = labeledRect({
        id: modId,
        x: modX,
        y: modY,
        width: modW,
        height: SDK_MODULE_H,
        label: mod.displayName,
        stroke,
        bg,
        fill: 'solid',
        strokeW: 1,
        strokeS: strokeStyle,
        rough: 1,
        opacity: modOpacity,
        rounded: true,
        textSize: 11,
        textColor,
        textFamily: 3,
      });
      elements.push(...modEls);
      positions[modId] = { x: modX, y: modY, w: modW, h: SDK_MODULE_H };
    });
  });

  // SDK district container
  const sdkDistH = sdkRow2Y + sdkRow2MaxH + 30 - sdkDistY;
  elements.push(
    makeRect({
      id: 'district_sdk',
      x: sdkDistX,
      y: sdkDistY,
      width: onchainDistrictW,
      height: sdkDistH,
      stroke: '#8B5CF6',
      strokeW: 2,
      strokeS: 'solid',
      rough: 1,
      opacity: 30,
      bg: 'rgba(139, 92, 246, 0.02)',
      fill: 'solid',
      rounded: true,
    })
  );
  elements.push(
    makeText({
      id: 'district_sdk_title',
      x: sdkDistX + 20,
      y: sdkDistY + 12,
      width: 400,
      height: 36,
      text: 'SDK (@usesigil/kit)',
      size: 28,
      color: '#8B5CF6',
      family: 1,
      align: 'left',
    })
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CROSS-BOUNDARY ARROWS (SDK -> On-Chain PDAs)
  // ═══════════════════════════════════════════════════════════════════════════

  const crossBoundaryEdges: Array<{
    srcId: string;
    tgtId: string;
    label?: string;
    stroke?: string;
  }> = [
    { srcId: 'sdk_seal', tgtId: 'ix_validate_and_authorize', stroke: '#F59E0B' },
    { srcId: 'sdk_seal', tgtId: 'ix_finalize_session', stroke: '#F59E0B' },
    { srcId: 'sdk_state-resolver', tgtId: 'pda_AgentVault', stroke: '#F59E0B' },
    { srcId: 'sdk_state-resolver', tgtId: 'pda_PolicyConfig', stroke: '#F59E0B' },
    { srcId: 'sdk_state-resolver', tgtId: 'pda_SpendTracker', stroke: '#F59E0B' },
    { srcId: 'sdk_state-resolver', tgtId: 'pda_AgentSpendOverlay', stroke: '#F59E0B' },
    { srcId: 'sdk_resolve-accounts', tgtId: 'pda_AgentVault', stroke: '#D4A843' },
    { srcId: 'sdk_create-vault', tgtId: 'ix_initialize_vault', stroke: '#F59E0B' },
    { srcId: 'sdk_owner-transaction', tgtId: 'ix_register_agent', stroke: '#F59E0B' },
    { srcId: 'sdk_owner-transaction', tgtId: 'ix_queue_policy_update', stroke: '#F59E0B' },
    { srcId: 'sdk_balance-tracker', tgtId: 'pda_AgentVault', stroke: '#F59E0B' },
    { srcId: 'sdk_events', tgtId: 'pda_AgentVault', stroke: '#A855F7' },
  ];

  crossBoundaryEdges.forEach((edge, i) => {
    const src = positions[edge.srcId];
    const tgt = positions[edge.tgtId];
    if (!src || !tgt) return;

    const srcCx = src.x + src.w / 2;
    const srcTop = src.y;
    const tgtCx = tgt.x + tgt.w / 2;
    const tgtBot = tgt.y + tgt.h;

    const dx = tgtCx - srcCx;
    const dy = tgtBot - srcTop;

    elements.push(
      makeArrow({
        id: `arrow_cross_${i}`,
        x: srcCx,
        y: srcTop,
        points: [
          [0, 0],
          [dx, dy],
        ],
        stroke: edge.stroke ?? '#F59E0B',
        strokeW: 1,
        strokeS: 'dotted',
        startId: edge.srcId,
        endId: edge.tgtId,
        opacity: 35,
      })
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. LEGEND
  // ═══════════════════════════════════════════════════════════════════════════

  const legendX = ONCHAIN_X + onchainDistrictW + 40;
  const legendY = ONCHAIN_Y;

  elements.push(
    ...labeledRect({
      id: 'legend_box',
      x: legendX,
      y: legendY,
      width: 220,
      height: 220,
      label: '',
      stroke: '#475569',
      strokeW: 1,
      strokeS: 'solid',
      rough: 1,
      opacity: 40,
      rounded: true,
    })
  );
  elements.push(
    makeText({
      id: 'legend_title',
      x: legendX + 16,
      y: legendY + 12,
      width: 188,
      height: 24,
      text: 'Legend',
      size: 16,
      color: '#E2E8F0',
      family: 1,
      align: 'left',
    })
  );

  const legendItems = [
    { color: '#3B82F6', label: 'On-Chain Instruction' },
    { color: '#10B981', label: 'PDA Account' },
    { color: '#8B5CF6', label: 'SDK Module (public)' },
    { color: '#6B7280', label: 'SDK Module (internal)' },
    { color: '#374151', label: 'Planned (unimplemented)' },
    { color: '#F59E0B', label: 'RPC Boundary Edge' },
  ];

  legendItems.forEach((item, i) => {
    const itemY = legendY + 48 + i * 28;
    // Color swatch
    elements.push(
      makeRect({
        id: `legend_swatch_${i}`,
        x: legendX + 16,
        y: itemY,
        width: 16,
        height: 16,
        stroke: item.color,
        bg: item.color,
        fill: 'solid',
        strokeW: 1,
        rough: 0,
        opacity: 80,
        rounded: true,
      })
    );
    // Label
    elements.push(
      makeText({
        id: `legend_label_${i}`,
        x: legendX + 40,
        y: itemY - 2,
        width: 170,
        height: 20,
        text: item.label,
        size: 12,
        color: '#94A3B8',
        family: 1,
        align: 'left',
      })
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. STATS BOX
  // ═══════════════════════════════════════════════════════════════════════════

  const statsY = legendY + 240;
  elements.push(
    ...labeledRect({
      id: 'stats_box',
      x: legendX,
      y: statsY,
      width: 220,
      height: 160,
      label: '',
      stroke: '#475569',
      strokeW: 1,
      strokeS: 'solid',
      rough: 1,
      opacity: 40,
      rounded: true,
    })
  );
  elements.push(
    makeText({
      id: 'stats_title',
      x: legendX + 16,
      y: statsY + 12,
      width: 188,
      height: 24,
      text: 'Architecture Stats',
      size: 16,
      color: '#E2E8F0',
      family: 1,
      align: 'left',
    })
  );

  const implCount = SDK_MODULES.filter((m) => m.implemented).length;
  const plannedCount = SDK_MODULES.filter((m) => !m.implemented).length;
  const statsLines = [
    `${INSTRUCTIONS.length} Instructions`,
    `${PDAS.length} PDA Types`,
    `${SDK_MODULES.length} SDK Modules`,
    `${implCount} Implemented / ${plannedCount} Planned`,
  ];
  statsLines.forEach((line, i) => {
    elements.push(
      makeText({
        id: `stats_line_${i}`,
        x: legendX + 16,
        y: statsY + 48 + i * 26,
        width: 188,
        height: 20,
        text: line,
        size: 13,
        color: '#D4A843',
        family: 3,
        align: 'left',
      })
    );
  });

  return { elements: elements as any };
}
