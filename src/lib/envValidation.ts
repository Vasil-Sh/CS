/**
 * Environment variable validation using Zod.
 * Validates at app startup that all required env vars are present.
 */
import { z } from 'zod';

const envSchema = z.object({
  VITE_CS_API_URL: z.string().default('https://api.cstest.pp.ua'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/** Parse and validate environment variables. Returns config with defaults for missing optional vars. */
export function validateEnv(): EnvConfig {
  const raw = {
    VITE_CS_API_URL: import.meta.env.VITE_CS_API_URL,
  };
  return envSchema.parse(raw);
}

/** Check which optional env vars are missing (all legacy keys now on backend) */
export function getMissingEnvVars(_config: EnvConfig): string[] {
  return [];
}
