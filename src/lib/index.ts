/**
 * Lib barrel exports — organized by domain.
 *
 * Usage (new — subdirectories):
 *   import { api, authService } from '@/lib/api';
 *   import { BankrollService, UserDataService } from '@/lib/services';
 *   import { cn, chartColors, t } from '@/lib/utils';
 *
 * Usage (legacy — flat imports still work):
 *   import { api } from '@/lib/apiClient';
 *   import { BankrollService } from '@/lib/bankrollService';
 */

// Re-export everything from subdirectories
export * from './api';
export * from './services';
export * from './ai';
export * from './analytics';
export * from './parsing';
export * from './utils';
export * from './monitoring';
export { chartColors, chartPalette, profitColor, lossColor } from './chartColors';
