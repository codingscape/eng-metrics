import fs from 'node:fs';
import path from 'node:path';
import { saveConfig, loadConfig } from '../config.js';
import { clientDir, ensureDir } from '../paths.js';
import { ClientConfigSchema } from '../types.js';
function normalizeAuth(mode) {
    const m = (mode ?? 'gh').toLowerCase();
    if (m !== 'gh' && m !== 'token')
        throw new Error(`Invalid auth mode: ${mode}. Use gh|token.`);
    return m;
}
export async function initClient(args) {
    const dir = clientDir(args.client);
    if (fs.existsSync(path.join(dir, 'client.json'))) {
        throw new Error(`Client already initialized: ${args.client}. Use reinit.`);
    }
    ensureDir(dir);
    ensureDir(path.join(dir, 'store'));
    const cfg = ClientConfigSchema.parse({
        client: args.client,
        github: {
            org: args.org,
            auth: {
                mode: normalizeAuth(args.auth),
                tokenEnv: args.tokenEnv ?? 'GITHUB_TOKEN',
            },
        },
    });
    saveConfig(cfg);
    console.log(`Initialized client: ${args.client}`);
    console.log(`Config: ${path.join(dir, 'client.json')}`);
    console.log(`Store:  ${path.join(dir, 'store')}`);
}
export async function reinitClient(args) {
    const existing = loadConfig(args.client);
    const cfg = ClientConfigSchema.parse({
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
    });
    saveConfig(cfg);
    console.log(`Updated client: ${args.client}`);
}
