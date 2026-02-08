import { execFileSync } from 'node:child_process';
import { ClientConfig } from '../types.js';

type GhOptions = {
  method?: string;
  headers?: Record<string, string>;
  jq?: string;
};

export class GitHubClient {
  constructor(private cfg: ClientConfig) {}

  private authArgs() {
    const auth = this.cfg.github.auth;
    if (auth.mode === 'gh') {
      return [];
    }
    const token = process.env[auth.tokenEnv];
    if (!token) throw new Error(`Missing token env var: ${auth.tokenEnv}`);
    return ['-H', `Authorization: Bearer ${token}`];
  }

  api(pathOrUrl: string, options: GhOptions = {}) {
    const args: string[] = ['api'];
    if (options.method) args.push('-X', options.method);
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        args.push('-H', `${k}: ${v}`);
      }
    }
    args.push(...this.authArgs());
    args.push(pathOrUrl);
    if (options.jq) args.push('--jq', options.jq);

    const out = execFileSync('gh', args, { encoding: 'utf-8' });
    return out;
  }

  apiJson<T>(pathOrUrl: string, options: GhOptions = {}): T {
    const out = this.api(pathOrUrl, options);
    return JSON.parse(out) as T;
  }
}
