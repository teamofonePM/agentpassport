# Contributing to AgentPassport

We're building in public and want your input — especially if you've deployed agents in production and hit problems this spec should solve.

## Ways to contribute

### 1. Share an incident or pain point (most valuable right now)

If you've had an agent do something unexpected, caused a production incident, or found yourself wanting capabilities this spec doesn't define — open an issue with the `incident-report` label or post in [GitHub Discussions](../../discussions/categories/incidents).

You don't need to propose a solution. The incident itself is the contribution. We'll use real incidents to shape the spec.

### 2. Review the spec

Read [docs/SPEC.md](docs/SPEC.md) and open issues or PRs for:
- Fields that are missing
- Fields that are wrong or ambiguous  
- Edge cases that aren't handled
- Compatibility issues with MCP, A2A, OAuth 2.1, or your framework

### 3. Build an integration

Framework integrations are how this becomes real:

- LangChain middleware
- CrewAI agent wrapper
- LlamaIndex integration  
- Express/Fastify middleware
- FastAPI middleware
- Any MCP server integration

See `examples/` for starting points.

### 4. Propose a change to the spec

Open a GitHub Discussion in the `Spec Proposals` category before opening a PR for spec changes. We want discussion before code.

Spec PRs should include:
- Motivation (ideally a real incident or use case)
- The proposed change
- Any backward compatibility notes
- References to related standards if relevant

## Ground rules

- Be specific. "This is missing something" is less useful than "when an agent spawns a sub-agent, X field should be required because Y incident could happen."
- Cite real incidents when you can. The spec is only as good as the real-world problems it solves.
- Be kind. This is a small project with big ambitions. Encouragement and constructive critique both welcome.

## Development setup

```bash
git clone https://github.com/agentpassport/agentpassport
cd agentpassport
npm install
npm test
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
