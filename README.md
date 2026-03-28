# ACF — Agent Credential Format

**The open standard for AI agent identity, permissions, and audit.**

A signed JWT that every agent carries and every API can verify in under 1ms — offline, no round trip, no shared secret.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Spec Version](https://img.shields.io/badge/spec-v0.1--draft-blue)](docs/SPEC.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Built by [@theanmolrattan](https://www.linkedin.com/in/theanmolrattan/) · Building in public · March 2026

---

## What is ACF?

ACF is to agent identity what JWT is to human identity — a standard token format, not a vendor product.

Right now agents arrive at APIs as anonymous HTTP calls. Three independent surveys confirm the scale of this problem:

- **68%** of organizations cannot distinguish AI agent activity from human activity — even as 85% run agents in production *(CSA / Aembit, March 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/03/24/more-than-two-thirds-of-organizations-cannot-clearly-distinguish-ai-agent-from-human-actions))*
- **84%** doubt they could pass a compliance audit focused on agent behavior *(CSA / Strata, February 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/02/05/cloud-security-alliance-strata-survey-finds-that-enterprises-are-in-time-to-trust-phase-as-they-build-ai-autonomy-foundations))*
- **78%** have no policy for creating or removing AI agent identities *(CSA / Oasis, January 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/01/27/79-of-it-pros-feel-ill-equipped-to-prevent-attacks-via-nhi-csa-oasis-survey-finds))*

MCP's 2026 roadmap lists **"audit trails, enterprise-managed auth, and delegation chains"** as explicitly unaddressed. A2A calls for **"authorization schemes within the AgentCard"** as future work. ACF is the open format proposal that fills both gaps.

---

## The token

An ACF token is a signed JWT carried in the `x-acf-token` header:

```json
{
  "org": "acme_corp",
  "org_domain": "acme.com",
  "agent_id": "research-agent-01",
  "scopes": ["read:crm", "read:reports"],
  "rules": {
    "block_actions": ["send:email", "write:db"],
    "max_spend_usd": 50
  },
  "delegation": {
    "human_principal": "user:jane@acme.com",
    "chain": []
  },
  "revocation_id": "rev_01HXYZ",
  "exp": 1742644860,
  "acf_version": "0.1"
}
```

Signed with **EdDSA (Ed25519)**. Verified offline. No database lookup. Under 1ms.

---

## Quickstart

```bash
npm install acf-token
```

**Issue (agent deployer):**

```typescript
import { ACF } from 'acf-token'

const acf = new ACF({
  orgId: 'acme_corp',
  signingKey: process.env.ACF_PRIVATE_KEY
})

const { token } = await acf.issue({
  agentId: 'research-agent-01',
  scopes:  ['read:crm'],
  rules:   { blockActions: ['send:email'], maxSpendUsd: 50 },
  ttl:     '1h'
})

headers['x-acf-token'] = token
```

**Verify (API provider):**

```typescript
import { verify } from 'acf-token'

const credential = await verify(req.headers['x-acf-token'])

// credential.org        -> 'acme_corp'  (domain-verified)
// credential.agentId    -> 'research-agent-01'
// credential.scopes     -> ['read:crm']
// credential.rules      -> { blockActions: ['send:email'] }

if (!credential.scopes.includes(requiredScope)) {
  return res.status(403).json({ error: 'Scope not granted' })
}
```

**Revoke instantly:**

```typescript
import { RulesClient } from 'acf-token'

const rules = new RulesClient(process.env.ACF_KEY)

await rules.revoke('research-agent-01')     // kill one agent, <500ms
await rules.block({ action: 'send:email' }) // block across all org agents
```

---

## Why not just API keys?

|  | API keys | ACF tokens |
|---|---|---|
| Who is the agent? | Unknown | Org + agentId, domain-verified |
| What can it do? | Full credential scope | Explicit scopes + blocklist |
| Stop it instantly? | Rotate and redeploy | revoke() in under 500ms |
| Delegation chain? | None | Full parent to child tracing |
| Audit trail? | None | Every action attributable |
| Compliance export? | No | Yes |

---

## Spec

The full Agent Credential Format specification lives in [`docs/SPEC.md`](docs/SPEC.md).

Covers: token structure, all claim definitions, issuer discovery, verification algorithm, delegation chain validation, security considerations, and compatibility with MCP, A2A, and OAuth 2.1.

[Read the spec](docs/SPEC.md) — [Propose changes](../../discussions/categories/spec)

---

## Compatibility

ACF fills the gaps MCP and A2A leave open without touching either protocol:

| Standard | Leaves open | ACF fills |
|---|---|---|
| MCP | Runtime identity, delegation, audit | All three |
| A2A | Enforcement of AgentCard auth claims | Runtime credential |
| OAuth 2.1 | Agent-specific claim types | rules, delegation, org fields |

---

## Contributing

Two things wanted right now:

1. **Incident reports** — open an issue with `incident-report` label. The incident itself is the contribution, no fix needed.
2. **Spec feedback** — missing fields, wrong fields, edge cases. Open a Discussion before a PR.

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Built by

[Anmol Rattan](https://www.linkedin.com/in/theanmolrattan/) — building in public. Feedback, collaborators, and design partners welcome.

---

MIT License. Spec v0.1 draft — open for community input.
