/**
 * AgentPassport — Core SDK
 * Agent Credential Format (ACF) v0.1
 *
 * Spec: https://github.com/agentpassport/agentpassport/blob/main/docs/SPEC.md
 */

export interface ACFRules {
  blockActions?: string[]
  allowActions?: string[]
  maxSpendUsd?: number
  maxCallsPerRun?: number
  dataClassifications?: string[]
}

export interface ACFDelegation {
  humanPrincipal?: string
  parentAgentId?: string | null
  chain?: string[]
  maxDepth?: number
}

export interface ACFPayload {
  // Standard JWT
  iss: string
  sub: string
  iat: number
  exp: number

  // Identity (required)
  org: string
  orgDomain: string
  agentId: string

  // Permissions (required)
  scopes: string[]

  // Rules (optional)
  rules?: ACFRules

  // Delegation (optional)
  delegation?: ACFDelegation

  // Revocation (optional)
  revocationId?: string

  // Metadata
  acfVersion: string
}

export interface IssueOptions {
  agentId: string
  scopes: string[]
  rules?: ACFRules
  delegation?: Omit<ACFDelegation, 'chain'>
  ttl?: string   // e.g. '1h', '30m', '24h' — max '24h'
  revocationId?: string
}

export interface AgentPassportConfig {
  orgId: string
  orgDomain: string
  signingKey: string   // Ed25519 private key, base64
  issuerUrl?: string   // defaults to https://{orgDomain}/.well-known/agentpassport.json
}

export class AgentPassport {
  private config: AgentPassportConfig

  constructor(config: AgentPassportConfig) {
    this.config = config
  }

  /**
   * Issue a signed ACF token for an agent.
   *
   * @example
   * const { token, payload } = await ap.issue({
   *   agentId: 'research-agent-01',
   *   scopes: ['read:crm'],
   *   rules: { blockActions: ['send:email'] },
   *   ttl: '1h'
   * })
   */
  async issue(options: IssueOptions): Promise<{ token: string; payload: ACFPayload }> {
    // Implementation: sign JWT with Ed25519
    // See packages/core/src/sign.ts
    throw new Error('Not yet implemented — contributions welcome')
  }
}

export interface VerifyOptions {
  trustedIssuers?: string[]     // if empty, accepts any issuer
  checkRevocation?: boolean     // default: true if revocationId present
  clockSkewSeconds?: number     // default: 30
}

export interface VerifiedPassport extends ACFPayload {
  valid: true
  verifiedAt: number
}

/**
 * Verify an ACF token.
 * Offline verification — no network round trip for signature check.
 * Completes in < 1ms for cached public keys.
 *
 * @example
 * const passport = await verify(req.headers['x-agent-passport'])
 * // passport.org        → 'acme_corp'
 * // passport.agentId    → 'research-agent-01'
 * // passport.scopes     → ['read:crm']
 */
export async function verify(
  token: string,
  options?: VerifyOptions
): Promise<VerifiedPassport> {
  // Implementation: verify EdDSA signature, check exp, check revocation
  // See packages/verify/src/verify.ts
  throw new Error('Not yet implemented — contributions welcome')
}

export class RulesClient {
  constructor(private apiKey: string) {}

  /**
   * Revoke a specific agent's credentials immediately.
   * Propagates to all verifiers checking revocation endpoint in < 500ms.
   */
  async revoke(agentId: string): Promise<void> {
    throw new Error('Not yet implemented')
  }

  /**
   * Block an action across all agents in the org.
   * Changes take effect on next token verification.
   */
  async block(options: { action: string; agentId?: string }): Promise<void> {
    throw new Error('Not yet implemented')
  }
}
