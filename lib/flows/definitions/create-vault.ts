import type { FlowDefinition } from '../types';

/**
 * Create Vault — full bidirectional flow.
 *
 * Shows the complete loop: Owner initiates → SDK composes → Owner signs →
 * RPC submits → On-chain executes (2 ix) → Events emit → RPC confirms →
 * SDK parses + returns → Owner receives result.
 *
 * This is the v2 template — every flow should bookend with User Intent
 * (step 1) and User Result (last step) so the mental model shows what the
 * user asked for AND what they got back.
 */
export const CREATE_VAULT_FLOW: FlowDefinition = {
  name: 'flow-create-vault',
  title: 'Create a Vault',
  description:
    'Owner provisions a Sigil vault with a registered agent in a single atomic transaction. Composes initialize_vault + register_agent on-chain, returns the vault address + confirmed signature to the caller.',
  category: 'core',
  steps: [
    {
      number: 1,
      actor: 'owner',
      title: 'Intent: "I need a vault for my agent"',
      items: [
        'Owner has a wallet (Phantom, Solflare, etc.)',
        'Owner has an agent pubkey (generated locally, or from Turnkey)',
        'Owner has SOL for rent (~0.03 SOL per vault)',
      ],
      note: 'The owner wallet is the trust root. Agent pubkey will be granted scoped spending authority.',
    },
    {
      number: 2,
      actor: 'owner',
      title: 'Decide vault config',
      items: [
        'Choose daily cap (default: $500)',
        'Choose per-agent spending limit (default: $100)',
        'Pick agent public key',
        'Choose allowed protocols (Jupiter only, or all)',
      ],
      note: 'Safe defaults enforced: timelock ≥ 30min, per-agent cap > 0',
    },
    {
      number: 3,
      actor: 'sdk',
      title: 'Call createAndSendVault()',
      items: [
        'Validates config (caps > 0, capability tier valid)',
        'Derives PDAs client-side (no RPC)',
        'Resolves next vault_id for this owner',
      ],
      modules: ['create-vault', 'resolve-accounts'],
    },
    {
      number: 4,
      actor: 'sdk',
      title: 'Build 2 instructions',
      items: [
        'Builds initialize_vault ix with all policy fields',
        'Builds register_agent ix for the first agent',
        'Both instructions will execute atomically in one tx',
      ],
      instructions: ['initialize_vault', 'register_agent'],
    },
    {
      number: 5,
      actor: 'sdk',
      title: 'Compose owner transaction',
      items: [
        'Sets compute budget (200k CU)',
        'Fetches recent blockhash',
        'Attaches Sigil ALT (address lookup table) for size efficiency',
      ],
      modules: ['owner-transaction', 'alt-loader', 'composer', 'rpc-helpers'],
    },
    {
      number: 6,
      actor: 'owner',
      title: 'Sign transaction',
      items: [
        'Wallet prompt shows: "Create vault + register agent"',
        'Single signature covers both on-chain instructions',
        'Tx is atomic — either both succeed or both revert',
      ],
    },
    {
      number: 7,
      actor: 'sdk',
      title: 'Submit to RPC',
      items: [
        'sendAndConfirmTransaction()',
        'Transaction serialized + sent to Solana validator',
        'Tx signature returned immediately (not yet confirmed)',
      ],
      modules: ['rpc-helpers', 'transaction-executor'],
    },
    {
      number: 8,
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
      number: 9,
      actor: 'events',
      title: 'VaultCreated emitted',
      events: ['VaultCreated'],
      items: ['vault, owner, policyVersion, timestamp'],
    },
    {
      number: 10,
      actor: 'onchain',
      title: 'register_agent executes',
      instructions: ['register_agent'],
      pdas: {
        writes: ['AgentVault.agents[0]', 'AgentSpendOverlay (slot 0)'],
      },
      items: [
        'Pushes AgentEntry into vault.agents vector',
        'Claims overlay slot for per-agent tracking',
        'Validates capability tier (2 = Operator)',
      ],
      note: 'Owner ≠ Agent enforced here (prevents self-custody bypass)',
    },
    {
      number: 11,
      actor: 'events',
      title: 'AgentRegistered emitted',
      events: ['AgentRegistered'],
      items: ['vault, agent, capability, spendingLimit'],
    },
    {
      number: 12,
      actor: 'onchain',
      title: 'Transaction confirmed',
      items: [
        'Validator includes tx in block',
        'Block reaches confirmed commitment (~0.5s)',
        'State is now durable',
      ],
    },
    {
      number: 13,
      actor: 'sdk',
      title: 'Poll confirmation',
      items: [
        'Polls RPC every 2s (default)',
        'Waits for confirmation at configured commitment',
        'Parses signature + final block state',
      ],
      modules: ['rpc-helpers'],
    },
    {
      number: 14,
      actor: 'sdk',
      title: 'Return result',
      items: [
        'Returns { vaultAddress, policyAddress, signature }',
        'Caller now has the addresses to reference',
      ],
    },
    {
      number: 15,
      actor: 'owner',
      title: 'Result: Vault is live',
      items: [
        'Owner knows vault address (4ZeV...wrHL)',
        'Agent is registered with spending authority',
        'Next step: fund vault ATAs in a separate transaction',
      ],
      note: 'Funding requires a new tx — vault PDA must exist first before ATAs can be derived. See flow-fund-vault for that next step.',
    },
  ],
};
