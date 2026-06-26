/**
 * Environment variable validation using Zod.
 * Validates at app startup that all required env vars are present.
 */
import { z } from 'zod';

const envSchema = z.object({
  VITE_DEEPSEEK_API_KEY: z.string().optional().default(''),
  VITE_GOOGLE_SHEETS_API_KEY: z.string().optional().default(''),
  VITE_TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  VITE_SUPABASE_URL: z.string().optional().default(''),
  VITE_SUPABASE_ANON_KEY: z.string().optional().default(''),
  VITE_CS_API_URL: z.string().default('https://api.cstest.pp.ua'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/** Parse and validate environment variables. Returns config with defaults for missing optional vars. */
export function validateEnv(): EnvConfig {
  const raw = {
    VITE_DEEPSEEK_API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY,
    VITE_GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    VITE_TELEGRAM_BOT_TOKEN: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_CS_API_URL: import.meta.env.VITE_CS_API_URL,
  };
  return envSchema.parse(raw);
}

/** Check which optional env vars are missing */
export function getMissingEnvVars(config: EnvConfig): string[] {
  const warnings: string[] = [];
  if (!config.VITE_DEEPSEEK_API_KEY) warnings.push('VITE_DEEPSEEK_API_KEY — AI recommendations disabled');
  if (!config.VITE_GOOGLE_SHEETS_API_KEY) warnings.push('VITE_GOOGLE_SHEETS_API_KEY — Sheets integration disabled');
  if (!config.VITE_TELEGRAM_BOT_TOKEN) warnings.push('VITE_TELEGRAM_BOT_TOKEN — Telegram bot disabled');
  return warnings;
}
