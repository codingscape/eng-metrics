import path from 'node:path';
import fs from 'node:fs';

export const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

export function clientsDir() {
  return path.join(repoRoot, 'clients');
}

export function clientDir(client: string) {
  return path.join(clientsDir(), client);
}

export function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}
