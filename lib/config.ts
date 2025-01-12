import { PublicKey } from '@solana/web3.js';
import type {
  Config,
  EnvVars,
} from './types/config';
import { validateConfig } from './utils/config-validator';

// Utility functions for environment variables
function getRequiredEnvVar<K extends keyof EnvVars>(key: K): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar<K extends keyof EnvVars>(key: K, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

function parseNumber(value: string | undefined, key: string, defaultValue?: number): number {
  if (!value && defaultValue !== undefined) return defaultValue;
  if (!value) throw new Error(`Missing required number for ${key}`);
  
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid number for ${key}: ${value}`);
  }
  return num;
}

function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Configuration object
const config: Config = {
  app: {
    name: getOptionalEnvVar('NEXT_PUBLIC_APP_NAME', '1925redploy'),
    url: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    isDev: process.env.NEXT_PUBLIC_NODE_ENV === 'development',
    isProd: process.env.NEXT_PUBLIC_NODE_ENV === 'production',
  },
  supabase: {
    url: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRole: getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  },
  auth: {
    providers: {
      github: {
        enabled: parseBoolean(process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED, true),
        clientId: getOptionalEnvVar('NEXT_PUBLIC_GITHUB_CLIENT_ID'),
      },
      google: {
        enabled: parseBoolean(process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED, true),
        clientId: getOptionalEnvVar('NEXT_PUBLIC_GOOGLE_CLIENT_ID'),
      },
    },
    hcaptcha: {
      enabled: parseBoolean(process.env.NEXT_PUBLIC_HCAPTCHA_ENABLED, true),
      siteKey: getOptionalEnvVar('NEXT_PUBLIC_HCAPTCHA_SITE_KEY'),
    },
  },
  solana: {
    rpcEndpoints: [
      getOptionalEnvVar('SOLANA_RPC_URL'),
      'https://solana-mainnet.core.chainstack.com',
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
    ].filter(Boolean),
    wsEndpoints: [
      getOptionalEnvVar('SOLANA_WS_URL'),
      'wss://solana-mainnet.core.chainstack.com',
      'wss://api.mainnet-beta.solana.com',
    ].filter(Boolean),
    token: {
      mintAddress: new PublicKey(getRequiredEnvVar('TOKEN_MINT_ADDRESS')),
      requiredBalance: parseNumber(process.env.NEXT_PUBLIC_TOKEN_REQUIRED_BALANCE, 'NEXT_PUBLIC_TOKEN_REQUIRED_BALANCE'),
      decimals: parseNumber(process.env.NEXT_PUBLIC_TOKEN_DECIMALS, 'NEXT_PUBLIC_TOKEN_DECIMALS'),
      symbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'SOL',
      balanceCheckInterval: parseNumber(process.env.NEXT_PUBLIC_TOKEN_BALANCE_CHECK_INTERVAL, 'NEXT_PUBLIC_TOKEN_BALANCE_CHECK_INTERVAL'),
      gracePeriod: parseNumber(process.env.NEXT_PUBLIC_TOKEN_BALANCE_GRACE_PERIOD, 'NEXT_PUBLIC_TOKEN_BALANCE_GRACE_PERIOD'),
    },
  },
  logging: {
    enabled: parseBoolean(process.env.NEXT_PUBLIC_LOGGING_ENABLED, true),
  },
  stripe: {
    publishableKey: getRequiredEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    prices: {
      lifetime: getRequiredEnvVar('NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID'),
    },
    products: {
      lifetime: 'Lifetime Access',
      enterprise: 'Enterprise Custom',
    },
  },
} as const;

// Validate the configuration
validateConfig(config);

// Type assertion to ensure our config matches the type
const _typeCheck: Config = config;

export default config; 