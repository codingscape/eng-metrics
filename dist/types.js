import { z } from 'zod';
export const AuthSchema = z.object({
    mode: z.enum(['gh', 'token']),
    tokenEnv: z.string().default('GITHUB_TOKEN'),
});
export const ClientConfigSchema = z.object({
    client: z.string(),
    github: z.object({
        org: z.string().optional(),
        repos: z
            .object({
            mode: z.enum(['all', 'allowlist']),
            allowlist: z.array(z.string()).default([]),
        })
            .default({ mode: 'all', allowlist: [] }),
        auth: AuthSchema,
        people: z
            .object({
            // Optional override map: login -> display name
            displayNameByLogin: z.record(z.string(), z.string()).default({}),
        })
            .default({ displayNameByLogin: {} }),
    }),
});
