/**
 * ACF — Agent Credential Format
 * Core SDK — v0.1 draft
 *
 * Spec: https://github.com/teamofonePM/agentpassport/blob/main/docs/SPEC.md
 * Built by: https://www.linkedin.com/in/theanmolrattan/
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
  ttl?: string  // '1h' | '30m' | '24h' — max '24h'
}

export interface ACFConfig {
  orgId: string
  orgDomain: string
  signingKey: string  // Ed25519 private key — load from environment, never hardcode
  issuerUrl?: string  // defaults to https://{orgDomain}/.well-known/acf.json
}

export class ACF {
  private config: ACFConfig

  constructor(config: ACFConfig) {
    this.config = config
  }

  /**
   * Issue a signed ACF token for an agent.
   *
   * @example
   * const acf = new ACF({
   *   orgId: 'acme_corp',
   *   orgDomain: 'acme.com',
   *   signingKey: process.env.ACF_PRIVATE_KEY  // never hardcode
   * })
   *
   * const { token } = await acf.issue({
   *   agentId: 'research-agent-01',
   *   scopes: ['read:crm'],
   *   rules: { blockActions: ['send:email'] },
   *   ttl: '1h'
   * })
   */
  async issue(options: IssueOptions): Promise<{ token: string; payload: ACFPayload }> {
    // Implementation: sign JWT with Ed25519
    // Contributions welcome — see CONTRIBUTING.md
    throw new Error('Not yet implemented')
  }
}

export interface VerifyOptions {
  trustedIssuers?: string[]   // empty = accept any issuer
  checkRevocation?: boolean   // default: true when revocationId present
  clockSkewSeconds?: number   // default: 30
}

export interface VerifiedCredential extends ACFPayload {
  valid: true
  verifiedAt: number
}

/**
 * Verify an ACF token.
 *
 * Offline verification — no network round trip for signature check.
 * Public keys are cached from the issuer's jwks_uri.
 * Completes in under 1ms for cached keys.
 *
 * @example
 * const credential = await verify(req.headers['x-acf-token'])
 *
 * // credential.org      -> 'acme_corp'
 * // credential.agentId  -> 'research-agent-01'
 * // credential.scopes   -> ['read:crm']
 * // credential.rules    -> { blockActions: ['send:email'] }
 */
export async function verify(
  token: string,
  options?: VerifyOptions
): Promise<VerifiedCredential> {
  // Implementation: verify EdDSA signature, check exp, optionally check revocation
  // Contributions welcome — see CONTRIBUTING.md
  throw new Error('Not yet implemented')
}

export class RulesClient {
  constructor(private apiKey: string) {}

  /**
   * Revoke a specific agent's credentials immediately.
   * Propagates to all verifiers checking the revocation endpoint in under 500ms.
   *
   * @example
   * const rules = new RulesClient(process.env.ACF_KEY)
   * await rules.revoke('research-agent-01')
   */
  async revoke(agentId: string): Promise<void> {
    throw new Error('Not yet implemented')
  }

  /**
   * Block an action across all agents in the org.
   * Optionally scope to a single agent.
   *
   * @example
   * await rules.block({ action: 'send:external-email' })
   * await rules.block({ action: 'write:db', agentId: 'specific-agent' })
   */
  async block(options: { action: string; agentId?: string }): Promise<void> {
    throw new Error('Not yet implemented')
  }
}
