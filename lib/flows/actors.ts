import type { Actor, ActorId } from './types';

// Distinct colors per lane — chosen for dark-theme readability + Sigil brand
export const ACTORS: Record<ActorId, Actor> = {
  owner: {
    id: 'owner',
    label: 'Vault Owner',
    color: '#D4A843', // gold — the sovereign user
    description: 'Human with wallet, holds ultimate authority',
  },
  agent: {
    id: 'agent',
    label: 'AI Agent',
    color: '#06B6D4', // cyan — automated actor
    description: 'AI agent with scoped spending authority',
  },
  'sigil-server': {
    id: 'sigil-server',
    label: 'Sigil Server',
    color: '#8B5CF6', // purple — trust boundary
    description: 'Builds transactions, enforces parameter bounds',
  },
  sdk: {
    id: 'sdk',
    label: 'SDK',
    color: '#3B82F6', // blue — code layer
    description: '@usesigil/kit — composes transactions',
  },
  onchain: {
    id: 'onchain',
    label: 'On-Chain',
    color: '#10B981', // green — blockchain
    description: 'Sigil program — enforces rules',
  },
  events: {
    id: 'events',
    label: 'Events',
    color: '#F59E0B', // amber — emissions
    description: 'Anchor events emitted by instructions',
  },
  external: {
    id: 'external',
    label: 'External Protocol',
    color: '#9CA3AF', // gray — third-party
    description: 'Jupiter, Flash Trade, etc.',
  },
};

export const DEFAULT_LANE_ORDER: ActorId[] = [
  'owner',
  'agent',
  'sigil-server',
  'sdk',
  'onchain',
  'events',
  'external',
];
