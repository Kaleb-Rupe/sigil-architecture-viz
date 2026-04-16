// ─── On-Chain Architecture Data ─────────────────────────────────────────────
// Exhaustive catalog of every Sigil program instruction, PDA, and event.
// Sourced from programs/sigil/src/instructions/*.rs and programs/sigil/src/events.rs

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OnChainInstruction {
  id: string;
  name: string;
  displayName: string;
  group:
    | "vault"
    | "agent"
    | "auth"
    | "policy"
    | "constraints"
    | "escrow"
    | "transfer"
    | "assertions";
  reads: string[];
  writes: string[];
  emits: string[];
  args: string[];
}

export interface PdaAccount {
  id: string;
  name: string;
  displayName: string;
  seeds: string;
  size: string;
  zeroCopy: boolean;
  createdBy: string[];
  closedBy: string[];
}

export interface OnChainEvent {
  id: string;
  name: string;
  emittedBy: string[];
}

// ─── Instructions (35 total) ────────────────────────────────────────────────

export const INSTRUCTIONS: OnChainInstruction[] = [
  // ── Vault (5) ──────────────────────────────────────────────────────────
  {
    id: "initialize_vault",
    name: "initialize_vault",
    displayName: "Initialize Vault",
    group: "vault",
    reads: [],
    writes: [
      "AgentVault",
      "PolicyConfig",
      "SpendTracker",
      "AgentSpendOverlay",
    ],
    emits: ["VaultCreated"],
    args: [
      "vault_id",
      "daily_spending_cap_usd",
      "max_transaction_size_usd",
      "protocol_mode",
      "protocols",
      "max_leverage_bps",
      "max_concurrent_positions",
      "developer_fee_rate",
      "max_slippage_bps",
      "timelock_duration",
      "allowed_destinations",
      "protocol_caps",
    ],
  },
  {
    id: "deposit_funds",
    name: "deposit_funds",
    displayName: "Deposit Funds",
    group: "vault",
    reads: [],
    writes: ["AgentVault"],
    emits: ["FundsDeposited"],
    args: ["amount"],
  },
  {
    id: "withdraw_funds",
    name: "withdraw_funds",
    displayName: "Withdraw Funds",
    group: "vault",
    reads: [],
    writes: ["AgentVault"],
    emits: ["FundsWithdrawn"],
    args: ["amount"],
  },
  {
    id: "close_vault",
    name: "close_vault",
    displayName: "Close Vault",
    group: "vault",
    reads: ["PolicyConfig"],
    writes: [
      "AgentVault",
      "PolicyConfig",
      "SpendTracker",
      "AgentSpendOverlay",
    ],
    emits: ["VaultClosed"],
    args: [],
  },
  {
    id: "freeze_vault",
    name: "freeze_vault",
    displayName: "Freeze Vault",
    group: "vault",
    reads: [],
    writes: ["AgentVault"],
    emits: ["VaultFrozen"],
    args: [],
  },

  // ── Agent (6) ──────────────────────────────────────────────────────────
  {
    id: "register_agent",
    name: "register_agent",
    displayName: "Register Agent",
    group: "agent",
    reads: [],
    writes: ["AgentVault", "AgentSpendOverlay"],
    emits: ["AgentRegistered"],
    args: ["agent", "capability", "spending_limit_usd"],
  },
  {
    id: "revoke_agent",
    name: "revoke_agent",
    displayName: "Revoke Agent",
    group: "agent",
    reads: [],
    writes: ["AgentVault", "AgentSpendOverlay"],
    emits: ["AgentRevoked"],
    args: ["agent_to_remove"],
  },
  {
    id: "pause_agent",
    name: "pause_agent",
    displayName: "Pause Agent",
    group: "agent",
    reads: [],
    writes: ["AgentVault"],
    emits: ["AgentPausedEvent"],
    args: ["agent_to_pause"],
  },
  {
    id: "unpause_agent",
    name: "unpause_agent",
    displayName: "Unpause Agent",
    group: "agent",
    reads: [],
    writes: ["AgentVault"],
    emits: ["AgentUnpausedEvent"],
    args: ["agent_to_unpause"],
  },
  {
    id: "reactivate_vault",
    name: "reactivate_vault",
    displayName: "Reactivate Vault",
    group: "agent",
    reads: [],
    writes: ["AgentVault"],
    emits: ["VaultReactivated"],
    args: [],
  },
  {
    id: "queue_agent_permissions_update",
    name: "queue_agent_permissions_update",
    displayName: "Queue Agent Permissions",
    group: "agent",
    reads: ["AgentVault", "PolicyConfig"],
    writes: ["PendingAgentPermissionsUpdate"],
    emits: ["AgentPermissionsChangeQueued"],
    args: ["agent", "new_capability", "new_spending_limit_usd"],
  },

  // ── Agent Permissions (3) ──────────────────────────────────────────────
  {
    id: "apply_agent_permissions_update",
    name: "apply_agent_permissions_update",
    displayName: "Apply Agent Permissions",
    group: "agent",
    reads: ["PolicyConfig"],
    writes: [
      "AgentVault",
      "AgentSpendOverlay",
      "PendingAgentPermissionsUpdate",
    ],
    emits: ["AgentPermissionsChangeApplied"],
    args: ["agent"],
  },
  {
    id: "cancel_agent_permissions_update",
    name: "cancel_agent_permissions_update",
    displayName: "Cancel Agent Permissions",
    group: "agent",
    reads: ["AgentVault"],
    writes: ["PendingAgentPermissionsUpdate"],
    emits: ["AgentPermissionsChangeCancelled"],
    args: ["agent"],
  },
  {
    id: "sync_positions",
    name: "sync_positions",
    displayName: "Sync Positions",
    group: "agent",
    reads: [],
    writes: ["AgentVault"],
    emits: ["PositionsSynced"],
    args: ["actual_positions"],
  },

  // ── Auth (2) ───────────────────────────────────────────────────────────
  {
    id: "validate_and_authorize",
    name: "validate_and_authorize",
    displayName: "Validate & Authorize",
    group: "auth",
    reads: [
      "AgentVault",
      "PolicyConfig",
      "InstructionConstraints",
      "PostExecutionAssertions",
    ],
    writes: [
      "AgentVault",
      "SpendTracker",
      "AgentSpendOverlay",
      "SessionAuthority",
    ],
    emits: ["ActionAuthorized", "FeesCollected"],
    args: ["token_mint", "amount", "target_protocol", "expected_policy_version"],
  },
  {
    id: "finalize_session",
    name: "finalize_session",
    displayName: "Finalize Session",
    group: "auth",
    reads: ["PolicyConfig", "PostExecutionAssertions"],
    writes: [
      "AgentVault",
      "SpendTracker",
      "AgentSpendOverlay",
      "SessionAuthority",
    ],
    emits: [
      "SessionFinalized",
      "DelegationRevoked",
      "AgentSpendLimitChecked",
      "PostAssertionChecked",
    ],
    args: [],
  },

  // ── Policy (3) ─────────────────────────────────────────────────────────
  {
    id: "queue_policy_update",
    name: "queue_policy_update",
    displayName: "Queue Policy Update",
    group: "policy",
    reads: ["AgentVault"],
    writes: ["PolicyConfig", "PendingPolicyUpdate"],
    emits: ["PolicyChangeQueued"],
    args: [
      "daily_spending_cap_usd",
      "max_transaction_amount_usd",
      "protocol_mode",
      "protocols",
      "max_leverage_bps",
      "can_open_positions",
      "max_concurrent_positions",
      "developer_fee_rate",
      "max_slippage_bps",
      "timelock_duration",
      "allowed_destinations",
      "session_expiry_slots",
      "has_protocol_caps",
      "protocol_caps",
    ],
  },
  {
    id: "apply_pending_policy",
    name: "apply_pending_policy",
    displayName: "Apply Pending Policy",
    group: "policy",
    reads: ["AgentVault"],
    writes: ["PolicyConfig", "PendingPolicyUpdate"],
    emits: ["PolicyChangeApplied"],
    args: [],
  },
  {
    id: "cancel_pending_policy",
    name: "cancel_pending_policy",
    displayName: "Cancel Pending Policy",
    group: "policy",
    reads: ["AgentVault"],
    writes: ["PolicyConfig", "PendingPolicyUpdate"],
    emits: ["PolicyChangeCancelled"],
    args: [],
  },

  // ── Constraints (9) ────────────────────────────────────────────────────
  {
    id: "allocate_constraints_pda",
    name: "allocate_constraints_pda",
    displayName: "Allocate Constraints PDA",
    group: "constraints",
    reads: ["AgentVault"],
    writes: ["InstructionConstraints"],
    emits: ["PdaAllocated"],
    args: [],
  },
  {
    id: "allocate_pending_constraints_pda",
    name: "allocate_pending_constraints_pda",
    displayName: "Allocate Pending Constraints",
    group: "constraints",
    reads: ["AgentVault"],
    writes: ["PendingConstraintsUpdate"],
    emits: ["PdaAllocated"],
    args: [],
  },
  {
    id: "extend_pda",
    name: "extend_pda",
    displayName: "Extend PDA",
    group: "constraints",
    reads: ["AgentVault"],
    writes: [],
    emits: ["PdaExtended"],
    args: ["target_size"],
  },
  {
    id: "create_instruction_constraints",
    name: "create_instruction_constraints",
    displayName: "Create Constraints",
    group: "constraints",
    reads: ["AgentVault"],
    writes: ["PolicyConfig", "InstructionConstraints"],
    emits: ["InstructionConstraintsCreated"],
    args: ["entries", "strict_mode"],
  },
  {
    id: "queue_constraints_update",
    name: "queue_constraints_update",
    displayName: "Queue Constraints Update",
    group: "constraints",
    reads: ["AgentVault", "PolicyConfig"],
    writes: ["PendingConstraintsUpdate"],
    emits: ["ConstraintsChangeQueued"],
    args: ["entries", "strict_mode"],
  },
  {
    id: "apply_constraints_update",
    name: "apply_constraints_update",
    displayName: "Apply Constraints Update",
    group: "constraints",
    reads: ["AgentVault", "PolicyConfig"],
    writes: ["InstructionConstraints", "PendingConstraintsUpdate"],
    emits: ["ConstraintsChangeApplied"],
    args: [],
  },
  {
    id: "cancel_constraints_update",
    name: "cancel_constraints_update",
    displayName: "Cancel Constraints Update",
    group: "constraints",
    reads: ["AgentVault"],
    writes: ["PendingConstraintsUpdate"],
    emits: ["ConstraintsChangeCancelled"],
    args: [],
  },
  {
    id: "queue_close_constraints",
    name: "queue_close_constraints",
    displayName: "Queue Close Constraints",
    group: "constraints",
    reads: ["AgentVault", "PolicyConfig"],
    writes: ["PendingCloseConstraints"],
    emits: ["CloseConstraintsQueued"],
    args: [],
  },
  {
    id: "apply_close_constraints",
    name: "apply_close_constraints",
    displayName: "Apply Close Constraints",
    group: "constraints",
    reads: ["AgentVault"],
    writes: [
      "PolicyConfig",
      "InstructionConstraints",
      "PendingCloseConstraints",
    ],
    emits: ["CloseConstraintsApplied"],
    args: [],
  },
  {
    id: "cancel_close_constraints",
    name: "cancel_close_constraints",
    displayName: "Cancel Close Constraints",
    group: "constraints",
    reads: ["AgentVault"],
    writes: ["PendingCloseConstraints"],
    emits: ["CloseConstraintsCancelled"],
    args: [],
  },

  // ── Escrow (4) ─────────────────────────────────────────────────────────
  {
    id: "create_escrow",
    name: "create_escrow",
    displayName: "Create Escrow",
    group: "escrow",
    reads: ["PolicyConfig"],
    writes: [
      "AgentVault",
      "SpendTracker",
      "AgentSpendOverlay",
      "EscrowDeposit",
    ],
    emits: ["EscrowCreated", "FeesCollected", "AgentSpendLimitChecked"],
    args: ["escrow_id", "amount", "expires_at", "condition_hash"],
  },
  {
    id: "settle_escrow",
    name: "settle_escrow",
    displayName: "Settle Escrow",
    group: "escrow",
    reads: ["AgentVault"],
    writes: ["AgentVault", "EscrowDeposit"],
    emits: ["EscrowSettled"],
    args: ["condition_preimage"],
  },
  {
    id: "refund_escrow",
    name: "refund_escrow",
    displayName: "Refund Escrow",
    group: "escrow",
    reads: [],
    writes: ["AgentVault", "EscrowDeposit"],
    emits: ["EscrowRefunded"],
    args: [],
  },
  {
    id: "close_settled_escrow",
    name: "close_settled_escrow",
    displayName: "Close Settled Escrow",
    group: "escrow",
    reads: [],
    writes: ["EscrowDeposit"],
    emits: [],
    args: [],
  },

  // ── Transfer (1) ───────────────────────────────────────────────────────
  {
    id: "agent_transfer",
    name: "agent_transfer",
    displayName: "Agent Transfer",
    group: "transfer",
    reads: ["PolicyConfig"],
    writes: ["AgentVault", "SpendTracker", "AgentSpendOverlay"],
    emits: [
      "AgentTransferExecuted",
      "FeesCollected",
      "AgentSpendLimitChecked",
    ],
    args: ["amount", "expected_policy_version"],
  },

  // ── Assertions (2) ────────────────────────────────────────────────────
  {
    id: "create_post_assertions",
    name: "create_post_assertions",
    displayName: "Create Post Assertions",
    group: "assertions",
    reads: ["AgentVault"],
    writes: ["PolicyConfig", "PostExecutionAssertions"],
    emits: ["PostAssertionsCreated"],
    args: ["entries"],
  },
  {
    id: "close_post_assertions",
    name: "close_post_assertions",
    displayName: "Close Post Assertions",
    group: "assertions",
    reads: ["AgentVault"],
    writes: ["PolicyConfig", "PostExecutionAssertions"],
    emits: ["PostAssertionsClosed"],
    args: [],
  },
];

// ─── PDAs (12) ──────────────────────────────────────────────────────────────

export const PDAS: PdaAccount[] = [
  {
    id: "AgentVault",
    name: "AgentVault",
    displayName: "Agent Vault",
    seeds: '[b"vault", owner, vault_id]',
    size: "634 bytes",
    zeroCopy: false,
    createdBy: ["initialize_vault"],
    closedBy: ["close_vault"],
  },
  {
    id: "PolicyConfig",
    name: "PolicyConfig",
    displayName: "Policy Config",
    seeds: '[b"policy", vault]',
    size: "817 bytes",
    zeroCopy: false,
    createdBy: ["initialize_vault"],
    closedBy: ["close_vault"],
  },
  {
    id: "SpendTracker",
    name: "SpendTracker",
    displayName: "Spend Tracker",
    seeds: '[b"tracker", vault]',
    size: "2,840 bytes",
    zeroCopy: true,
    createdBy: ["initialize_vault"],
    closedBy: ["close_vault"],
  },
  {
    id: "AgentSpendOverlay",
    name: "AgentSpendOverlay",
    displayName: "Agent Spend Overlay",
    seeds: '[b"agent_spend", vault, 0]',
    size: "2,528 bytes",
    zeroCopy: true,
    createdBy: ["initialize_vault"],
    closedBy: ["close_vault"],
  },
  {
    id: "SessionAuthority",
    name: "SessionAuthority",
    displayName: "Session Authority",
    seeds: '[b"session", vault, agent, token_mint]',
    size: "~350 bytes",
    zeroCopy: false,
    createdBy: ["validate_and_authorize"],
    closedBy: ["finalize_session"],
  },
  {
    id: "PendingPolicyUpdate",
    name: "PendingPolicyUpdate",
    displayName: "Pending Policy Update",
    seeds: '[b"pending_policy", vault]',
    size: "~820 bytes",
    zeroCopy: false,
    createdBy: ["queue_policy_update"],
    closedBy: ["apply_pending_policy", "cancel_pending_policy"],
  },
  {
    id: "InstructionConstraints",
    name: "InstructionConstraints",
    displayName: "Instruction Constraints",
    seeds: '[b"constraints", vault]',
    size: "8,318 bytes",
    zeroCopy: true,
    createdBy: ["allocate_constraints_pda"],
    closedBy: ["apply_close_constraints"],
  },
  {
    id: "PendingConstraintsUpdate",
    name: "PendingConstraintsUpdate",
    displayName: "Pending Constraints Update",
    seeds: '[b"pending_constraints", vault]',
    size: "8,334 bytes",
    zeroCopy: true,
    createdBy: ["allocate_pending_constraints_pda"],
    closedBy: [
      "apply_constraints_update",
      "cancel_constraints_update",
    ],
  },
  {
    id: "PendingCloseConstraints",
    name: "PendingCloseConstraints",
    displayName: "Pending Close Constraints",
    seeds: '[b"pending_close_constraints", vault]',
    size: "~80 bytes",
    zeroCopy: false,
    createdBy: ["queue_close_constraints"],
    closedBy: ["apply_close_constraints", "cancel_close_constraints"],
  },
  {
    id: "PendingAgentPermissionsUpdate",
    name: "PendingAgentPermissionsUpdate",
    displayName: "Pending Agent Perms",
    seeds: '[b"pending_agent_perms", vault, agent]',
    size: "~120 bytes",
    zeroCopy: false,
    createdBy: ["queue_agent_permissions_update"],
    closedBy: [
      "apply_agent_permissions_update",
      "cancel_agent_permissions_update",
    ],
  },
  {
    id: "EscrowDeposit",
    name: "EscrowDeposit",
    displayName: "Escrow Deposit",
    seeds: '[b"escrow", source_vault, dest_vault, escrow_id]',
    size: "170 bytes",
    zeroCopy: false,
    createdBy: ["create_escrow"],
    closedBy: ["close_settled_escrow"],
  },
  {
    id: "PostExecutionAssertions",
    name: "PostExecutionAssertions",
    displayName: "Post-Execution Assertions",
    seeds: '[b"post_assertions", vault]',
    size: "~1,200 bytes",
    zeroCopy: true,
    createdBy: ["create_post_assertions"],
    closedBy: ["close_post_assertions"],
  },
];

// ─── Events (35) ────────────────────────────────────────────────────────────

export const EVENTS: OnChainEvent[] = [
  {
    id: "VaultCreated",
    name: "VaultCreated",
    emittedBy: ["initialize_vault"],
  },
  {
    id: "FundsDeposited",
    name: "FundsDeposited",
    emittedBy: ["deposit_funds"],
  },
  {
    id: "FundsWithdrawn",
    name: "FundsWithdrawn",
    emittedBy: ["withdraw_funds"],
  },
  {
    id: "VaultClosed",
    name: "VaultClosed",
    emittedBy: ["close_vault"],
  },
  {
    id: "VaultFrozen",
    name: "VaultFrozen",
    emittedBy: ["freeze_vault"],
  },
  {
    id: "AgentRegistered",
    name: "AgentRegistered",
    emittedBy: ["register_agent"],
  },
  {
    id: "AgentRevoked",
    name: "AgentRevoked",
    emittedBy: ["revoke_agent"],
  },
  {
    id: "AgentPausedEvent",
    name: "AgentPausedEvent",
    emittedBy: ["pause_agent"],
  },
  {
    id: "AgentUnpausedEvent",
    name: "AgentUnpausedEvent",
    emittedBy: ["unpause_agent"],
  },
  {
    id: "VaultReactivated",
    name: "VaultReactivated",
    emittedBy: ["reactivate_vault"],
  },
  {
    id: "AgentPermissionsChangeQueued",
    name: "AgentPermissionsChangeQueued",
    emittedBy: ["queue_agent_permissions_update"],
  },
  {
    id: "AgentPermissionsChangeApplied",
    name: "AgentPermissionsChangeApplied",
    emittedBy: ["apply_agent_permissions_update"],
  },
  {
    id: "AgentPermissionsChangeCancelled",
    name: "AgentPermissionsChangeCancelled",
    emittedBy: ["cancel_agent_permissions_update"],
  },
  {
    id: "PositionsSynced",
    name: "PositionsSynced",
    emittedBy: ["sync_positions"],
  },
  {
    id: "ActionAuthorized",
    name: "ActionAuthorized",
    emittedBy: ["validate_and_authorize"],
  },
  {
    id: "FeesCollected",
    name: "FeesCollected",
    emittedBy: ["validate_and_authorize", "create_escrow", "agent_transfer"],
  },
  {
    id: "SessionFinalized",
    name: "SessionFinalized",
    emittedBy: ["finalize_session"],
  },
  {
    id: "DelegationRevoked",
    name: "DelegationRevoked",
    emittedBy: ["finalize_session"],
  },
  {
    id: "AgentSpendLimitChecked",
    name: "AgentSpendLimitChecked",
    emittedBy: ["finalize_session", "create_escrow", "agent_transfer"],
  },
  {
    id: "PolicyChangeQueued",
    name: "PolicyChangeQueued",
    emittedBy: ["queue_policy_update"],
  },
  {
    id: "PolicyChangeApplied",
    name: "PolicyChangeApplied",
    emittedBy: ["apply_pending_policy"],
  },
  {
    id: "PolicyChangeCancelled",
    name: "PolicyChangeCancelled",
    emittedBy: ["cancel_pending_policy"],
  },
  {
    id: "AgentTransferExecuted",
    name: "AgentTransferExecuted",
    emittedBy: ["agent_transfer"],
  },
  {
    id: "InstructionConstraintsCreated",
    name: "InstructionConstraintsCreated",
    emittedBy: ["create_instruction_constraints"],
  },
  {
    id: "PdaAllocated",
    name: "PdaAllocated",
    emittedBy: ["allocate_constraints_pda", "allocate_pending_constraints_pda"],
  },
  {
    id: "PdaExtended",
    name: "PdaExtended",
    emittedBy: ["extend_pda"],
  },
  {
    id: "ConstraintsChangeQueued",
    name: "ConstraintsChangeQueued",
    emittedBy: ["queue_constraints_update"],
  },
  {
    id: "ConstraintsChangeApplied",
    name: "ConstraintsChangeApplied",
    emittedBy: ["apply_constraints_update"],
  },
  {
    id: "ConstraintsChangeCancelled",
    name: "ConstraintsChangeCancelled",
    emittedBy: ["cancel_constraints_update"],
  },
  {
    id: "CloseConstraintsQueued",
    name: "CloseConstraintsQueued",
    emittedBy: ["queue_close_constraints"],
  },
  {
    id: "CloseConstraintsApplied",
    name: "CloseConstraintsApplied",
    emittedBy: ["apply_close_constraints"],
  },
  {
    id: "CloseConstraintsCancelled",
    name: "CloseConstraintsCancelled",
    emittedBy: ["cancel_close_constraints"],
  },
  {
    id: "EscrowCreated",
    name: "EscrowCreated",
    emittedBy: ["create_escrow"],
  },
  {
    id: "EscrowSettled",
    name: "EscrowSettled",
    emittedBy: ["settle_escrow"],
  },
  {
    id: "EscrowRefunded",
    name: "EscrowRefunded",
    emittedBy: ["refund_escrow"],
  },
  {
    id: "PostAssertionsCreated",
    name: "PostAssertionsCreated",
    emittedBy: ["create_post_assertions"],
  },
  {
    id: "PostAssertionsClosed",
    name: "PostAssertionsClosed",
    emittedBy: ["close_post_assertions"],
  },
  {
    id: "PostAssertionChecked",
    name: "PostAssertionChecked",
    emittedBy: ["finalize_session"],
  },
];

// ─── Lookup helpers ─────────────────────────────────────────────────────────

export const INSTRUCTION_MAP = new Map(INSTRUCTIONS.map((i) => [i.id, i]));
export const PDA_MAP = new Map(PDAS.map((p) => [p.id, p]));
export const EVENT_MAP = new Map(EVENTS.map((e) => [e.id, e]));

export const INSTRUCTION_GROUPS = [
  "vault",
  "agent",
  "auth",
  "policy",
  "constraints",
  "escrow",
  "transfer",
  "assertions",
] as const;

export type InstructionGroup = (typeof INSTRUCTION_GROUPS)[number];

export function getInstructionsByGroup(
  group: InstructionGroup,
): OnChainInstruction[] {
  return INSTRUCTIONS.filter((i) => i.group === group);
}
