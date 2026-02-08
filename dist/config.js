import fs from 'node:fs';
import path from 'node:path';
import { ClientConfigSchema } from './types.js';
import { clientDir, ensureDir } from './paths.js';
export function configPath(client) {
    return path.join(clientDir(client), 'client.json');
}
export function loadConfig(client) {
    const p = configPath(client);
    if (!fs.existsSync(p)) {
        throw new Error(`Client not initialized: ${client}. Run: eng-metrics init --client ${client}`);
    }
    const raw = fs.readFileSync(p, 'utf-8');
    const json = JSON.parse(raw);
    return ClientConfigSchema.parse(json);
}
export function saveConfig(cfg) {
    ensureDir(clientDir(cfg.client));
    fs.writeFileSync(configPath(cfg.client), JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
}
