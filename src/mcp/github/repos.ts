import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpToolResult, parseFirstJson } from './api.js';

export type RepoMinimal = {
  name: string;
  full_name?: string;
  private?: boolean;
  archived?: boolean;
  fork?: boolean;
};

export async function searchRepositories(
  mcp: Client,
  query: string,
  opts: { perPage?: number; page?: number; sort?: 'updated' | 'stars' | 'forks'; order?: 'asc' | 'desc' } = {},
): Promise<{ items: RepoMinimal[] }> {
  const res = (await mcp.callTool({
    name: 'search_repositories',
    arguments: {
      query,
      minimal_output: true,
      perPage: opts.perPage ?? 100,
      page: opts.page ?? 1,
      sort: opts.sort ?? 'updated',
      order: opts.order ?? 'desc',
    },
  })) as McpToolResult;

  return parseFirstJson<any>(res);
}

export async function listOrgRepositories(mcp: Client, org: string): Promise<string[]> {
  // Search API is capped; for onboarding selection this is acceptable.
  // We default to most recently updated repos.
  const q = `org:${org} archived:false`; 
  const { items } = await searchRepositories(mcp, q, { perPage: 100, page: 1, sort: 'updated', order: 'desc' });
  return (items ?? []).map((r) => r.name).filter(Boolean);
}

export async function listUserRepositories(mcp: Client, username: string): Promise<string[]> {
  // Search for repos owned by the user (includes both user repos and org repos they own)
  const q = `user:${username} archived:false`; 
  const { items } = await searchRepositories(mcp, q, { perPage: 100, page: 1, sort: 'updated', order: 'desc' });
  // Return full names (owner/repo) for repos without org
  return (items ?? []).map((r) => r.full_name || `${username}/${r.name}`).filter(Boolean);
}
