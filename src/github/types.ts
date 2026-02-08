export type PullRequest = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  draft: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: { login: string };
  base: { repo: { name: string; full_name: string } };
};

export type Review = {
  id: number;
  user: { login: string };
  state: string;
  submitted_at: string | null;
};

export type Commit = {
  sha: string;
  commit: { author: { date: string } };
  author: { login: string } | null;
};
