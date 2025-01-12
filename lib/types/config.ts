import { PublicKey } from '@solana/web3.js';

export interface AppConfig {
  name: string;
  url: string;
  isDev: boolean;
  isProd: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRole: string;
}

export interface AuthProvider {
  enabled: boolean;
  clientId: string;
}

export interface AuthConfig {
  providers: {
    github: AuthProvider;
    google: AuthProvider;
  };
  hcaptcha: {
    enabled: boolean;
    siteKey: string;
  };
}

export interface TokenConfig {
  mintAddress: PublicKey;
  requiredBalance: number;
  decimals: number;
  symbol: string;
  balanceCheckInterval: number;
  gracePeriod: number;
}

export interface SolanaConfig {
  rpcEndpoints: string[];
  wsEndpoints: string[];
  token: TokenConfig;
}

export interface LoggingConfig {
  enabled: boolean;
}

export interface StripeProducts {
  lifetime: string;
  enterprise: string;
}

export interface StripePrices {
  lifetime: string;
}

export interface StripeConfig {
  publishableKey: string;
  prices: StripePrices;
  products: StripeProducts;
}

export interface Config {
  app: AppConfig;
  supabase: SupabaseConfig;
  auth: AuthConfig;
  solana: SolanaConfig;
  logging: LoggingConfig;
  stripe: StripeConfig;
}

// Environment variable types
export interface EnvVars {
  // App
  NEXT_PUBLIC_APP_NAME?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NODE_ENV: 'development' | 'production' | 'test';

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Auth
  NEXT_PUBLIC_GITHUB_AUTH_ENABLED?: string;
  NEXT_PUBLIC_GITHUB_CLIENT_ID?: string;
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED?: string;
  NEXT_PUBLIC_GOOGLE_CLIENT_ID?: string;
  NEXT_PUBLIC_HCAPTCHA_ENABLED?: string;
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY?: string;

  // Solana
  SOLANA_RPC_URL?: string;
  SOLANA_WS_URL?: string;
  TOKEN_MINT_ADDRESS: string;
  REQUIRED_TOKEN_BALANCE?: string;
  REQUIRED_TOKEN_DECIMALS?: string;
  TOKEN_SYMBOL: string;
  TOKEN_BALANCE_CHECK_INTERVAL?: string;
  TOKEN_BALANCE_GRACE_PERIOD?: string;

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID: string;

  // Logging
  NEXT_PUBLIC_ENABLE_LOGS?: string;
} 