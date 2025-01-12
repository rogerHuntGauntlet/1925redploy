import { PublicKey } from '@solana/web3.js';
import type { Config } from '../types/config';

type ValidationError = {
  path: string[];
  message: string;
};

export class ConfigValidationError extends Error {
  errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = `Configuration validation failed:\n${errors
      .map(e => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n')}`;
    super(message);
    this.name = 'ConfigValidationError';
    this.errors = errors;
  }
}

export function validateConfig(config: Config): void {
  const errors: ValidationError[] = [];

  // Helper function to add errors
  const addError = (path: string[], message: string) => {
    errors.push({ path, message });
  };

  // Validate app config
  if (!config.app.name) {
    addError(['app', 'name'], 'App name is required');
  }
  if (!config.app.url) {
    addError(['app', 'url'], 'App URL is required');
  }

  // Validate Supabase config
  if (!config.supabase.url) {
    addError(['supabase', 'url'], 'Supabase URL is required');
  }
  if (!config.supabase.anonKey) {
    addError(['supabase', 'anonKey'], 'Supabase anonymous key is required');
  }
  if (!config.supabase.serviceRole) {
    addError(['supabase', 'serviceRole'], 'Supabase service role key is required');
  }

  // Validate auth providers
  if (config.auth.providers.github.enabled && !config.auth.providers.github.clientId) {
    addError(
      ['auth', 'providers', 'github', 'clientId'],
      'GitHub client ID is required when GitHub auth is enabled'
    );
  }
  if (config.auth.providers.google.enabled && !config.auth.providers.google.clientId) {
    addError(
      ['auth', 'providers', 'google', 'clientId'],
      'Google client ID is required when Google auth is enabled'
    );
  }
  if (config.auth.hcaptcha.enabled && !config.auth.hcaptcha.siteKey) {
    addError(
      ['auth', 'hcaptcha', 'siteKey'],
      'HCaptcha site key is required when HCaptcha is enabled'
    );
  }

  // Validate Solana config
  if (config.solana.rpcEndpoints.length === 0) {
    addError(['solana', 'rpcEndpoints'], 'At least one RPC endpoint is required');
  }
  if (config.solana.wsEndpoints.length === 0) {
    addError(['solana', 'wsEndpoints'], 'At least one WebSocket endpoint is required');
  }

  // Validate token config
  try {
    if (!(config.solana.token.mintAddress instanceof PublicKey)) {
      addError(['solana', 'token', 'mintAddress'], 'Invalid mint address');
    }
  } catch {
    addError(['solana', 'token', 'mintAddress'], 'Invalid mint address format');
  }

  if (config.solana.token.requiredBalance < 0) {
    addError(['solana', 'token', 'requiredBalance'], 'Required balance must be non-negative');
  }
  if (config.solana.token.decimals < 0 || config.solana.token.decimals > 9) {
    addError(['solana', 'token', 'decimals'], 'Decimals must be between 0 and 9');
  }
  if (!config.solana.token.symbol) {
    addError(['solana', 'token', 'symbol'], 'Token symbol is required');
  }
  if (config.solana.token.balanceCheckInterval < 1000) {
    addError(['solana', 'token', 'balanceCheckInterval'], 'Balance check interval must be at least 1000ms');
  }
  if (config.solana.token.gracePeriod < 0) {
    addError(['solana', 'token', 'gracePeriod'], 'Grace period must be non-negative');
  }

  // Validate Stripe config
  if (!config.stripe.publishableKey) {
    addError(['stripe', 'publishableKey'], 'Stripe publishable key is required');
  }
  if (!config.stripe.prices.lifetime) {
    addError(['stripe', 'prices', 'lifetime'], 'Lifetime price ID is required');
  }
  if (!config.stripe.products.lifetime || !config.stripe.products.enterprise) {
    addError(['stripe', 'products'], 'All product names are required');
  }

  if (errors.length > 0) {
    throw new ConfigValidationError(errors);
  }
} 