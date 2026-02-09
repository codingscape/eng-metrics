import { parseFirstJson } from './api.js';
export async function searchRepositories(mcp, query, opts = {}) {
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
    }));
    return parseFirstJson(res);
}
export async function listOrgRepositories(mcp, org) {
    // Search API is capped; for onboarding selection this is acceptable.
    // We default to most recently updated repos.
    const q = `org:${org} archived:false`;
    const { items } = await searchRepositories(mcp, q, { perPage: 100, page: 1, sort: 'updated', order: 'desc' });
    return (items ?? []).map((r) => r.name).filter(Boolean);
}
