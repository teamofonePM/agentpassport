# Agent Credential Format (ACF) — Specification v0.1 (Draft)

**Status:** Draft — open for community feedback
**Last updated:** March 2026
**Author:** [Anmol Rattan](https://www.linkedin.com/in/theanmolrattan/)
**Discuss:** [GitHub Discussions](../../discussions/categories/spec)

---

## Abstract

The Agent Credential Format (ACF) defines a standard for representing the identity, permissions, and delegation chain of an autonomous AI agent. An ACF token is a signed JWT that an agent carries on every request. Any receiving party verifies it offline in under 1ms — no round trip, no shared secret, no issuer contact required.

This specification defines **what a credential contains** and **how it is verified**. It does not define agent behavior, orchestration, or deployment — those are left to implementers.

---

## Motivation

### The problem

AI agents are operating in production at scale. Unlike human users, agents:

1. Have no standard way to identify themselves to the APIs they call
2. Cannot carry verifiable proof of what they are authorized to do
3. Leave no standard audit trail of their actions
4. Cannot be reliably revoked if they behave unexpectedly

**The data:**

- **68%** of organizations cannot distinguish AI agent activity from human activity — even as 85% run agents in production *(Cloud Security Alliance / Aembit, "Identity and Access Gaps in the Age of Autonomous AI", March 2026, n=228)*
- **84%** doubt they could pass a compliance audit focused on agent behavior *(CSA / Strata Identity, "Securing Autonomous AI Agents", February 2026, n=285)*
- **78%** have no policy for creating or removing AI agent identities *(CSA / Oasis Security, "State of Non-Human Identity and AI Security", January 2026)*
- MCP's own 2026 roadmap explicitly lists audit trails, enterprise-managed auth, and delegation chains as **"gaps the protocol does not yet address"** *(MCP Roadmap, March 5 2026, modelcontextprotocol.io/development/roadmap)*

### What already exists (and where it stops)

| Standard | Defines | Does not define |
|---|---|---|
| MCP (Anthropic / Linux Foundation) | Agent-to-tool communication | Runtime agent identity, scoped permissions, delegation |
| A2A (Google / Linux Foundation) | Agent-to-agent communication | Enforcement of declared auth, audit trail |
| OAuth 2.1 | Human and service authorization | Agent-specific claims, delegation chain, rules |
| OIDC | Human identity assertion | Non-human principal types |

ACF complements these standards. It is not a replacement. An ACF token is an OAuth 2.1-compatible JWT with additional agent-specific claims.

---

## Token Structure

An ACF token is a **JWT** (RFC 7519) signed using **EdDSA** (Ed25519, RFC 8037).

### Header

```json
{
  "alg": "EdDSA",
  "typ": "ACF+JWT",
  "kid": "key-identifier"
}
```

### Payload

```json
{
  "iss": "https://acme.com/.well-known/acf.json",
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
    "data_classifications": ["internal"]
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
| `iss` | URI | Issuer URL — must point to the org's `/.well-known/acf.json` |
| `sub` | string | Subject — format: `agent:{org}:{agent_id}` |
| `iat` | unix ts | Issued at |
| `exp` | unix ts | Expiry. Maximum TTL is 24 hours. Default recommended: 1 hour. |

### Identity claims (required)

| Claim | Type | Description |
|---|---|---|
| `org` | string | Org identifier. Matched against issuer registration. Case-insensitive. |
| `org_domain` | string | Domain verified at registration (e.g. `acme.com`). Verifiers may confirm via DNS. |
| `agent_id` | string | Unique identifier for this agent within the org. Stable across token refreshes. |

### Permission claims (required)

| Claim | Type | Description |
|---|---|---|
| `scopes` | string[] | Permitted actions. Follows OAuth 2.0 scope naming (`resource:action`). Verifiers MUST reject requests for scopes not listed. |

### Rules claims (optional, recommended)

| Claim | Type | Description |
|---|---|---|
| `rules.block_actions` | string[] | Actions explicitly blocked. Takes precedence over `scopes`. |
| `rules.max_spend_usd` | number | Max spend this agent may incur per run in USD. |
| `rules.max_calls_per_run` | number | Max API calls before the credential is considered exhausted. |
| `rules.data_classifications` | string[] | Data classifications this agent may access. |

### Delegation claims (optional)

| Claim | Type | Description |
|---|---|---|
| `delegation.human_principal` | string | Human or service that authorized this agent. Format: `user:{email}` or `service:{id}`. Required for EU AI Act traceability. |
| `delegation.parent_agent_id` | string or null | Parent agent's `agent_id` if this agent was spawned by another agent. |
| `delegation.chain` | string[] | Ordered list of `agent_id` values from root to immediate parent. |
| `delegation.max_depth` | number | Max further delegation depth. 0 means this agent cannot spawn sub-agents. Default: 3. |

### Revocation (optional)

| Claim | Type | Description |
|---|---|---|
| `revocation_id` | string | Opaque ID checked against the issuer's revocation endpoint. If absent, revocation is TTL-only. |

### Metadata (required)

| Claim | Type | Description |
|---|---|---|
| `acf_version` | string | Spec version this token conforms to. Currently `"0.1"`. |

---

## Issuer Discovery

An org issuing ACF tokens MUST publish a discovery document at:

```
https://{org_domain}/.well-known/acf.json
```

Minimum required fields:

```json
{
  "issuer": "https://acme.com",
  "jwks_uri": "https://acme.com/.well-known/jwks.json",
  "acf_version": "0.1",
  "revocation_endpoint": "https://api.acme.com/acf/revoke/{revocation_id}"
}
```

---

## Verification Algorithm

A conformant verifier MUST:

1. Decode the JWT header and payload without verification
2. Check `acf_version` is a supported version
3. Retrieve the issuer's public key from `jwks_uri` (cached — MUST NOT fetch on every request)
4. Verify the EdDSA signature
5. Verify `exp` > current time
6. Verify `iss` matches a trusted issuer per verifier policy
7. If `revocation_id` is present and not seen in the current session, check the revocation endpoint

A token failing any check MUST be rejected.

Offline verification (steps 1–6) SHOULD complete in under 1ms.

---

## Scope Enforcement

- Requests for actions not listed in `scopes` MUST be rejected with HTTP 403
- `rules.block_actions` takes precedence over `scopes` — if an action appears in both, it is blocked
- Verifiers SHOULD log blocked actions for audit purposes

---

## Delegation Chain Validation

When `delegation.parent_agent_id` is present:

- `delegation.chain` MUST NOT exceed `delegation.max_depth` in length
- Sub-agents MUST NOT be issued scopes that exceed their parent's scopes — the issuer MUST enforce this at issuance time
- Verifiers MAY require that the parent credential also be presented

---

## Security Considerations

**Short TTLs.** Default 1 hour, maximum 24 hours. Short TTLs limit blast radius of a compromised token.

**Key rotation.** Rotate signing keys regularly. The `kid` header allows caching multiple public keys simultaneously.

**Revocation latency.** Revocation via `revocation_id` has propagation delay. For high-security operations, use short TTLs instead of or in addition to revocation.

**Delegation chain forgery.** A compromised agent may attempt to falsify `delegation.chain` or `human_principal`. These fields are covered by the EdDSA signature — verifiers MUST verify the signature covers delegation claims.

---

## Relationship to Existing Standards

### MCP (Model Context Protocol)

MCP's 2026 roadmap explicitly lists as unaddressed: audit trails and observability, enterprise-managed auth, and delegation chains. An ACF token travels as a custom header on any MCP request without modifying the MCP protocol.

Source: [modelcontextprotocol.io/development/roadmap](https://modelcontextprotocol.io/development/roadmap) (March 5 2026)

### A2A (Agent2Agent Protocol)

A2A's AgentCard defines agent capabilities and authentication requirements but does not define runtime permission enforcement or delegation chain verification. ACF provides the runtime credential that backs an A2A AgentCard's security claims.

Source: [github.com/a2aproject/A2A](https://github.com/a2aproject/A2A) — roadmap item: "Formalize authorization schemes within the AgentCard"

### OAuth 2.1

ACF tokens are OAuth 2.1-compatible JWTs. The `scopes` claim follows OAuth 2.0 scope convention. Issuers may use the client credentials flow to mint ACF tokens.

---

## Open Questions

These are known gaps for community input:

1. **Scope vocabulary** — should ACF define a registry of standard scope names (e.g. `read:crm`, `write:email`) or leave naming to each API?
2. **Multi-tenant orgs** — should `org` support sub-org namespacing (e.g. `acme_corp/team_finance`)?
3. **Token binding** — should ACF support DPoP (RFC 9449) to bind tokens to specific requests?
4. **Capability vs permission** — should the spec distinguish what an agent *can* do from what it is *permitted* to do?

[Join the discussion](../../discussions/categories/spec)

---

## Changelog

- **v0.1** (March 2026) — Initial draft. Open for community feedback.

---

## References

1. RFC 7519 — JSON Web Token (JWT)
2. RFC 8037 — CFRG Elliptic Curves for JOSE (EdDSA / Ed25519)
3. RFC 9449 — OAuth 2.0 Demonstrating Proof of Possession (DPoP)
4. MCP Roadmap (March 5 2026) — modelcontextprotocol.io/development/roadmap
5. A2A Protocol — github.com/a2aproject/A2A
6. CSA / Aembit — "Identity and Access Gaps in the Age of Autonomous AI" (March 2026)
7. CSA / Strata — "Securing Autonomous AI Agents" (February 2026)
8. CSA / Oasis — "State of Non-Human Identity and AI Security" (January 2026)
