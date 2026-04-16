// ─── Flow Renderer ──────────────────────────────────────────────────────────
// Produces ExcalidrawElementSkeleton[] — the MINIMAL shape accepted by
// convertToExcalidrawElements(). Excalidraw generates all internal fields
// (version, seed, baseline, fractional index, etc.) from these skeletons.
//
// DO NOT hand-craft internal Excalidraw fields here — that path caused a
// "Loading scene..." deadlock when fields drifted from the runtime shape.

import { ACTORS, DEFAULT_LANE_ORDER } from './actors';
import type { ActorId, FlowDefinition, FlowStep } from './types';

// ─── Layout constants ───────────────────────────────────────────────────────

const LANE_WIDTH = 260;
const LANE_GAP = 20;
const STEP_MIN_HEIGHT = 140;
const STEP_V_GAP = 30;
const HEADER_HEIGHT = 120;
const LANE_HEADER_HEIGHT = 60;
const MARGIN_X = 40;
const MARGIN_TOP = 40;
const STEP_NUMBER_COL_WIDTH = 60;
const CARD_PADDING = 12;

// ─── Skeleton types (loosely typed — convertToExcalidrawElements validates) ─

// We keep this `unknown[]` at the boundary so we don't need to duplicate
// Excalidraw's internal skeleton types. The runtime library validates shape.
type Skeleton = Record<string, unknown>;

// ─── Flow renderer ──────────────────────────────────────────────────────────

export function generateFlowElements(flow: FlowDefinition): {
  elements: Skeleton[];
} {
  const elements: Skeleton[] = [];

  // 1. Determine visible lanes
  const usedActors = new Set<ActorId>();
  for (const step of flow.steps) usedActors.add(step.actor);
  const lanes = (flow.lanes ?? DEFAULT_LANE_ORDER).filter((a) =>
    usedActors.has(a)
  );

  // 2. Header — title + description
  elements.push({
    type: 'text',
    x: MARGIN_X,
    y: MARGIN_TOP,
    text: flow.title,
    fontSize: 28,
    fontFamily: 1,
    strokeColor: '#D4A843',
  });
  elements.push({
    type: 'text',
    x: MARGIN_X,
    y: MARGIN_TOP + 46,
    text: flow.description,
    fontSize: 14,
    fontFamily: 1,
    strokeColor: '#9CA3AF',
  });

  // 3. Lane headers
  const lanesStartX = MARGIN_X + STEP_NUMBER_COL_WIDTH;
  const lanesStartY = MARGIN_TOP + HEADER_HEIGHT;

  lanes.forEach((actorId, idx) => {
    const actor = ACTORS[actorId];
    const laneX = lanesStartX + idx * (LANE_WIDTH + LANE_GAP);

    // Lane header rect (with bound label)
    const headerId = `lane-header-${actor.id}`;
    elements.push({
      type: 'rectangle',
      id: headerId,
      x: laneX,
      y: lanesStartY,
      width: LANE_WIDTH,
      height: LANE_HEADER_HEIGHT,
      strokeColor: actor.color,
      backgroundColor: actor.color + '33',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      roundness: { type: 3 },
      label: {
        text: actor.label,
        fontSize: 18,
        strokeColor: actor.color,
      },
    });

    // Actor description (below header, no container)
    elements.push({
      type: 'text',
      x: laneX + 10,
      y: lanesStartY + LANE_HEADER_HEIGHT + 6,
      text: actor.description,
      fontSize: 10,
      fontFamily: 1,
      strokeColor: actor.color,
      opacity: 70,
    });
  });

  // 4. Steps
  const stepsStartY = lanesStartY + LANE_HEADER_HEIGHT + 40;

  // Store positions for arrow binding
  const stepPositions: Map<
    number,
    { id: string; x: number; y: number; width: number; height: number }
  > = new Map();

  flow.steps.forEach((step) => {
    const laneIdx = lanes.indexOf(step.actor);
    if (laneIdx === -1) return;

    const actor = ACTORS[step.actor];
    const stepX = lanesStartX + laneIdx * (LANE_WIDTH + LANE_GAP);
    const stepY =
      stepsStartY + (step.number - 1) * (STEP_MIN_HEIGHT + STEP_V_GAP);

    // Step number circle (left gutter, with bound label)
    const numId = `step-num-${step.number}`;
    elements.push({
      type: 'rectangle',
      id: numId,
      x: MARGIN_X + 5,
      y: stepY + 10,
      width: 50,
      height: 50,
      strokeColor: '#D4A843',
      backgroundColor: '#D4A84333',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      roundness: { type: 3 },
      label: {
        text: String(step.number),
        fontSize: 24,
        strokeColor: '#D4A843',
      },
    });

    // Build content text (as separate text elements, NOT bound to card —
    // bound labels would center the text instead of laying it out as lines)
    const contentLines = buildCardContentLines(step);
    const estimatedHeight = Math.max(
      STEP_MIN_HEIGHT,
      56 + contentLines.length * 16 + (step.note ? 24 : 0) + CARD_PADDING
    );

    // Card (rectangle with bound title label)
    const cardId = `step-card-${step.number}`;
    elements.push({
      type: 'rectangle',
      id: cardId,
      x: stepX,
      y: stepY,
      width: LANE_WIDTH,
      height: estimatedHeight,
      strokeColor: actor.color,
      backgroundColor: actor.color + '1A',
      fillStyle: 'solid',
      strokeWidth: 1.5,
      roughness: 1,
      roundness: { type: 3 },
      label: {
        text: step.title,
        fontSize: 14,
        strokeColor: actor.color,
        verticalAlign: 'top',
      },
    });

    // Content lines (absolute-positioned text elements under the title)
    let contentY = stepY + 40;
    contentLines.forEach((line) => {
      elements.push({
        type: 'text',
        x: stepX + CARD_PADDING,
        y: contentY,
        text: line.text,
        fontSize: line.fontSize ?? 11,
        fontFamily: line.fontFamily ?? 3,
        strokeColor: line.color ?? '#E5E7EB',
        opacity: line.opacity ?? 100,
      });
      contentY += 16;
    });

    // Note at bottom
    if (step.note) {
      elements.push({
        type: 'text',
        x: stepX + CARD_PADDING,
        y: stepY + estimatedHeight - 20,
        text: `💡 ${step.note}`,
        fontSize: 10,
        fontFamily: 1,
        strokeColor: '#9CA3AF',
        opacity: 80,
      });
    }

    stepPositions.set(step.number, {
      id: cardId,
      x: stepX,
      y: stepY,
      width: LANE_WIDTH,
      height: estimatedHeight,
    });
  });

  // 5. Arrows between steps
  flow.steps.forEach((step) => {
    const nextList = Array.isArray(step.next)
      ? step.next
      : step.next != null
        ? [step.next]
        : step.number < flow.steps.length
          ? [step.number + 1]
          : [];

    const from = stepPositions.get(step.number);
    if (!from) return;

    nextList.forEach((nextNum) => {
      const to = stepPositions.get(nextNum);
      if (!to) return;

      elements.push({
        type: 'arrow',
        x: from.x + from.width / 2,
        y: from.y + from.height,
        width: Math.abs(to.x + to.width / 2 - (from.x + from.width / 2)) + 10,
        height: Math.abs(to.y - (from.y + from.height)) + 10,
        strokeColor: '#D4A843',
        strokeWidth: 2,
        roughness: 1,
        start: { id: from.id },
        end: { id: to.id },
      });
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
    lines.push({ text: ' ', fontSize: 4 });
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
