# Agent Credential Format (ACF) — Specification v0.1 (Draft)

**Status:** Draft — open for community feedback  
**Last updated:** March 2026  
**Authors:** AgentPassport contributors  
**Discuss:** [GitHub Discussions](../../discussions/categories/spec)

---

## Abstract

The Agent Credential Format (ACF) defines a standard for representing the identity, permissions, and delegation chain of an autonomous AI agent. An ACF token is a signed JWT that an agent carries on every request. Any party receiving the request can verify it offline in under 1ms — without a network round trip, without a shared secret, and without contacting the issuing service.

This specification is intentionally narrow. It defines **what a credential contains** and **how it is verified**. It does not define agent behavior, orchestration, or how credentials are issued (that is the role of a conformant issuer implementation).

---

## Motivation

### The problem

AI agents are operating in production environments at scale. Unlike human users, agents:

1. Have no standard way to identify themselves to the APIs they call
2. Cannot carry verifiable proof of what they are authorized to do
3. Leave no standard audit trail of their actions
4. Cannot be reliably revoked if they behave unexpectedly

The consequences are documented and severe:

- **68%** of organizations cannot distinguish AI agent activity from human activity in their systems *(Cloud Security Alliance / Aembit, "Identity and Access Gaps in the Age of Autonomous AI", January 2026, n=228)*
- **84%** could not pass a compliance audit on agent behavior *(CSA / Strata Identity, "Securing Autonomous AI Agents", October 2025, n=285)*
- **78%** have no policy for creating or removing AI agent identities *(CSA / Oasis Security, "State of Non-Human Identity and AI Security", January 2026)*
- MCP's own 2026 roadmap explicitly lists audit trails, enterprise-managed auth, and delegation chains as **"gaps the protocol does not yet address"** *(MCP Roadmap, March 5 2026, modelcontextprotocol.io/development/roadmap)*

### What already exists

Several related standards address adjacent problems but leave this gap unfilled:

| Standard | What it defines | What it does not define |
|---|---|---|
| **MCP** (Anthropic / Linux Foundation) | Agent-to-tool communication | Runtime agent identity, scoped permissions, delegation chains |
| **A2A** (Google / Linux Foundation) | Agent-to-agent communication | Enforcement of declared permissions, audit trail |
| **OAuth 2.1** | Human and service authorization | Agent-specific fields (parentAgentId, rules, delegation) |
| **OIDC** | Human identity assertion | Non-human principal types, agent-specific claims |

ACF is designed to **complement** these standards, not replace them. An ACF token is an OAuth 2.1-compatible JWT with additional agent-specific claims.

---

## Token Structure

An ACF token is a **JWT** (RFC 7519) signed using **EdDSA** (Ed25519). The payload contains standard JWT claims plus a set of agent-specific claims defined in this specification.

### Header

```json
{
  "alg": "EdDSA",
  "typ": "ACF+JWT",
  "kid": "key-id-of-signing-key"
}
```

### Payload

```json
{
  "iss": "https://acme.com/.well-known/agentpassport.json",
  "sub": "agent:acme_corp:research-agent-01",
  "iat": 1742641260,
  "exp": 1742644860,

  "org": "acme_corp",
  "org_domain": "acme.com",
  "agent_id": "research-agent-01",
  "scopes": ["read:crm", "read:reports"],

  "rules": {
    "block_actions": ["send:email", "write:db"],
    "max_spend_usd": 50,
    "max_calls_per_run": 1000,
    "data_classifications": ["internal", "confidential"]
  },

  "delegation": {
    "human_principal": "user:jane@acme.com",
    "parent_agent_id": null,
    "chain": [],
    "max_depth": 3
  },

  "revocation_id": "rev_01HXYZ123ABC",
  "acf_version": "0.1"
}
```

---

## Claims Reference

### Standard JWT claims (required)

| Claim | Type | Description |
|---|---|---|
| `iss` | URI | Issuer — must be a URL pointing to the org's `/.well-known/agentpassport.json` endpoint |
| `sub` | string | Subject — format: `agent:{org}:{agentId}` |
| `iat` | unix timestamp | Issued at |
| `exp` | unix timestamp | Expiry. **Maximum TTL is 24 hours.** Issuers SHOULD use short TTLs (1h default). |

### Identity claims (required)

| Claim | Type | Description |
|---|---|---|
| `org` | string | Org identifier. Must match the org registered at the issuer. Case-insensitive. |
| `org_domain` | string | The domain that was verified during org registration (e.g. `acme.com`). Verifiers can confirm via DNS. |
| `agent_id` | string | Unique identifier for this agent within the org. Stable across token refreshes. |

### Permission claims (required)

| Claim | Type | Description |
|---|---|---|
| `scopes` | string[] | Actions this agent is permitted to perform. Follows OAuth 2.0 scope naming convention (`resource:action`). Verifiers MUST reject requests for scopes not listed. |

### Rules claims (optional but recommended)

| Claim | Type | Description |
|---|---|---|
| `rules.block_actions` | string[] | Actions explicitly blocked regardless of scope. Takes precedence over `scopes`. |
| `rules.max_spend_usd` | number | Maximum spend this agent may incur in a single run, in USD. |
| `rules.max_calls_per_run` | number | Maximum API calls in a single run before the credential is considered exhausted. |
| `rules.data_classifications` | string[] | Data classifications this agent is permitted to access. Verifiers should enforce against their own classification scheme. |

### Delegation claims (optional)

| Claim | Type | Description |
|---|---|---|
| `delegation.human_principal` | string | The human user or service account that authorized this agent. Required for EU AI Act compliance workflows. Format: `user:{email}` or `service:{id}` |
| `delegation.parent_agent_id` | string \| null | If this agent was spawned by another agent, the parent's `agent_id`. Null if spawned by a human. |
| `delegation.chain` | string[] | Ordered list of `agent_id` values in the delegation chain, from root to immediate parent. Maximum length governed by `max_depth`. |
| `delegation.max_depth` | number | Maximum delegation depth permitted from this credential. A value of 0 means this agent may not spawn further agents. Default: 3. |

### Revocation claims (optional)

| Claim | Type | Description |
|---|---|---|
| `revocation_id` | string | Opaque identifier used to check revocation status against the issuer's revocation endpoint. If absent, revocation is TTL-only. If present, verifiers SHOULD check the revocation endpoint on first use within a session. |

### Metadata claims (required)

| Claim | Type | Description |
|---|---|---|
| `acf_version` | string | ACF spec version this token conforms to. Currently `"0.1"`. |

---

## Issuer Discovery

An org that issues ACF tokens MUST publish a discovery document at:

```
https://{org_domain}/.well-known/agentpassport.json
```

This document MUST contain at minimum:

```json
{
  "issuer": "https://acme.com",
  "jwks_uri": "https://acme.com/.well-known/jwks.json",
  "acf_version": "0.1",
  "revocation_endpoint": "https://api.acme.com/acf/revoke/{revocation_id}"
}
```

---

## Verification

A conformant verifier MUST:

1. Decode the JWT header and payload without verification
2. Check `acf_version` is a version the verifier understands
3. Retrieve the issuer's public key from `jwks_uri` (cached; SHOULD NOT fetch on every request)
4. Verify the EdDSA signature
5. Verify `exp` > current time
6. Verify `iss` matches a trusted issuer (verifier's own policy)
7. If `revocation_id` is present and verifier has not seen this token in the current session, check the revocation endpoint

A conformant verifier MUST NOT accept a token that fails any of the above checks.

Verification SHOULD complete in under 5ms. Offline verification (steps 1-6) SHOULD complete in under 1ms.

---

## Scope Enforcement

Verifiers SHOULD use `scopes` as an allowlist. A request for an action not in `scopes` MUST be rejected with HTTP 403.

Verifiers MUST treat `rules.block_actions` as taking precedence over `scopes`. If an action is in both `scopes` and `block_actions`, it is blocked.

---

## Delegation Chain Validation

When a verifier receives a token with `delegation.parent_agent_id` set:

1. The verifier MAY require that the parent agent's credential also be presented (via a second header or embedded claim)
2. The verifier MUST verify that `delegation.chain` does not exceed `delegation.max_depth`
3. Sub-agents MUST NOT have scopes that exceed their parent's scopes — the issuer MUST enforce this at issuance

---

## Security Considerations

### Short TTLs

Issuers SHOULD issue tokens with short TTLs (1 hour by default, maximum 24 hours). Short TTLs limit the blast radius of a compromised token.

### Key rotation

Issuers SHOULD rotate signing keys regularly. The `kid` header claim allows verifiers to cache multiple public keys simultaneously.

### Revocation latency

The `revocation_id` mechanism introduces latency between a revocation event and its enforcement. Verifiers should be aware that a token may be valid until its revocation is propagated. For high-security applications, use short TTLs instead of or in addition to revocation.

### Delegation chain attacks

A compromised agent may attempt to claim a longer delegation chain than actually exists, or falsify `human_principal`. Issuers MUST sign the delegation claims as part of the token payload. Verifiers MUST verify the signature covers these fields.

### Confused deputy

An agent receiving a forged or replayed ACF token may perform actions on behalf of a different principal. Verifiers SHOULD include a nonce or request-binding mechanism for sensitive operations.

---

## Relationship to Existing Standards

### MCP (Model Context Protocol)

MCP's 2026 roadmap explicitly lists as unaddressed: audit trails and observability, enterprise-managed auth, and delegation chains. ACF is designed to fill this gap. An ACF token can be carried as a custom header on MCP requests without modifying the MCP protocol itself.

Reference: [modelcontextprotocol.io/development/roadmap](https://modelcontextprotocol.io/development/roadmap) (updated March 5 2026)

### A2A (Agent2Agent Protocol)

A2A's AgentCard defines an agent's capabilities and authentication requirements, but does not define runtime permission enforcement or delegation chain verification. ACF provides the runtime credential that backs an A2A AgentCard's security claims.

Reference: [A2A roadmap — "Formalize inclusion of authorization schemes and optional credentials directly within the AgentCard"](https://github.com/a2aproject/A2A)

### OAuth 2.1

ACF tokens are OAuth 2.1-compatible JWTs with additional claims. The `scopes` claim follows OAuth 2.0 scope convention. Issuers may use OAuth 2.1 client credentials flow to issue ACF tokens.

### OpenID Connect

The `delegation.human_principal` claim is inspired by OpenID's ongoing work on delegation tokens (October 2025 white paper). ACF is designed to be compatible with future OIDC delegation standards.

---

## Open Questions

These are known gaps that community input will help resolve:

1. **Scope format** — should we define a required namespace (e.g. `resource:action`) or leave it free-form?
2. **Multi-tenant orgs** — should `org` support sub-organizations (e.g. `acme_corp/team_finance`)?
3. **Token binding** — should ACF support DPoP (RFC 9449) for request binding?
4. **Capability vs permission** — should we distinguish between what an agent *can* do (capabilities) and what it's *permitted* to do (scopes)?
5. **Standardized scope vocabulary** — should there be a registry of common scopes (e.g. `read:crm`, `write:email`) or is this left to each API?

→ [Discuss in GitHub Discussions](../../discussions/categories/spec)

---

## Changelog

- **v0.1** (March 2026): Initial draft. Open for community feedback.

---

## References

1. RFC 7519 — JSON Web Token (JWT)
2. RFC 8037 — CFRG Elliptic Curves for JOSE (EdDSA)
3. RFC 9449 — OAuth 2.0 Demonstrating Proof of Possession (DPoP)
4. MCP Roadmap (March 5 2026) — modelcontextprotocol.io/development/roadmap
5. A2A Protocol — github.com/a2aproject/A2A
6. CSA "Identity and Access Gaps in the Age of Autonomous AI" (March 2026)
7. CSA "Securing Autonomous AI Agents" (February 2026)
8. CSA "State of Non-Human Identity and AI Security" (January 2026)
9. Autodesk MCP enterprise security contribution (February 2026) — adsknews.autodesk.com
10. Stack Overflow Blog: MCP Authentication (January 2026)
