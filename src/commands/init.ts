import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';
import { saveConfig, loadConfig } from '../config.js';
import { clientDir, ensureDir } from '../paths.js';
import { ClientConfigSchema } from '../types.js';
import { connectGithubMcp } from '../mcp/github/client.js';
import { listOrgRepositories } from '../mcp/github/repos.js';

type InitArgs = {
  client: string;
  org?: string;
  auth?: string;
  tokenEnv?: string;
  repos?: string; // all|select|csv
};

function normalizeAuth(mode?: string) {
  const m = (mode ?? 'gh').toLowerCase();
  if (m !== 'gh' && m !== 'token') throw new Error(`Invalid auth mode: ${mode}. Use gh|token.`);
  return m as 'gh' | 'token';
}

async function chooseReposIfPossible(cfg: any, preferred?: string) {
  const org = cfg.github.org as string | undefined;
  if (!org) return cfg;

  const pref = (preferred ?? '').toLowerCase();
  if (pref === 'all') {
    cfg.github.repos = { mode: 'all', allowlist: [] };
    return cfg;
  }

  // If we don't have gh auth configured yet, this may fail; we treat it as optional.
  try {
    const tokenEnv = cfg.github.auth.tokenEnv ?? 'GITHUB_PERSONAL_ACCESS_TOKEN';
    const token = process.env[tokenEnv];
    if (!token) throw new Error(`Missing GitHub token env var: ${tokenEnv}`);

    const mcp = await connectGithubMcp({
      readOnly: true,
      toolsets: 'default',
      env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: token } as Record<string, string>,
    });

    const repos = await listOrgRepositories(mcp as any, org);
    await mcp.close();

    const { repoMode } =
      pref === 'select'
        ? { repoMode: 'select' }
        : await prompts({
            type: 'select',
            name: 'repoMode',
            message: `Track which repos for org ${org}?`,
            choices: [
              { title: 'All repos', value: 'all' },
              { title: 'Select repos (recommended)', value: 'select' },
            ],
            initial: 1,
          });

    if (repoMode === 'all') {
      cfg.github.repos = { mode: 'all', allowlist: [] };
      return cfg;
    }

    const { selected } = await prompts({
      type: 'multiselect',
      name: 'selected',
      message: 'Select repos to include',
      choices: repos.map((r) => ({ title: r, value: r })),
      min: 1,
      hint: '- Space to select. Enter to confirm.',
    });

    cfg.github.repos = { mode: 'allowlist', allowlist: selected ?? [] };
    return cfg;
  } catch {
    // Leave default (all) and let user reinit later.
    return cfg;
  }
}

export async function initClient(args: InitArgs) {
  const dir = clientDir(args.client);
  if (fs.existsSync(path.join(dir, 'client.json'))) {
    throw new Error(`Client already initialized: ${args.client}. Use reinit.`);
  }

  ensureDir(dir);
  ensureDir(path.join(dir, 'store'));

  let cfg: any = {
    client: args.client,
    github: {
      org: args.org,
      repos: { mode: 'all', allowlist: [] },
      auth: {
        mode: normalizeAuth(args.auth),
        tokenEnv: args.tokenEnv ?? 'GITHUB_TOKEN',
      },
      people: { displayNameByLogin: {} },
    },
  };

  // If org is present, try to do repo selection (interactive when possible).
  cfg = await chooseReposIfPossible(cfg, args.repos);

  const parsed = ClientConfigSchema.parse(cfg);
  saveConfig(parsed);

  console.log(`Initialized client: ${args.client}`);
  console.log(`Config: ${path.join(dir, 'client.json')}`);
  console.log(`Store:  ${path.join(dir, 'store')}`);
}

export async function reinitClient(args: InitArgs) {
  const existing = loadConfig(args.client);

  let cfg: any = {
    ...existing,
    github: {
      ...existing.github,
      org: args.org ?? existing.github.org,
      auth: {
        ...existing.github.auth,
        mode: args.auth ? normalizeAuth(args.auth) : existing.github.auth.mode,
        tokenEnv: args.tokenEnv ?? existing.github.auth.tokenEnv,
      },
    },
  };

  // If requested, allow re-selecting repos.
  if (args.repos) {
    cfg = await chooseReposIfPossible(cfg, args.repos);
  }

  const parsed = ClientConfigSchema.parse(cfg);
  saveConfig(parsed);
  console.log(`Updated client: ${args.client}`);
}
