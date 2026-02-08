import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadConfig } from '../config.js';
import { ensureDir } from '../paths.js';
import { GitHubClient } from '../github/client.js';
import { searchPullRequests, listReviews, listCommits, getUserProfile } from '../github/fetch.js';
import { openDb } from '../store/db.js';
import { computeWeeklyMetrics } from '../report/metrics.js';
import { renderMarkdown } from '../report/render.js';
function isoNow() {
    return new Date().toISOString();
}
function subtractDays(endIso, days) {
    const end = new Date(endIso);
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return start.toISOString();
}
export async function runReport(args) {
    const cfg = loadConfig(args.client);
    const org = cfg.github.org;
    if (!org)
        throw new Error(`Missing github.org in client config. Run: eng-metrics reinit --client ${args.client} --org <org>`);
    const endIso = args.endIso ?? isoNow();
    const startIso = subtractDays(endIso, args.days);
    const outDir = args.outDir ?? path.join('artifacts', args.client, endIso.slice(0, 10));
    ensureDir(outDir);
    const runId = crypto.randomUUID();
    const gh = new GitHubClient(cfg);
    console.log(`[${args.client}] Fetching PRs for org=${org} window=${startIso}..${endIso}`);
    const prsAll = await searchPullRequests(gh, org, startIso, endIso);
    const prs = cfg.github.repos.mode === 'allowlist'
        ? prsAll.filter((pr) => cfg.github.repos.allowlist.includes(pr.base.repo.name))
        : prsAll;
    console.log(`[${args.client}] Enriching ${prs.length} PRs (reviews + commits)`);
    const enriched = [];
    for (const pr of prs) {
        const full = pr.base.repo.full_name;
        const reviews = await listReviews(gh, full, pr.number);
        const commits = await listCommits(gh, full, pr.number);
        enriched.push({ pr, reviews, commits });
    }
    // Persist PRs (so we can do month/quarter later)
    const db = openDb(args.client);
    const insert = db.prepare(`
    INSERT INTO prs (client, repo_full_name, pr_number, pr_json, created_at, updated_at, closed_at, merged_at, author_login)
    VALUES (@client, @repo_full_name, @pr_number, @pr_json, @created_at, @updated_at, @closed_at, @merged_at, @author_login)
    ON CONFLICT(client, repo_full_name, pr_number) DO UPDATE SET
      pr_json=excluded.pr_json,
      updated_at=excluded.updated_at,
      closed_at=excluded.closed_at,
      merged_at=excluded.merged_at,
      author_login=excluded.author_login
  `);
    const tx = db.transaction(() => {
        for (const it of enriched) {
            const pr = it.pr;
            insert.run({
                client: args.client,
                repo_full_name: pr.base.repo.full_name,
                pr_number: pr.number,
                pr_json: JSON.stringify(it),
                created_at: pr.created_at,
                updated_at: pr.updated_at,
                closed_at: pr.closed_at,
                merged_at: pr.merged_at,
                author_login: pr.user?.login ?? null,
            });
        }
    });
    tx();
    const metrics = computeWeeklyMetrics(enriched, { start: startIso, end: endIso, days: args.days });
    // Display names: prefer explicit config overrides, otherwise try GitHub profile name.
    const displayNameByLogin = { ...cfg.github.people.displayNameByLogin };
    const uniqueLogins = Array.from(new Set(Object.keys(metrics.byAuthor)));
    for (const login of uniqueLogins) {
        if (displayNameByLogin[login])
            continue;
        const profile = await getUserProfile(gh, login);
        if (profile?.name)
            displayNameByLogin[login] = profile.name;
    }
    const md = renderMarkdown(args.client, org, metrics, displayNameByLogin);
    const mdPath = path.join(outDir, 'weekly-metrics.md');
    const jsonPath = path.join(outDir, 'weekly-metrics.json');
    fs.writeFileSync(mdPath, md, 'utf-8');
    fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2) + '\n', 'utf-8');
    console.log(`[${args.client}] Wrote:`);
    console.log(`- ${mdPath}`);
    console.log(`- ${jsonPath}`);
}
