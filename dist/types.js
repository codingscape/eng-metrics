import { z } from 'zod';
export const AuthSchema = z.object({
    mode: z.enum(['gh', 'token']),
    tokenEnv: z.string().default('GITHUB_TOKEN'),
});
export const ClientConfigSchema = z.object({
    client: z.string(),
    github: z.object({
        org: z.string().optional(),
        auth: AuthSchema,
    }),
});
