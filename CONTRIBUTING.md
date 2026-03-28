# Contributing to ACF

ACF (Agent Credential Format) is an open spec. The goal is to define a standard that the community builds on — not a product any single company owns.

## What we need right now

### 1. Incident reports (most valuable)

If you've deployed agents in production and something went wrong — or you found yourself wishing for capabilities this spec doesn't define — open an issue with the `incident-report` label.

You don't need to propose a solution. The incident itself is the contribution. We'll use real incidents to drive spec decisions.

### 2. Spec feedback

Read [docs/SPEC.md](docs/SPEC.md) and open issues or PRs for:

- Fields that are missing
- Fields that are wrong or ambiguous
- Edge cases not handled
- Compatibility issues with MCP, A2A, OAuth 2.1, or your framework

Open a [GitHub Discussion](../../discussions/categories/spec) before a PR for spec changes. We want conversation before code.

### 3. Framework integrations

The spec only matters if agents can actually carry it. Integrations needed:

- LangChain middleware
- CrewAI agent wrapper
- LlamaIndex integration
- AutoGen support
- Express / Fastify / Hono middleware
- FastAPI middleware
- Any MCP server integration

See `examples/` for starting points.

## Spec PR checklist

- [ ] Motivation: link to a real incident or use case
- [ ] Proposed change clearly described
- [ ] Backward compatibility notes
- [ ] References to related standards if applicable
- [ ] Discussion opened first

## Ground rules

- Be specific. "This is missing something" is less useful than "when agent A spawns agent B, X field should be required because Y incident could happen."
- Cite real incidents when possible. The spec is only as good as the real-world problems it solves.
- Be kind.

## Development

```bash
git clone https://github.com/teamofonePM/agentpassport
cd agentpassport
npm install
npm test
```

## License

By contributing, you agree your contributions will be licensed under MIT.

---

Questions? Open a [Discussion](../../discussions) or reach out to [Anmol Rattan](https://www.linkedin.com/in/theanmolrattan/) directly.
