import type { FlowDefinition } from '../types';

export const CREATE_VAULT_FLOW: FlowDefinition = {
  name: 'flow-create-vault',
  title: 'Create a Vault',
  description:
    'Owner provisions a Sigil vault with a registered agent in a single atomic transaction. Composes initialize_vault + register_agent instructions.',
  category: 'core',
  steps: [
    {
      number: 1,
      actor: 'owner',
      title: 'Decide vault config',
      items: [
        'Choose daily cap ($500 default)',
        'Choose per-agent spending limit',
        'Pick agent public key',
        'Choose protocols to allow',
      ],
      note: 'Safe defaults enforced: timelock ≥ 30min, per-agent cap > 0',
    },
    {
      number: 2,
      actor: 'sdk',
      title: 'createAndSendVault()',
      items: ['Validates config', 'Derives PDAs client-side', 'Builds two instructions'],
      modules: ['create-vault', 'resolve-accounts'],
      instructions: [],
    },
    {
      number: 3,
      actor: 'sdk',
      title: 'Compose owner transaction',
      items: [
        'Sets compute budget (200k CU)',
        'Fetches recent blockhash',
        'Attaches Sigil ALT for size efficiency',
      ],
      modules: ['owner-transaction', 'alt-loader', 'composer', 'rpc-helpers'],
    },
    {
      number: 4,
      actor: 'owner',
      title: 'Sign transaction',
      items: ['Wallet prompt shows: vault creation + agent registration', 'Single signature covers both ix'],
    },
    {
      number: 5,
      actor: 'onchain',
      title: 'initialize_vault executes',
      instructions: ['initialize_vault'],
      pdas: {
        creates: ['AgentVault', 'PolicyConfig', 'SpendTracker', 'AgentSpendOverlay'],
      },
      items: [
        'Validates owner signature',
        'Allocates 4 PDAs with rent',
        'Stores policy config + spending caps',
      ],
    },
    {
      number: 6,
      actor: 'events',
      title: 'VaultCreated',
      events: ['VaultCreated'],
      items: ['vault, owner, policyVersion, timestamp'],
    },
    {
      number: 7,
      actor: 'onchain',
      title: 'register_agent executes',
      instructions: ['register_agent'],
      pdas: {
        writes: ['AgentVault (agents[0])', 'AgentSpendOverlay (slot 0 claimed)'],
      },
      items: [
        'Pushes AgentEntry into vault.agents',
        'Claims overlay slot for per-agent tracking',
        'Validates capability tier (2 = Operator)',
      ],
      note: 'Owner ≠ Agent enforced here (prevents self-custody bypass)',
    },
    {
      number: 8,
      actor: 'events',
      title: 'AgentRegistered',
      events: ['AgentRegistered'],
      items: ['vault, agent, capability, spendingLimit'],
    },
    {
      number: 9,
      actor: 'sdk',
      title: 'Confirm + return',
      items: [
        'Polls for confirmation (2s default)',
        'Returns { vaultAddress, policyAddress, signature }',
      ],
      modules: ['rpc-helpers'],
    },
    {
      number: 10,
      actor: 'owner',
      title: 'Vault ready — fund ATAs',
      items: [
        'Owner creates USDC/USDT ATAs for vault',
        'Transfers initial collateral',
      ],
      note: 'Funding is a SEPARATE tx — vault PDA must exist first before ATAs can be derived',
    },
  ],
};
