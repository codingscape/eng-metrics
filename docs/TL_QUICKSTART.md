# TL Quickstart: eng-metrics (GitHub-only, MCP-backed, read-only)

This tool is designed for a Team Lead (TL) to run locally for a specific client engagement, generate a weekly metrics report for the last 7 days, and share the output artifacts.

## What you get

- A Markdown report: `weekly-metrics.md`
- A JSON export: `weekly-metrics.json`

Both are written under `artifacts/<client>/<YYYY-MM-DD>/`.

## Prereqs

1) Node.js 20+ (or newer)
2) A GitHub Personal Access Token (PAT) with read access to the org/repos you want to report on
3) Install GitHub’s official MCP server

### Install GitHub MCP server

macOS (Homebrew):

```bash
brew install github-mcp-server
```

Verify:

```bash
github-mcp-server --version
```

## Install eng-metrics

Clone:

```bash
git clone https://github.com/gdiab/eng-metrics.git
cd eng-metrics
```

Install deps + build:

```bash
npm install
npm run build
```

## Set your GitHub token

Export a token for this run (recommended: keep it in your shell profile or a password manager):

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="<your_pat>"
```

Notes:
- eng-metrics runs the MCP server in **read-only** mode.
- The token never leaves your machine; it is used only to query GitHub.

## Onboard a client engagement

Choose a short slug for the client/engagement (kebab-case recommended), and your GitHub org.

### Option A: select repos interactively (recommended)

```bash
node dist/cli.js init \
  --client acme \
  --org acme-corp \
  --auth token \
  --token-env GITHUB_PERSONAL_ACCESS_TOKEN \
  --repos select
```

### Option B: include all repos

```bash
node dist/cli.js init \
  --client acme \
  --org acme-corp \
  --auth token \
  --token-env GITHUB_PERSONAL_ACCESS_TOKEN \
  --repos all
```

If you need to rerun onboarding:

```bash
node dist/cli.js reinit --client acme --repos select
```

Client configs are created under:

- `clients/<client>/client.json`

## Run a weekly report

Generate a report for the last 7 days:

```bash
node dist/cli.js run --client acme --days 7
```

You can also run it at any time; it always looks back from “now” unless you pass `--end <ISO>`.

## Share artifacts

Send these two files to George:

- `artifacts/<client>/<YYYY-MM-DD>/weekly-metrics.md`
- `artifacts/<client>/<YYYY-MM-DD>/weekly-metrics.json`

## Safety

- The GitHub MCP server is launched by eng-metrics with `--read-only`.
- No GitHub write operations are performed.

## Troubleshooting

- Missing token: ensure `GITHUB_PERSONAL_ACCESS_TOKEN` is exported in the same shell.
- Auth/scopes: ensure your PAT has enough permissions to read the repos you selected.
- Repo list seems incomplete: onboarding uses GitHub search to fetch the top ~100 recently-updated repos for selection.

