// ─── SDK Module Architecture Data ───────────────────────────────────────────
// Key modules from @usesigil/kit (sdk/kit/src/).
// ~40 most architecturally significant modules out of 91 total.

export interface SdkModule {
  id: string;
  name: string;
  displayName: string;
  subpath:
    | "root"
    | "dashboard"
    | "x402"
    | "tee"
    | "errors"
    | "core"
    | "testing"
    | "integrations";
  category:
    | "tx-builder"
    | "rpc-consumer"
    | "pure-computation"
    | "error-handling"
    | "type-defs"
    | "testing";
  public: boolean;
  implemented: boolean;
  imports: string[];
  keyExports: string[];
  filePath: string;
  description: string;
}

export const SDK_MODULES: SdkModule[] = [
  // ── TX Builders ────────────────────────────────────────────────────────
  {
    id: "seal",
    name: "seal",
    displayName: "seal()",
    subpath: "root",
    category: "tx-builder",
    public: true,
    implemented: true,
    imports: [
      "kit-adapter",
      "resolve-accounts",
      "state-resolver",
      "composer",
      "simulation",
      "alt-loader",
      "priority-fees",
      "rpc-helpers",
      "types",
      "tokens",
      "agent-errors",
    ],
    keyExports: ["seal", "createSigilClient", "SigilClient", "replaceAgentAtas"],
    filePath: "sdk/kit/src/seal.ts",
    description:
      "Protocol-agnostic DeFi instruction sealing. Sandwiches arbitrary DeFi instructions with ValidateAndAuthorize + FinalizeSession.",
  },
  {
    id: "composer",
    name: "composer",
    displayName: "Transaction Composer",
    subpath: "root",
    category: "tx-builder",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "alt-config", "priority-fees", "types"],
    keyExports: [
      "composeSigilTransaction",
      "validateTransactionSize",
      "measureTransactionSize",
    ],
    filePath: "sdk/kit/src/composer.ts",
    description:
      "Builds atomic composed transactions using pipe() pattern: [ComputeBudget, ValidateAndAuthorize, ...defiIxs, FinalizeSession].",
  },
  {
    id: "create-vault",
    name: "create-vault",
    displayName: "Create Vault",
    subpath: "root",
    category: "tx-builder",
    public: true,
    implemented: true,
    imports: [
      "kit-adapter",
      "resolve-accounts",
      "rpc-helpers",
      "transaction-executor",
      "types",
    ],
    keyExports: ["createVault", "createAndSendVault"],
    filePath: "sdk/kit/src/create-vault.ts",
    description:
      "High-level vault creation with all four PDAs (Vault, Policy, Tracker, Overlay) initialized atomically.",
  },
  {
    id: "owner-transaction",
    name: "owner-transaction",
    displayName: "Owner Transaction",
    subpath: "root",
    category: "tx-builder",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "resolve-accounts", "rpc-helpers", "types"],
    keyExports: ["buildOwnerTransaction"],
    filePath: "sdk/kit/src/owner-transaction.ts",
    description:
      "Builds owner-signed transactions for vault management (register agent, queue policy, etc.).",
  },
  {
    id: "inscribe",
    name: "inscribe",
    displayName: "inscribe / withVault",
    subpath: "root",
    category: "tx-builder",
    public: true,
    implemented: true,
    imports: [
      "create-vault",
      "seal",
      "state-resolver",
      "types",
      "policies",
    ],
    keyExports: [
      "inscribe",
      "withVault",
      "mapPoliciesToVaultParams",
      "findNextVaultId",
    ],
    filePath: "sdk/kit/src/inscribe.ts",
    description:
      "One-call vault creation + first sealed transaction. withVault auto-discovers or creates a vault.",
  },
  {
    id: "rpc-helpers",
    name: "rpc-helpers",
    displayName: "RPC Helpers",
    subpath: "root",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["kit-adapter"],
    keyExports: [
      "BlockhashCache",
      "getBlockhashCache",
      "signAndEncode",
      "sendAndConfirmTransaction",
    ],
    filePath: "sdk/kit/src/rpc-helpers.ts",
    description:
      "Blockhash caching, transaction signing, send-and-confirm with retry logic.",
  },
  {
    id: "transaction-executor",
    name: "transaction-executor",
    displayName: "Transaction Executor",
    subpath: "root",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "rpc-helpers", "priority-fees", "simulation"],
    keyExports: ["TransactionExecutor"],
    filePath: "sdk/kit/src/transaction-executor.ts",
    description:
      "Stateful executor with priority fee estimation, simulation, CU adjustment, and retry.",
  },

  // ── State Resolution ───────────────────────────────────────────────────
  {
    id: "state-resolver",
    name: "state-resolver",
    displayName: "State Resolver",
    subpath: "root",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "resolve-accounts", "types", "math-utils"],
    keyExports: [
      "resolveVaultState",
      "resolveVaultStateForOwner",
      "resolveVaultBudget",
      "getRolling24hUsd",
      "getAgentRolling24hUsd",
      "getProtocolSpend",
      "getSpendingHistory",
      "findVaultsByOwner",
      "findEscrowsByVault",
    ],
    filePath: "sdk/kit/src/state-resolver.ts",
    description:
      "L0 foundation. One batched RPC call resolves all vault accounts and computes rolling 24h budgets mirroring on-chain math.",
  },
  {
    id: "resolve-accounts",
    name: "resolve-accounts",
    displayName: "PDA Resolver",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "types"],
    keyExports: [
      "getVaultPDA",
      "getPolicyPDA",
      "getTrackerPDA",
      "getSessionPDA",
      "getAgentOverlayPDA",
      "getConstraintsPDA",
      "getEscrowPDA",
      "resolveAccounts",
    ],
    filePath: "sdk/kit/src/resolve-accounts.ts",
    description:
      "Deterministic PDA derivation for all 12 account types. Pure functions, no RPC.",
  },
  {
    id: "balance-tracker",
    name: "balance-tracker",
    displayName: "Balance Tracker",
    subpath: "root",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "state-resolver", "types", "tokens"],
    keyExports: [
      "getVaultPnL",
      "getVaultPnLFromState",
      "getVaultTokenBalances",
      "getBalancePnL",
      "BalanceSnapshotStore",
    ],
    filePath: "sdk/kit/src/balance-tracker.ts",
    description:
      "Vault P&L tracking from on-chain deposit/withdrawal counters and token balances.",
  },
  {
    id: "tokens",
    name: "tokens",
    displayName: "Token Resolution",
    subpath: "root",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "types"],
    keyExports: ["resolveToken", "toBaseUnits", "fromBaseUnits"],
    filePath: "sdk/kit/src/tokens.ts",
    description:
      "Token metadata resolution, base unit conversion for USDC/USDT (6 decimals).",
  },

  // ── Analytics (8 modules) ──────────────────────────────────────────────
  {
    id: "spending-analytics",
    name: "spending-analytics",
    displayName: "Spending Analytics",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["state-resolver", "types", "math-utils"],
    keyExports: [
      "getSpendingVelocity",
      "getSpendingBreakdown",
      "getAgentSpendingHistory",
    ],
    filePath: "sdk/kit/src/spending-analytics.ts",
    description:
      "Spending velocity, breakdown by protocol/agent, and historical spend curves.",
  },
  {
    id: "agent-analytics",
    name: "agent-analytics",
    displayName: "Agent Analytics",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["state-resolver", "types", "math-utils"],
    keyExports: [
      "getAgentProfile",
      "getAgentLeaderboard",
      "getAgentComparison",
      "getAgentErrorBreakdown",
    ],
    filePath: "sdk/kit/src/agent-analytics.ts",
    description:
      "Per-agent profiles, leaderboards, cross-agent comparison, and error breakdown.",
  },
  {
    id: "security-analytics",
    name: "security-analytics",
    displayName: "Security Analytics",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["state-resolver", "types"],
    keyExports: [
      "getSecurityPosture",
      "evaluateAlertConditions",
      "getAuditTrail",
      "getAuditTrailSummary",
    ],
    filePath: "sdk/kit/src/security-analytics.ts",
    description:
      "Security posture scoring, alert condition evaluation, and audit trail generation.",
  },
  {
    id: "vault-analytics",
    name: "vault-analytics",
    displayName: "Vault Analytics",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["state-resolver", "types", "math-utils"],
    keyExports: ["getVaultHealth", "getVaultSummary"],
    filePath: "sdk/kit/src/vault-analytics.ts",
    description:
      "Vault health scoring and summary statistics from resolved state.",
  },
  {
    id: "portfolio-analytics",
    name: "portfolio-analytics",
    displayName: "Portfolio Analytics",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["state-resolver", "types", "math-utils"],
    keyExports: [
      "getPortfolioOverview",
      "aggregatePortfolio",
      "getCrossVaultAgentRanking",
      "getPortfolioTimeSeries",
    ],
    filePath: "sdk/kit/src/portfolio-analytics.ts",
    description:
      "Multi-vault portfolio aggregation, cross-vault agent rankings, and time series.",
  },
  {
    id: "protocol-analytics",
    name: "protocol-analytics",
    displayName: "Protocol Analytics",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["state-resolver", "types", "protocol-names"],
    keyExports: ["getProtocolBreakdown", "getProtocolUsageAcrossVaults"],
    filePath: "sdk/kit/src/protocol-analytics.ts",
    description:
      "Protocol-level spend breakdown and cross-vault protocol usage analysis.",
  },
  {
    id: "advanced-analytics",
    name: "advanced-analytics",
    displayName: "Advanced Analytics",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["state-resolver", "types", "math-utils"],
    keyExports: [
      "getSlippageEfficiency",
      "getCapVelocity",
      "getSessionDeviationRate",
      "getIdleCapitalDuration",
      "getPermissionEscalationLatency",
      "getInstructionCoverageRatio",
      "getPermissionUtilizationRate",
    ],
    filePath: "sdk/kit/src/advanced-analytics.ts",
    description:
      "Slippage efficiency, cap velocity, session deviation, idle capital, and permission utilization.",
  },
  {
    id: "event-analytics",
    name: "event-analytics",
    displayName: "Event Analytics",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["events", "types"],
    keyExports: [
      "categorizeEvent",
      "describeEvent",
      "buildActivityItem",
      "getVaultActivity",
    ],
    filePath: "sdk/kit/src/event-analytics.ts",
    description:
      "Event categorization, human-readable descriptions, and activity feed construction.",
  },

  // ── Shield ─────────────────────────────────────────────────────────────
  {
    id: "shield",
    name: "shield",
    displayName: "Shield",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: [
      "kit-adapter",
      "types",
      "policies",
      "inspector",
      "velocity-tracker",
      "core",
    ],
    keyExports: [
      "ShieldState",
      "ShieldDeniedError",
      "evaluateInstructions",
      "shield",
      "createShieldedSigner",
    ],
    filePath: "sdk/kit/src/shield.ts",
    description:
      "Client-side policy enforcement (defense-in-depth). Spending limits, rate limits, program allowlists. Advisory layer over on-chain enforcement.",
  },
  {
    id: "simulation",
    name: "simulation",
    displayName: "Simulation",
    subpath: "root",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "types"],
    keyExports: [
      "simulateBeforeSend",
      "detectDrainAttempt",
      "detectDrainFromSealContext",
      "adjustCU",
    ],
    filePath: "sdk/kit/src/simulation.ts",
    description:
      "Pre-send simulation with drain detection, CU adjustment, and risk flag analysis.",
  },
  {
    id: "inspector",
    name: "inspector",
    displayName: "Inspector",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["types"],
    keyExports: ["analyzeInstructions", "inspectConstraints"],
    filePath: "sdk/kit/src/inspector.ts",
    description:
      "Static instruction analysis: token transfer detection, dangerous operation flagging, constraint inspection.",
  },
  {
    id: "policies",
    name: "policies",
    displayName: "Policies",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["types", "core"],
    keyExports: [
      "resolvePolicies",
      "toCoreAnalysis",
      "validateSpendLimitMints",
      "DEFAULT_POLICIES",
      "parseSpendLimit",
    ],
    filePath: "sdk/kit/src/policies.ts",
    description:
      "Policy resolution and validation. Maps vault PolicyConfig to client-side enforcement rules.",
  },
  {
    id: "velocity-tracker",
    name: "velocity-tracker",
    displayName: "Velocity Tracker",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["types"],
    keyExports: ["VelocityTracker"],
    filePath: "sdk/kit/src/velocity-tracker.ts",
    description:
      "Client-side rate limiting with sliding window spend tracking.",
  },

  // ── Dashboard ──────────────────────────────────────────────────────────
  {
    id: "dashboard-index",
    name: "dashboard/index",
    displayName: "Dashboard Client",
    subpath: "dashboard",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: [
      "dashboard-reads",
      "dashboard-mutations",
      "dashboard-types",
      "kit-adapter",
    ],
    keyExports: ["createOwnerClient", "OwnerClient"],
    filePath: "sdk/kit/src/dashboard/index.ts",
    description:
      "OwnerClient factory for dashboard integration. Combines reads + mutations into a single API surface.",
  },
  {
    id: "dashboard-reads",
    name: "dashboard/reads",
    displayName: "Dashboard Reads",
    subpath: "dashboard",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: [
      "state-resolver",
      "resolve-accounts",
      "kit-adapter",
      "dashboard-types",
    ],
    keyExports: ["createReads"],
    filePath: "sdk/kit/src/dashboard/reads.ts",
    description:
      "RPC read operations for the dashboard: vault state, policies, agents, constraints.",
  },
  {
    id: "dashboard-mutations",
    name: "dashboard/mutations",
    displayName: "Dashboard Mutations",
    subpath: "dashboard",
    category: "tx-builder",
    public: true,
    implemented: true,
    imports: [
      "owner-transaction",
      "rpc-helpers",
      "kit-adapter",
      "dashboard-types",
    ],
    keyExports: ["createMutations"],
    filePath: "sdk/kit/src/dashboard/mutations.ts",
    description:
      "Owner-signed mutation builders for the dashboard: register agent, queue policy, deposit, withdraw.",
  },
  {
    id: "dashboard-from-json",
    name: "dashboard/from-json",
    displayName: "Dashboard JSON Parser",
    subpath: "dashboard",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["dashboard-types"],
    keyExports: ["fromJSON"],
    filePath: "sdk/kit/src/dashboard/from-json.ts",
    description:
      "Deserializes JSON-encoded vault state for dashboard hydration.",
  },
  {
    id: "dashboard-types",
    name: "dashboard/types",
    displayName: "Dashboard Types",
    subpath: "dashboard",
    category: "type-defs",
    public: true,
    implemented: true,
    imports: [],
    keyExports: ["OwnerClientConfig"],
    filePath: "sdk/kit/src/dashboard/types.ts",
    description: "Type definitions for the dashboard subpath.",
  },
  {
    id: "dashboard-discover",
    name: "dashboard/discover",
    displayName: "Dashboard Discover",
    subpath: "dashboard",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["kit-adapter", "resolve-accounts"],
    keyExports: ["discoverVaults"],
    filePath: "sdk/kit/src/dashboard/discover.ts",
    description:
      "Vault discovery via getProgramAccounts with owner-based filtering.",
  },

  // ── x402 ───────────────────────────────────────────────────────────────
  {
    id: "x402-shielded-fetch",
    name: "x402/shielded-fetch",
    displayName: "Shielded Fetch",
    subpath: "x402",
    category: "tx-builder",
    public: true,
    implemented: true,
    imports: [
      "x402-codec",
      "x402-policy-bridge",
      "seal",
      "kit-adapter",
      "types",
    ],
    keyExports: ["shieldedFetch"],
    filePath: "sdk/kit/src/x402/shielded-fetch.ts",
    description:
      "HTTP 402 Payment Required integration. Intercepts 402 responses and auto-pays via sealed transactions.",
  },
  {
    id: "x402-codec",
    name: "x402/codec",
    displayName: "x402 Codec",
    subpath: "x402",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["types"],
    keyExports: ["encodePaymentHeader", "decodePaymentHeader"],
    filePath: "sdk/kit/src/x402/codec.ts",
    description:
      "Encodes and decodes x402 payment headers (base64 wire format).",
  },
  {
    id: "x402-policy-bridge",
    name: "x402/policy-bridge",
    displayName: "x402 Policy Bridge",
    subpath: "x402",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["types", "policies"],
    keyExports: ["bridgePolicies"],
    filePath: "sdk/kit/src/x402/policy-bridge.ts",
    description:
      "Bridges vault PolicyConfig to x402 payment authorization rules.",
  },

  // ── TEE ────────────────────────────────────────────────────────────────
  {
    id: "tee-verify",
    name: "tee/verify",
    displayName: "TEE Verify",
    subpath: "tee",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["tee-types"],
    keyExports: ["verifyTeeAttestation", "AttestationCache"],
    filePath: "sdk/kit/src/tee/verify.ts",
    description:
      "TEE attestation verification with certificate chain validation and PCR matching.",
  },
  {
    id: "tee-turnkey",
    name: "tee/providers/turnkey",
    displayName: "Turnkey Provider",
    subpath: "tee",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["tee-verify", "tee-types"],
    keyExports: ["verifyTurnkey"],
    filePath: "sdk/kit/src/tee/providers/turnkey.ts",
    description:
      "Turnkey HSM attestation verification. Recommended custody provider.",
  },

  // ── Errors ─────────────────────────────────────────────────────────────
  {
    id: "errors-base",
    name: "errors/base",
    displayName: "Error Base",
    subpath: "errors",
    category: "error-handling",
    public: true,
    implemented: true,
    imports: [],
    keyExports: [
      "SigilError",
      "SigilShieldError",
      "SigilTeeError",
      "SigilX402Error",
      "SigilComposeError",
      "SigilRpcError",
    ],
    filePath: "sdk/kit/src/errors/base.ts",
    description:
      "Unified error taxonomy base classes. All SDK errors extend domain-specific base classes.",
  },
  {
    id: "errors-codes",
    name: "errors/codes",
    displayName: "Error Codes",
    subpath: "errors",
    category: "error-handling",
    public: true,
    implemented: true,
    imports: [],
    keyExports: [
      "SIGIL_ERROR__SHIELD__POLICY_DENIED",
      "SIGIL_ERROR__TEE__ATTESTATION_FAILED",
      "SIGIL_ERROR__COMPOSE__MISSING_PARAM",
      "SIGIL_ERROR__X402__HEADER_MALFORMED",
      "SIGIL_ERROR__SDK__INVALID_CONFIG",
      "SIGIL_ERROR__RPC__TX_FAILED",
      "SIGIL_ERROR__PROGRAM__GENERIC",
    ],
    filePath: "sdk/kit/src/errors/codes.ts",
    description:
      "47 canonical error code constants across 7 domains (shield, TEE, compose, x402, SDK, RPC, program).",
  },
  {
    id: "agent-errors",
    name: "agent-errors",
    displayName: "Agent Errors",
    subpath: "root",
    category: "error-handling",
    public: true,
    implemented: true,
    imports: ["types"],
    keyExports: [
      "ON_CHAIN_ERROR_MAP",
      "toAgentError",
      "toSigilAgentError",
      "SigilSdkError",
      "parseOnChainErrorCode",
      "isAgentError",
      "categorizeError",
    ],
    filePath: "sdk/kit/src/agent-errors.ts",
    description:
      "Maps all 71 on-chain error codes (6000-6070) to agent-friendly error objects with recovery actions.",
  },

  // ── Other Key Modules ──────────────────────────────────────────────────
  {
    id: "types",
    name: "types",
    displayName: "Types & Constants",
    subpath: "root",
    category: "type-defs",
    public: true,
    implemented: true,
    imports: [],
    keyExports: [
      "SIGIL_PROGRAM_ADDRESS",
      "SUPPORTED_PROTOCOLS",
      "RECOGNIZED_DEFI_PROGRAMS",
      "isStablecoinMint",
      "parseActionType",
      "isSpendingAction",
      "FULL_CAPABILITY",
    ],
    filePath: "sdk/kit/src/types.ts",
    description:
      "Program address, fee constants, protocol registry, stablecoin mints, action types, and branded types.",
  },
  {
    id: "formatting",
    name: "formatting",
    displayName: "Formatting",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: [],
    keyExports: [
      "formatUsd",
      "formatUsdCompact",
      "formatPercent",
      "formatDuration",
      "formatAddress",
      "formatTokenAmount",
      "toUsdNumber",
      "fromUsdNumber",
    ],
    filePath: "sdk/kit/src/formatting.ts",
    description:
      "Display formatting for USD amounts, percentages, durations, addresses, and token amounts.",
  },
  {
    id: "protocol-names",
    name: "protocol-names",
    displayName: "Protocol Names",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: [],
    keyExports: ["resolveProtocolName", "PROTOCOL_NAMES"],
    filePath: "sdk/kit/src/protocol-names.ts",
    description:
      "Maps on-chain protocol program IDs to human-readable names (Jupiter, Flash Trade, etc.).",
  },
  {
    id: "presets",
    name: "presets",
    displayName: "Vault Presets",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["types"],
    keyExports: [
      "VAULT_PRESETS",
      "getPreset",
      "listPresets",
      "presetToCreateVaultFields",
    ],
    filePath: "sdk/kit/src/presets.ts",
    description:
      "Pre-configured vault templates (conservative, moderate, aggressive) for quick setup.",
  },
  {
    id: "kit-adapter",
    name: "kit-adapter",
    displayName: "Kit Adapter",
    subpath: "root",
    category: "type-defs",
    public: false,
    implemented: true,
    imports: [],
    keyExports: ["pipe", "compileTransaction", "AccountRole"],
    filePath: "sdk/kit/src/kit-adapter.ts",
    description:
      "Thin re-export layer over @solana/kit. Isolates the SDK from direct kit dependency.",
  },
  {
    id: "custody-adapter",
    name: "custody-adapter",
    displayName: "Custody Adapter",
    subpath: "root",
    category: "type-defs",
    public: true,
    implemented: true,
    imports: ["kit-adapter"],
    keyExports: ["custodyAdapterToTransactionSigner"],
    filePath: "sdk/kit/src/custody-adapter.ts",
    description:
      "Bridges external custody providers (Turnkey, Privy, Crossmint) to @solana/kit TransactionSigner.",
  },
  {
    id: "events",
    name: "events",
    displayName: "Event Parser",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["types"],
    keyExports: [
      "parseSigilEvents",
      "filterEvents",
      "decodeSigilEvent",
      "parseAndDecodeSigilEvents",
    ],
    filePath: "sdk/kit/src/events.ts",
    description:
      "Parses Anchor events from transaction logs. Decodes all 35 Sigil event types.",
  },
  {
    id: "priority-fees",
    name: "priority-fees",
    displayName: "Priority Fees",
    subpath: "root",
    category: "rpc-consumer",
    public: true,
    implemented: true,
    imports: ["kit-adapter"],
    keyExports: [
      "estimateComposedCU",
      "PriorityFeeEstimator",
      "CU_JUPITER_SWAP",
      "CU_FLASH_TRADE",
    ],
    filePath: "sdk/kit/src/priority-fees.ts",
    description:
      "CU estimation per protocol and priority fee estimation via recent fee percentiles.",
  },
  {
    id: "protocol-resolver",
    name: "protocol-resolver",
    displayName: "Protocol Resolver",
    subpath: "root",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["types"],
    keyExports: ["ProtocolTier", "isProtocolAllowed", "resolveProtocol"],
    filePath: "sdk/kit/src/protocol-resolver.ts",
    description:
      "Resolves protocol addresses to tier classification and allowlist validation.",
  },
  {
    id: "math-utils",
    name: "math-utils",
    displayName: "Math Utils",
    subpath: "root",
    category: "pure-computation",
    public: false,
    implemented: true,
    imports: [],
    keyExports: ["computeUtilizationPercent"],
    filePath: "sdk/kit/src/math-utils.ts",
    description:
      "Shared math utilities: utilization percentage, safe division, BPS conversion.",
  },

  // ── Core Policy Engine ─────────────────────────────────────────────────
  {
    id: "core-engine",
    name: "core/engine",
    displayName: "Core Engine",
    subpath: "core",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: ["core-state", "core-registry"],
    keyExports: ["evaluatePolicy", "enforcePolicy", "recordTransaction"],
    filePath: "sdk/kit/src/core/engine.ts",
    description:
      "Core policy evaluation engine. Pure functions for policy enforcement without RPC.",
  },
  {
    id: "core-registry",
    name: "core/registry",
    displayName: "Core Registry",
    subpath: "core",
    category: "pure-computation",
    public: true,
    implemented: true,
    imports: [],
    keyExports: [
      "KNOWN_PROTOCOLS",
      "KNOWN_TOKENS",
      "SYSTEM_PROGRAMS",
      "getTokenInfo",
      "getProtocolName",
    ],
    filePath: "sdk/kit/src/core/registry.ts",
    description:
      "Protocol and token registries. 32 known protocols, stablecoin metadata, system program set.",
  },

  // ── Unimplemented (planned) ────────────────────────────────────────────
  {
    id: "mcp",
    name: "mcp",
    displayName: "MCP Server",
    subpath: "integrations",
    category: "tx-builder",
    public: true,
    implemented: false,
    imports: ["seal", "state-resolver", "types"],
    keyExports: [],
    filePath: "sdk/kit/src/mcp/index.ts",
    description:
      "Model Context Protocol server for AI agent integration. Planned.",
  },
  {
    id: "cli",
    name: "cli",
    displayName: "CLI",
    subpath: "integrations",
    category: "tx-builder",
    public: true,
    implemented: false,
    imports: ["seal", "create-vault", "state-resolver"],
    keyExports: [],
    filePath: "sdk/kit/src/cli/index.ts",
    description:
      "Command-line interface for vault management and sealed transactions. Planned.",
  },
  {
    id: "react-hooks",
    name: "react-hooks",
    displayName: "React Hooks",
    subpath: "integrations",
    category: "rpc-consumer",
    public: true,
    implemented: false,
    imports: ["state-resolver", "seal", "types"],
    keyExports: [],
    filePath: "sdk/kit/src/react/index.ts",
    description:
      "React hooks for vault state, seal execution, and real-time updates. Planned.",
  },
];

// ─── Lookup helpers ─────────────────────────────────────────────────────────

export const SDK_MODULE_MAP = new Map(SDK_MODULES.map((m) => [m.id, m]));

export const SDK_SUBPATHS = [
  "root",
  "dashboard",
  "x402",
  "tee",
  "errors",
  "core",
  "testing",
  "integrations",
] as const;

export type SdkSubpath = (typeof SDK_SUBPATHS)[number];

export function getModulesBySubpath(subpath: SdkSubpath): SdkModule[] {
  return SDK_MODULES.filter((m) => m.subpath === subpath);
}

export function getModulesByCategory(
  category: SdkModule["category"],
): SdkModule[] {
  return SDK_MODULES.filter((m) => m.category === category);
}
