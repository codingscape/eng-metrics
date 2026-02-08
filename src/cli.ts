#!/usr/bin/env node

import { Command } from 'commander';
import { initClient, reinitClient } from './commands/init.js';
import { runReport } from './commands/run.js';

const program = new Command();

program
  .name('eng-metrics')
  .description('Multi-client GitHub engineering metrics CLI')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new client engagement (creates a client config + local store)')
  .requiredOption('-c, --client <slug>', 'Client slug (e.g. acme)')
  .option('--org <org>', 'GitHub org (optional; can be set later)')
  .option('--auth <mode>', 'Auth mode: gh | token', 'gh')
  .option('--token-env <name>', 'If auth=token: environment variable name to read token from', 'GITHUB_TOKEN')
  .action(async (opts) => {
    await initClient({
      client: opts.client,
      org: opts.org,
      auth: opts.auth,
      tokenEnv: opts.tokenEnv,
    });
  });

program
  .command('reinit')
  .description('Re-run onboarding for an existing client (fix/change config)')
  .requiredOption('-c, --client <slug>', 'Client slug (e.g. acme)')
  .option('--org <org>', 'GitHub org')
  .option('--auth <mode>', 'Auth mode: gh | token')
  .option('--token-env <name>', 'If auth=token: environment variable name to read token from')
  .action(async (opts) => {
    await reinitClient({
      client: opts.client,
      org: opts.org,
      auth: opts.auth,
      tokenEnv: opts.tokenEnv,
    });
  });

program
  .command('run')
  .description('Generate a report (defaults to past 7 days)')
  .requiredOption('-c, --client <slug>', 'Client slug (e.g. acme)')
  .option('--days <n>', 'Lookback window in days', '7')
  .option('--end <iso>', 'End timestamp (ISO). Default: now')
  .option('--out <dir>', 'Output directory (default: artifacts/<client>/<YYYY-MM-DD>)')
  .action(async (opts) => {
    await runReport({
      client: opts.client,
      days: Number(opts.days),
      endIso: opts.end,
      outDir: opts.out,
    });
  });

await program.parseAsync(process.argv);
