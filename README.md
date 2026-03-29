# ACF — Agent Credential Format

**A proposed open standard for AI agent identity, permissions, and audit.**

> This is a community proposal. ACF is not a product or a company — it's a spec, like JWT or OAuth. Anyone can implement it, build on it, or help shape it.
>
> Proposed by [Anmol Rattan](https://www.linkedin.com/in/theanmolrattan/) · Open for community input · March 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Spec Version](https://img.shields.io/badge/spec-v0.1--draft-blue)](docs/SPEC.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Discussions](https://img.shields.io/badge/discussions-open-green)](../../discussions)

---

## The problem

Agents are in production everywhere — marketing automation, DevOps pipelines, data workflows, customer support. Every one of them calls APIs. And right now, those APIs have no standard way to know:

- **Who** sent this request (which org, which agent)
- **What** it's authorized to do
- **Whether** it acted within its intended scope
- **How** to stop it if it doesn't

Three recent surveys confirm this is systemic, not anecdotal:

- **68%** of organizations cannot distinguish AI agent activity from human activity — even as 85% run agents in production *(CSA / Aembit, March 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/03/24/more-than-two-thirds-of-organizations-cannot-clearly-distinguish-ai-agent-from-human-actions))*
- **84%** doubt they could pass a compliance audit on agent behavior *(CSA / Strata, February 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/02/05/cloud-security-alliance-strata-survey-finds-that-enterprises-are-in-time-to-trust-phase-as-they-build-ai-autonomy-foundations))*
- **78%** have no policy for creating or removing AI agent identities *(CSA / Oasis, January 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/01/27/79-of-it-pros-feel-ill-equipped-to-prevent-attacks-via-nhi-csa-oasis-survey-finds))*

MCP's 2026 roadmap explicitly lists **"audit trails, enterprise-managed auth, and delegation chains"** as unaddressed. A2A calls for **"authorization schemes within the AgentCard"** as future work.

There is a clear gap. ACF is a proposal to fill it — openly, with community input.

---

## What ACF proposes

A signed JWT — the **Agent Credential Format** — carried in the `x-acf-token` header on every agent request. Any API receiving the token can verify it offline in under 1ms.

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

Signed with EdDSA (Ed25519). No database lookup. No round trip. Verifiable in under 1ms.

---

## Reference implementation

A reference implementation is provided to demonstrate the spec — not as a production service, but as a working example for implementers.

**Issue a credential:**

```typescript
import { ACF } from 'acf-token'

const acf = new ACF({
  orgId:      'acme_corp',
  orgDomain:  'acme.com',
  signingKey: process.env.ACF_PRIVATE_KEY  // your key, stays with you
})

const { token } = await acf.issue({
  agentId: 'research-agent-01',
  scopes:  ['read:crm'],
  rules:   { blockActions: ['send:email'], maxSpendUsd: 50 },
  ttl:     '1h'
})

headers['x-acf-token'] = token
```

**Verify at an API:**

```typescript
import { verify } from 'acf-token'

const credential = await verify(req.headers['x-acf-token'])

// credential.org       -> 'acme_corp'  (domain-verified)
// credential.agentId   -> 'research-agent-01'
// credential.scopes    -> ['read:crm']
// credential.rules     -> { blockActions: ['send:email'] }

if (!credential.scopes.includes(requiredScope)) {
  return res.status(403).json({ error: 'Scope not granted' })
}
// offline · under 1ms · no round trip
```

---

## Relationship to existing standards

ACF does not replace anything. It fills documented gaps:

| Standard | Gap ACF addresses |
|---|---|
| **MCP** | Runtime identity, scoped permissions, delegation chains — all on MCP's own 2026 roadmap as unaddressed |
| **A2A** | Enforcement of AgentCard authentication claims at runtime |
| **OAuth 2.1** | Agent-specific claims: `rules`, `delegation`, `org` — ACF tokens are OAuth 2.1-compatible JWTs |

---

## Status

- [x] Initial spec draft — [`docs/SPEC.md`](docs/SPEC.md)
- [x] Reference implementation skeleton
- [x] Express middleware example
- [ ] Full reference implementation (contributions welcome)
- [ ] LangChain / CrewAI / LlamaIndex integrations (contributions welcome)
- [ ] MCP working group submission
- [ ] Community review round 1

---

## How to get involved

This spec only gets better with real-world input. Three ways to contribute:

**1. Share an incident** — if you've deployed agents and something went wrong, open an issue with the `incident-report` label. The incident itself is the contribution — no fix needed.

**2. Review the spec** — read [`docs/SPEC.md`](docs/SPEC.md) and open issues or discussions for missing fields, wrong assumptions, or edge cases.

**3. Build an integration** — LangChain, CrewAI, LlamaIndex, FastAPI, any MCP server. See `examples/` to start.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## For teams building with agents internally

If your team is already running agents in production — marketing automation, data pipelines, internal tools — ACF is designed to be dropped in without changing your architecture. The `x-acf-token` header is additive. Your agents keep working; you gain attribution, scope enforcement, and a kill switch.

[Open an issue](../../issues) or [start a discussion](../../discussions) if you want to talk through your use case.

---

## Proposed by

[Anmol Rattan](https://www.linkedin.com/in/theanmolrattan/) — PM, building with agents. This spec came out of real problems encountered deploying agents in production workflows. Sharing it publicly in the hope it becomes a useful standard.

Not affiliated with any vendor. Not a company. Just a proposal looking for collaborators.

---

## License

MIT. The spec and all reference code are free to use, implement, fork, and build on.
