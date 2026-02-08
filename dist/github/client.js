import { execFileSync } from 'node:child_process';
export class GitHubClient {
    cfg;
    constructor(cfg) {
        this.cfg = cfg;
    }
    authArgs() {
        const auth = this.cfg.github.auth;
        if (auth.mode === 'gh') {
            return [];
        }
        const token = process.env[auth.tokenEnv];
        if (!token)
            throw new Error(`Missing token env var: ${auth.tokenEnv}`);
        return ['-H', `Authorization: Bearer ${token}`];
    }
    api(pathOrUrl, options = {}) {
        const args = ['api'];
        if (options.method)
            args.push('-X', options.method);
        if (options.headers) {
            for (const [k, v] of Object.entries(options.headers)) {
                args.push('-H', `${k}: ${v}`);
            }
        }
        args.push(...this.authArgs());
        args.push(pathOrUrl);
        if (options.jq)
            args.push('--jq', options.jq);
        const out = execFileSync('gh', args, { encoding: 'utf-8' });
        return out;
    }
    apiJson(pathOrUrl, options = {}) {
        const out = this.api(pathOrUrl, options);
        return JSON.parse(out);
    }
}
