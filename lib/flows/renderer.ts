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

const LANE_WIDTH = 360;
const LANE_GAP = 28;
const STEP_MIN_HEIGHT = 180;
const STEP_V_GAP = 40;
const HEADER_HEIGHT = 120;
const LANE_HEADER_HEIGHT = 60;
const MARGIN_X = 40;
const MARGIN_TOP = 40;
const STEP_NUMBER_COL_WIDTH = 70;
const CARD_PADDING = 16;
const CONTENT_WIDTH = LANE_WIDTH - CARD_PADDING * 2;
const LINE_HEIGHT = 18;

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
  // Description wraps to ~1000px wide
  elements.push({
    type: 'text',
    x: MARGIN_X,
    y: MARGIN_TOP + 46,
    width: 1100,
    height: 48,
    text: flow.description,
    fontSize: 14,
    fontFamily: 1,
    strokeColor: '#9CA3AF',
    autoResize: false,
  });

  // 3. Lane headers
  const lanesStartX = MARGIN_X + STEP_NUMBER_COL_WIDTH;
  const lanesStartY = MARGIN_TOP + HEADER_HEIGHT;

  lanes.forEach((actorId, idx) => {
    const actor = ACTORS[actorId];
    const laneX = lanesStartX + idx * (LANE_WIDTH + LANE_GAP);

    // Lane header rect (with bound label) — clean lines, solid fill for readability
    const headerId = `lane-header-${actor.id}`;
    elements.push({
      type: 'rectangle',
      id: headerId,
      x: laneX,
      y: lanesStartY,
      width: LANE_WIDTH,
      height: LANE_HEADER_HEIGHT,
      strokeColor: actor.color,
      backgroundColor: actor.color + '66', // ~40% alpha — solid enough to read
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 0, // clean, not sketchy
      roundness: { type: 3 },
      label: {
        text: actor.label,
        fontSize: 20,
        strokeColor: '#FFFFFF', // white text on colored background
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

    // Step number circle (left gutter, with bound label) — solid gold
    const numId = `step-num-${step.number}`;
    elements.push({
      type: 'rectangle',
      id: numId,
      x: MARGIN_X + 5,
      y: stepY + 10,
      width: 50,
      height: 50,
      strokeColor: '#D4A843',
      backgroundColor: '#D4A843', // solid gold for prominence
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 0,
      roundness: { type: 3 },
      label: {
        text: String(step.number),
        fontSize: 24,
        strokeColor: '#0F0F0F', // dark text on gold
      },
    });

    // Build content text (as separate text elements, NOT bound to card —
    // bound labels would center the text instead of laying it out as lines)
    const contentLines = buildCardContentLines(step);
    // Compute total content height accounting for text wrapping
    let contentHeight = 0;
    contentLines.forEach((line) => {
      const estLines = Math.max(1, Math.ceil(line.text.length / 52));
      contentHeight += estLines * LINE_HEIGHT + 2;
    });
    const noteHeight = step.note
      ? Math.max(1, Math.ceil(step.note.length / 48)) * LINE_HEIGHT + 12
      : 0;
    const estimatedHeight = Math.max(
      STEP_MIN_HEIGHT,
      56 + contentHeight + noteHeight + CARD_PADDING
    );

    // Card (rectangle with bound title label) — much more visible tint
    const cardId = `step-card-${step.number}`;
    elements.push({
      type: 'rectangle',
      id: cardId,
      x: stepX,
      y: stepY,
      width: LANE_WIDTH,
      height: estimatedHeight,
      strokeColor: actor.color,
      backgroundColor: actor.color + '33', // ~20% alpha — readable on dark
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 0, // clean for readability
      roundness: { type: 3 },
      label: {
        text: step.title,
        fontSize: 15,
        strokeColor: '#FFFFFF', // white title for high contrast
        verticalAlign: 'top',
      },
    });

    // Content lines (absolute-positioned text elements under the title,
    // with explicit width so long lines wrap instead of clipping)
    let contentY = stepY + 46;
    contentLines.forEach((line) => {
      // Rough wrap estimate: each line ~50-60 chars wide at fontSize 12
      const estLines = Math.max(
        1,
        Math.ceil(line.text.length / 52)
      );
      const height = estLines * LINE_HEIGHT;
      elements.push({
        type: 'text',
        x: stepX + CARD_PADDING,
        y: contentY,
        width: CONTENT_WIDTH,
        height,
        text: line.text,
        fontSize: line.fontSize ?? 12,
        fontFamily: line.fontFamily ?? 3,
        strokeColor: line.color ?? '#E5E7EB',
        opacity: line.opacity ?? 100,
        autoResize: false,
      });
      contentY += height + 2;
    });

    // Note at bottom (wrapped)
    if (step.note) {
      const noteLines = Math.max(1, Math.ceil(step.note.length / 48));
      elements.push({
        type: 'text',
        x: stepX + CARD_PADDING,
        y: stepY + estimatedHeight - noteLines * LINE_HEIGHT - 8,
        width: CONTENT_WIDTH,
        height: noteLines * LINE_HEIGHT,
        text: `💡 ${step.note}`,
        fontSize: 11,
        fontFamily: 1,
        strokeColor: '#9CA3AF',
        opacity: 80,
        autoResize: false,
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

  // 5. Arrows between steps — bind source/target, let Excalidraw auto-route.
  // DO NOT pass manual points/width/height — that fights the auto-router
  // and causes arrows to shoot off into empty space.
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
        x: from.x,
        y: from.y,
        strokeColor: '#D4A843',
        strokeWidth: 2,
        roughness: 0,
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
      lines.push({
        text: `• ${item}`,
        fontSize: 12,
        fontFamily: 1,
        color: '#F3F4F6', // near-white for legibility
      });
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
