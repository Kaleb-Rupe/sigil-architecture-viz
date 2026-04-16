// ─── Flow Diagram Types ─────────────────────────────────────────────────────
// Swim-lane + numbered-step format: actors flow left-to-right, time flows
// top-to-bottom, each step is a detailed card in one actor's column.

export type ActorId =
  | 'owner'
  | 'agent'
  | 'sigil-server'
  | 'sdk'
  | 'onchain'
  | 'events'
  | 'external';

export interface Actor {
  id: ActorId;
  label: string;
  color: string;
  description: string;
}

export interface FlowStep {
  /** Step number (1-indexed). Determines vertical position. */
  number: number;
  /** Which actor lane this step lives in. */
  actor: ActorId;
  /** One-line headline for the step. */
  title: string;
  /** Bullet-point detail lines (shown inside the card). */
  items?: string[];
  /** On-chain instructions invoked in this step (shown as code-style chips). */
  instructions?: string[];
  /** PDA accounts read or written in this step. */
  pdas?: {
    reads?: string[];
    writes?: string[];
    creates?: string[];
  };
  /** Events emitted by this step. */
  events?: string[];
  /** SDK modules involved in this step. */
  modules?: string[];
  /** ID of the next step this step flows into (for arrow rendering). */
  next?: number | number[];
  /** Optional note about WHY this step happens (shown as italic). */
  note?: string;
}

export interface FlowDefinition {
  /** URL slug: /s/flow-[name] */
  name: string;
  /** Title shown at top of diagram. */
  title: string;
  /** One-line description. */
  description: string;
  /** Category for grouping. */
  category: 'core' | 'security' | 'agent-mcp';
  /** Ordered steps. */
  steps: FlowStep[];
  /** Actors used by this flow (renderer shows only these lanes). */
  lanes?: ActorId[];
}
