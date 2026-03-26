# AgentPassport

**The open credential standard for autonomous AI agents.**

Identity, permissions, and audit — in a single signed token every agent carries and every API can verify in under 1ms.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Spec Version](https://img.shields.io/badge/spec-v0.1--draft-blue)](docs/SPEC.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Discord](https://img.shields.io/badge/Discord-join-7289DA)](https://discord.gg/agentpassport)

---

## Why this exists

Agents are in production. Not in demos — in real systems, calling real APIs, taking real actions.

And right now, nobody on the receiving end of those requests knows who sent them.

**The data is unambiguous:**

- **68%** of organizations cannot clearly distinguish AI agent activity from human activity — even as 85% run agents in production environments. *(CSA / Aembit, March 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/03/24/more-than-two-thirds-of-organizations-cannot-clearly-distinguish-ai-agent-from-human-actions))*
- **84%** of organizations doubt they could pass a compliance audit focused on agent behavior. *(CSA / Strata Identity, February 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/02/05/cloud-security-alliance-strata-survey-finds-that-enterprises-are-in-time-to-trust-phase-as-they-build-ai-autonomy-foundations))*
- **78%** of organizations lack any policy for creating or removing AI identities. *(CSA / Oasis Security, January 2026 — [source](https://cloudsecurityalliance.org/press-releases/2026/01/27/79-of-it-pros-feel-ill-equipped-to-prevent-attacks-via-nhi-csa-oasis-survey-finds))*
- Only **18%** of security leaders are highly confident their IAM systems can handle agent identities. *(CSA / Strata, 285 respondents)*
- MCP's own 2026 roadmap lists **"audit trails, enterprise-managed auth, and delegation chains"** as explicitly unspecified. *(MCP Roadmap, updated March 5 2026 — [source](https://modelcontextprotocol.io/development/roadmap))*
- A2A's roadmap explicitly calls for **"authorization schemes and optional credentials within the AgentCard"** as future work. *(A2A GitHub — [source](https://github.com/a2aproject/A2A))*

We are in the same position the web was in 1994. Transactions existed. Trust did not. The answer then was a certificate authority layer — not better transactions.

**AgentPassport is that layer for agents.**

---

## What it is

A signed JWT — the **Agent Credential Format (ACF)** — that travels with every agent request. It carries:

| Field | What it solves |
|---|---|
| `org` + `org.domain` | Who owns this agent (domain-verified) |
| `agentId` | Which specific agent sent this request |
| `scopes` | What it's allowed to do |
| `rules` | What it's explicitly blocked from doing |
| `delegationChain` | Who spawned it (multi-agent tracing) |
| `humanPrincipal` | Which human authorized it (EU AI Act) |
| `revocationId` | Kill switch — revoke in <500ms |

Verified offline. No network round trip. Verifies in under 1ms via EdDSA.

---

## Quickstart

```bash
npm install agentpassport
```

**Issue a passport (agent deployer):**

```typescript
import { AgentPassport } from 'agentpassport'

const ap = new AgentPassport({
  orgId: 'acme_corp',
  signingKey: process.env.AP_PRIVATE_KEY
})

const { token } = await ap.issue({
  agentId: 'research-agent-01',
  scopes: ['read:crm', 'read:reports'],
  rules: {
    blockActions: ['send:email', 'write:db'],
    maxSpend: 50
  },
  ttl: '1h'
})

// Attach to every outgoing request
headers['x-agent-passport'] = token
```

**Verify a passport (API provider):**

```typescript
import { verify } from 'agentpassport'

async function agentAuth(req, res, next) {
  const passport = await verify(req.headers['x-agent-passport'])

  // passport.org        → 'acme_corp'   (domain-verified)
  // passport.agentId    → 'research-agent-01'
  // passport.scopes     → ['read:crm', 'read:reports']
  // passport.rules      → { blockActions: ['send:email'] }

  if (!passport.scopes.includes(requiredScope)) {
    return res.status(403).json({ error: 'Scope not granted' })
  }

  req.agent = passport
  next()
}
```

**Revoke instantly:**

```typescript
import { RulesClient } from 'agentpassport'

const rules = new RulesClient(process.env.AP_KEY)

// Kill one agent
await rules.revoke('research-agent-01')

// Block an action across ALL org agents
await rules.block({ action: 'send:external-email' })

// Propagates in < 500ms. No redeploy.
```

---

## The spec

The **Agent Credential Format (ACF)** is an open standard. We're proposing it publicly and inviting the community to help shape it.

→ [Read the full spec](docs/SPEC.md)
→ [Discuss on GitHub Discussions](../../discussions)
→ [Open an issue or PR](CONTRIBUTING.md)

---

## Packages

| Package | Description |
|---|---|
| [`agentpassport`](packages/core) | Core — issue, verify, revoke |
| [`agentpassport-verify`](packages/verify) | Lightweight verify-only (zero deps) |

---

## Compatibility

AgentPassport is designed to complement, not replace, existing standards:

- **MCP (Model Context Protocol)** — fills the identity and audit gaps MCP explicitly leaves open in its 2026 roadmap
- **A2A (Agent2Agent)** — provides the runtime credential that A2A's AgentCard describes but doesn't enforce
- **OAuth 2.1** — built on top of, not instead of; ACF tokens are OAuth 2.1-compatible

---

## Contributing

This project is in active early development. We especially want:

- **Incident reports** — real-world agent incidents that should inform the spec
- **Framework integrations** — LangChain, CrewAI, LlamaIndex, AutoGen middleware
- **Spec feedback** — fields missing, fields wrong, edge cases we haven't considered

See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## Community

- [GitHub Discussions](../../discussions) — spec proposals, questions, design decisions
- [Discord](https://discord.gg/agentpassport) — real-time chat
- [Spec mailing list](https://agentpassport.dev/spec-list) — low-traffic, spec-only updates

---

## License

MIT. See [LICENSE](LICENSE).

---

*Building in public. Spec v0.1 draft. Not production-ready — yet.*
