// ─── Flow Renderer ──────────────────────────────────────────────────────────
// Turns a FlowDefinition into Excalidraw elements arranged as swim lanes
// (horizontal actor columns) with numbered steps (vertical time axis).

import { ACTORS, DEFAULT_LANE_ORDER } from './actors';
import type { ActorId, FlowDefinition, FlowStep } from './types';

// ─── Layout constants ───────────────────────────────────────────────────────

const LANE_WIDTH = 260;
const LANE_GAP = 20;
const STEP_MIN_HEIGHT = 140;
const STEP_V_GAP = 30;
const HEADER_HEIGHT = 120; // title + description
const LANE_HEADER_HEIGHT = 60; // actor label row
const MARGIN_X = 40;
const MARGIN_TOP = 40;
const STEP_NUMBER_COL_WIDTH = 60; // left-side numbered gutter
const CARD_PADDING = 12;

// ─── Element factory ────────────────────────────────────────────────────────

let seedCounter = 1;
let indexCounter = 0;
function nextSeed(): number {
  return seedCounter++;
}
function nextIndex(): string {
  // Excalidraw requires fractional indexing — just monotonically increasing strings work
  return 'a' + String(indexCounter++).padStart(4, '0');
}

interface BaseElementOpts {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: 'solid' | 'hachure' | 'cross-hatch';
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  roughness?: number;
  opacity?: number;
  groupIds?: string[];
  roundness?: { type: number } | null;
  boundElements?: Array<{ id: string; type: string }> | null;
}

function mkBase(opts: BaseElementOpts) {
  return {
    id: opts.id ?? `el-${seedCounter}`,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    angle: 0,
    strokeColor: opts.strokeColor ?? '#FFFFFF',
    backgroundColor: opts.backgroundColor ?? 'transparent',
    fillStyle: opts.fillStyle ?? 'solid',
    strokeWidth: opts.strokeWidth ?? 1,
    strokeStyle: opts.strokeStyle ?? 'solid',
    roughness: opts.roughness ?? 1,
    opacity: opts.opacity ?? 100,
    seed: nextSeed(),
    version: 1,
    versionNonce: nextSeed(),
    isDeleted: false,
    groupIds: opts.groupIds ?? [],
    frameId: null as null,
    index: nextIndex(),
    roundness: opts.roundness ?? null,
    boundElements: opts.boundElements ?? null,
    updated: Date.now(),
    link: null as null,
    locked: false,
  };
}

function mkRect(opts: BaseElementOpts) {
  return { ...mkBase(opts), type: 'rectangle' as const };
}

function mkArrow(opts: BaseElementOpts & {
  points: Array<[number, number]>;
  startBindingId?: string;
  endBindingId?: string;
}) {
  return {
    ...mkBase(opts),
    type: 'arrow' as const,
    points: opts.points,
    lastCommittedPoint: null,
    startBinding: opts.startBindingId
      ? { elementId: opts.startBindingId, focus: 0, gap: 4 }
      : null,
    endBinding: opts.endBindingId
      ? { elementId: opts.endBindingId, focus: 0, gap: 4 }
      : null,
    startArrowhead: null,
    endArrowhead: 'arrow',
  };
}

function mkText(opts: BaseElementOpts & {
  text: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  containerId?: string | null;
}) {
  const fontSize = opts.fontSize ?? 16;
  const fontFamily = opts.fontFamily ?? 1; // 1=Virgil(hand), 2=Helvetica, 3=Cascadia(code)
  const lines = opts.text.split('\n').length;
  return {
    ...mkBase(opts),
    type: 'text' as const,
    text: opts.text,
    fontSize,
    fontFamily,
    textAlign: opts.textAlign ?? 'left',
    verticalAlign: opts.verticalAlign ?? 'top',
    containerId: opts.containerId ?? null,
    originalText: opts.text,
    autoResize: true,
    lineHeight: 1.25,
    baseline: fontSize * lines * 1.25,
  };
}

// ─── Flow renderer ──────────────────────────────────────────────────────────

export function generateFlowElements(flow: FlowDefinition): {
  elements: unknown[];
} {
  // Reset counters for deterministic output per flow
  seedCounter = 1;
  indexCounter = 0;

  const elements: unknown[] = [];

  // 1. Determine visible lanes (only actors actually used by steps)
  const usedActors = new Set<ActorId>();
  for (const step of flow.steps) usedActors.add(step.actor);
  const lanes = (flow.lanes ?? DEFAULT_LANE_ORDER).filter((a) =>
    usedActors.has(a)
  );

  // 2. Header — title + description
  elements.push(
    mkText({
      x: MARGIN_X,
      y: MARGIN_TOP,
      width: 800,
      height: 40,
      text: flow.title,
      fontSize: 28,
      fontFamily: 1,
      strokeColor: '#D4A843',
    })
  );
  elements.push(
    mkText({
      x: MARGIN_X,
      y: MARGIN_TOP + 46,
      width: 1000,
      height: 22,
      text: flow.description,
      fontSize: 14,
      fontFamily: 1,
      strokeColor: '#9CA3AF',
    })
  );

  // 3. Lane headers (actor columns)
  const lanesStartX = MARGIN_X + STEP_NUMBER_COL_WIDTH;
  const lanesStartY = MARGIN_TOP + HEADER_HEIGHT;

  lanes.forEach((actorId, idx) => {
    const actor = ACTORS[actorId];
    const laneX = lanesStartX + idx * (LANE_WIDTH + LANE_GAP);

    // Lane header box
    const headerId = `lane-header-${actor.id}`;
    const headerText = mkText({
      id: `lane-header-text-${actor.id}`,
      x: laneX + 10,
      y: lanesStartY + 10,
      width: LANE_WIDTH - 20,
      height: 26,
      text: actor.label,
      fontSize: 18,
      fontFamily: 2,
      strokeColor: actor.color,
      textAlign: 'center',
      containerId: headerId,
    });
    const header = mkRect({
      id: headerId,
      x: laneX,
      y: lanesStartY,
      width: LANE_WIDTH,
      height: LANE_HEADER_HEIGHT,
      strokeColor: actor.color,
      backgroundColor: actor.color + '22', // ~13% alpha
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      roundness: { type: 3 },
      boundElements: [{ id: `lane-header-text-${actor.id}`, type: 'text' }],
    });
    elements.push(header, headerText);

    // Actor description (below header)
    elements.push(
      mkText({
        x: laneX + 10,
        y: lanesStartY + LANE_HEADER_HEIGHT + 4,
        width: LANE_WIDTH - 20,
        height: 16,
        text: actor.description,
        fontSize: 10,
        fontFamily: 1,
        strokeColor: actor.color,
        opacity: 70,
        textAlign: 'center',
      })
    );
  });

  // 4. Steps — positioned at their actor's lane + numbered row
  const stepsStartY = lanesStartY + LANE_HEADER_HEIGHT + 40;

  // Pre-compute step positions to allow arrow bindings
  const stepPositions: Map<
    number,
    { id: string; x: number; y: number; width: number; height: number }
  > = new Map();

  flow.steps.forEach((step) => {
    const laneIdx = lanes.indexOf(step.actor);
    if (laneIdx === -1) return;

    const actor = ACTORS[step.actor];
    const stepX = lanesStartX + laneIdx * (LANE_WIDTH + LANE_GAP);
    const stepY = stepsStartY + (step.number - 1) * (STEP_MIN_HEIGHT + STEP_V_GAP);

    // Step number circle (in the left gutter)
    const numId = `step-num-${step.number}`;
    const numText = mkText({
      id: `step-num-text-${step.number}`,
      x: MARGIN_X + 10,
      y: stepY + 20,
      width: 40,
      height: 40,
      text: String(step.number),
      fontSize: 28,
      fontFamily: 1,
      strokeColor: '#D4A843',
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: numId,
    });
    const numCircle = mkRect({
      id: numId,
      x: MARGIN_X + 5,
      y: stepY + 10,
      width: 50,
      height: 50,
      strokeColor: '#D4A843',
      backgroundColor: '#D4A84322',
      fillStyle: 'solid',
      strokeWidth: 2,
      roundness: { type: 3 },
      boundElements: [{ id: `step-num-text-${step.number}`, type: 'text' }],
    });
    elements.push(numCircle, numText);

    // Step card — main container
    const cardContentLines = buildCardContentLines(step);
    const estimatedHeight = Math.max(
      STEP_MIN_HEIGHT,
      40 + cardContentLines.length * 18 + CARD_PADDING * 2
    );

    const cardId = `step-card-${step.number}`;
    const titleId = `step-title-${step.number}`;

    // Title (bound to card)
    const titleText = mkText({
      id: titleId,
      x: stepX + CARD_PADDING,
      y: stepY + CARD_PADDING,
      width: LANE_WIDTH - CARD_PADDING * 2,
      height: 24,
      text: step.title,
      fontSize: 14,
      fontFamily: 2,
      strokeColor: actor.color,
      containerId: cardId,
    });

    const card = mkRect({
      id: cardId,
      x: stepX,
      y: stepY,
      width: LANE_WIDTH,
      height: estimatedHeight,
      strokeColor: actor.color,
      backgroundColor: actor.color + '11', // ~7% alpha tint
      fillStyle: 'solid',
      strokeWidth: 1.5,
      roundness: { type: 3 },
      boundElements: [{ id: titleId, type: 'text' }],
    });
    elements.push(card, titleText);

    // Content lines inside the card (below title)
    let contentY = stepY + CARD_PADDING + 30;
    cardContentLines.forEach((line) => {
      elements.push(
        mkText({
          x: stepX + CARD_PADDING,
          y: contentY,
          width: LANE_WIDTH - CARD_PADDING * 2,
          height: 16,
          text: line.text,
          fontSize: line.fontSize ?? 11,
          fontFamily: line.fontFamily ?? 3, // code font for instructions/PDAs
          strokeColor: line.color ?? '#E5E7EB',
          opacity: line.opacity ?? 100,
        })
      );
      contentY += 16;
    });

    // Note (italic, at bottom of card)
    if (step.note) {
      elements.push(
        mkText({
          x: stepX + CARD_PADDING,
          y: stepY + estimatedHeight - 24,
          width: LANE_WIDTH - CARD_PADDING * 2,
          height: 16,
          text: `💡 ${step.note}`,
          fontSize: 10,
          fontFamily: 1,
          strokeColor: '#9CA3AF',
          opacity: 80,
        })
      );
    }

    stepPositions.set(step.number, {
      id: cardId,
      x: stepX,
      y: stepY,
      width: LANE_WIDTH,
      height: estimatedHeight,
    });
  });

  // 5. Arrows between steps (following `next` links)
  flow.steps.forEach((step) => {
    const nextList = Array.isArray(step.next)
      ? step.next
      : step.next != null
        ? [step.next]
        : step.number < flow.steps.length
          ? [step.number + 1] // default: linear flow
          : [];

    const from = stepPositions.get(step.number);
    if (!from) return;

    nextList.forEach((nextNum) => {
      const to = stepPositions.get(nextNum);
      if (!to) return;

      // Arrow from bottom-center of `from` to top-center of `to`
      const startX = from.x + from.width / 2;
      const startY = from.y + from.height;
      const endX = to.x + to.width / 2;
      const endY = to.y;
      const dx = endX - startX;
      const dy = endY - startY;

      elements.push(
        mkArrow({
          x: startX,
          y: startY,
          width: Math.abs(dx) + 10,
          height: Math.abs(dy) + 10,
          strokeColor: '#D4A843',
          strokeWidth: 2,
          roughness: 1,
          points: [
            [0, 0],
            [dx, dy],
          ],
          startBindingId: from.id,
          endBindingId: to.id,
        })
      );
    });
  });

  return { elements };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface ContentLine {
  text: string;
  fontSize?: number;
  fontFamily?: number;
  color?: string;
  opacity?: number;
}

function buildCardContentLines(step: FlowStep): ContentLine[] {
  const lines: ContentLine[] = [];

  if (step.items && step.items.length > 0) {
    step.items.forEach((item) => {
      lines.push({ text: `• ${item}`, fontSize: 11, fontFamily: 1 });
    });
    lines.push({ text: ' ', fontSize: 4 }); // spacer
  }

  if (step.instructions && step.instructions.length > 0) {
    lines.push({
      text: 'instructions:',
      fontSize: 10,
      fontFamily: 1,
      color: '#9CA3AF',
    });
    step.instructions.forEach((ix) => {
      lines.push({
        text: `  ${ix}()`,
        fontSize: 11,
        fontFamily: 3,
        color: '#60A5FA',
      });
    });
  }

  if (step.pdas) {
    if (step.pdas.creates && step.pdas.creates.length > 0) {
      lines.push({
        text: `creates: ${step.pdas.creates.join(', ')}`,
        fontSize: 10,
        fontFamily: 3,
        color: '#34D399',
      });
    }
    if (step.pdas.writes && step.pdas.writes.length > 0) {
      lines.push({
        text: `writes: ${step.pdas.writes.join(', ')}`,
        fontSize: 10,
        fontFamily: 3,
        color: '#FBBF24',
      });
    }
    if (step.pdas.reads && step.pdas.reads.length > 0) {
      lines.push({
        text: `reads: ${step.pdas.reads.join(', ')}`,
        fontSize: 10,
        fontFamily: 3,
        color: '#9CA3AF',
      });
    }
  }

  if (step.modules && step.modules.length > 0) {
    lines.push({
      text: `modules: ${step.modules.join(', ')}`,
      fontSize: 10,
      fontFamily: 3,
      color: '#A78BFA',
    });
  }

  if (step.events && step.events.length > 0) {
    lines.push({
      text: `emits: ${step.events.join(', ')}`,
      fontSize: 10,
      fontFamily: 3,
      color: '#F59E0B',
    });
  }

  return lines;
}
