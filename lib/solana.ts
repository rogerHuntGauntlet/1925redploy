import { Connection, ConnectionConfig } from '@solana/web3.js';
import config from './config';

const DEFAULT_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  disableRetryOnRateLimit: false,
  wsEndpoint: config.solana.wsEndpoints[0], // Use first available WS endpoint
};

// Export RPC endpoints for use in other parts of the application
export const RPC_ENDPOINTS = config.solana.rpcEndpoints;
export const WS_ENDPOINTS = config.solana.wsEndpoints;

/**
 * Execute a Solana operation with automatic fallback to different RPC endpoints
 * @param operation The operation to execute
 * @returns The result of the operation
 */
export async function executeSolanaOperation<T>(
  operation: (connection: Connection) => Promise<T>
): Promise<T> {
  let lastError: Error | null = null;

  // Try each RPC endpoint until one works
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const connection = new Connection(endpoint, DEFAULT_CONFIG);
      return await operation(connection);
    } catch (error) {
      console.error(`Error with RPC endpoint ${endpoint}:`, error);
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error('All RPC endpoints failed');
}

export default DEFAULT_CONFIG; 