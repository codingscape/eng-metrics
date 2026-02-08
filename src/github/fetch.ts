import { GitHubClient } from './client.js';
import { PullRequest, Review, Commit } from './types.js';

export async function listOrgRepos(gh: GitHubClient, org: string): Promise<string[]> {
  // Note: paginate to 1000 repos max (good enough for v1; can extend later)
  const repos: { name: string }[] = gh.apiJson(`/orgs/${org}/repos?per_page=100&type=all`);
  return repos.map((r) => r.name);
}

export async function searchPullRequests(
  gh: GitHubClient,
  org: string,
  startIso: string,
  endIso: string,
): Promise<PullRequest[]> {
  // Use GitHub Search API via gh. We query org-wide PRs updated in range.
  // We'll post-filter by created/merged/closed/opened as needed.
  const q = `org:${org} is:pr updated:${startIso}..${endIso}`;
  const results: { items: PullRequest[] } = gh.apiJson(`/search/issues?q=${encodeURIComponent(q)}&per_page=100`);

  // Search API returns issues fields; gh normalizes to PR-ish fields for items; still, we need full PR objects.
  // For v1 we follow up per PR with the repo+number from the URL.
  const prs: PullRequest[] = [];
  for (const item of results.items) {
    // item.html_url: https://github.com/{org}/{repo}/pull/{number}
    const m = item.html_url.match(/github\.com\/(.+?)\/(.+?)\/pull\/(\d+)/);
    if (!m) continue;
    const owner = m[1];
    const repo = m[2];
    const num = Number(m[3]);
    const pr = gh.apiJson<PullRequest>(`/repos/${owner}/${repo}/pulls/${num}`);
    prs.push(pr);
  }
  return prs;
}

export async function listReviews(gh: GitHubClient, fullRepo: string, prNumber: number): Promise<Review[]> {
  return gh.apiJson<Review[]>(`/repos/${fullRepo}/pulls/${prNumber}/reviews?per_page=100`);
}

export async function listCommits(gh: GitHubClient, fullRepo: string, prNumber: number): Promise<Commit[]> {
  return gh.apiJson<Commit[]>(`/repos/${fullRepo}/pulls/${prNumber}/commits?per_page=250`);
}
