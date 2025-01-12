import { createClient } from '@supabase/supabase-js';
import { generateKeyVersion, rotateKey } from './encryption';

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
  version?: string;
}

interface KeyVersion {
  version: string;
  created_at: string;
  rotated_at: string | null;
  status: 'active' | 'rotating' | 'retired';
  metadata: Record<string, any>;
}

interface RotationOptions {
  tables?: string[];
  batchSize?: number;
  onProgress?: (progress: number) => void;
}

interface EncryptedRecord {
  id: number;
  encrypted_data: EncryptedData | null;
  encryption_version: string | null;
}

const DEFAULT_ROTATION_OPTIONS: Required<RotationOptions> = {
  tables: ['direct_messages', 'payment_methods', 'user_settings', 'user_profiles'],
  batchSize: 100,
  onProgress: () => {},
};

/**
 * Creates a new encryption key version
 */
export async function createKeyVersion(supabase: ReturnType<typeof createClient>) {
  const version = generateKeyVersion();
  
  const { error } = await supabase
    .from('encryption_keys')
    .insert([{
      version,
      created_at: new Date().toISOString(),
      status: 'active',
      metadata: {
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }
    }]);

  if (error) throw error;
  return version;
}

/**
 * Gets all active encryption key versions
 */
export async function getActiveKeyVersions(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('encryption_keys')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as KeyVersion[];
}

/**
 * Rotates encryption keys for all encrypted data
 */
export async function rotateEncryptionKeys(
  supabase: ReturnType<typeof createClient>,
  oldKey: string,
  newKey: string,
  options: RotationOptions = {}
) {
  const { tables, batchSize, onProgress } = {
    ...DEFAULT_ROTATION_OPTIONS,
    ...options,
  };

  // Create new key version
  const newVersion = await createKeyVersion(supabase);

  // Mark old key as rotating
  await supabase
    .from('encryption_keys')
    .update({ status: 'rotating' })
    .eq('version', oldKey);

  let totalProcessed = 0;
  let totalRecords = 0;

  // Count total records to process
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .not('encrypted_data', 'is', null);

    totalRecords += count || 0;
  }

  // Process each table
  for (const table of tables) {
    let lastId = 0;
    let hasMore = true;

    while (hasMore) {
      // Get batch of records
      const { data: records, error } = await supabase
        .from(table)
        .select('id, encrypted_data, encryption_version')
        .not('encrypted_data', 'is', null)
        .gt('id', lastId)
        .order('id')
        .limit(batchSize);

      if (error) throw error;
      if (!records?.length) break;

      // Process batch
      const updates = await Promise.all(
        records.map(async (record: EncryptedRecord) => {
          if (!record.encrypted_data) return null;

          const result = await rotateKey(
            record.encrypted_data,
            oldKey,
            newKey,
            newVersion
          );

          if (!result.success || !result.newData) return null;

          return {
            id: record.id,
            encrypted_data: result.newData,
            encryption_version: newVersion
          };
        })
      );

      // Update records with new encryption
      const validUpdates = updates.filter((u): u is NonNullable<typeof u> => u !== null);
      if (validUpdates.length > 0) {
        const { error: updateError } = await supabase
          .from(table)
          .upsert(validUpdates);

        if (updateError) throw updateError;
      }

      lastId = records[records.length - 1].id;
      totalProcessed += records.length;
      onProgress((totalProcessed / totalRecords) * 100);

      hasMore = records.length === batchSize;
    }
  }

  // Mark old key as retired
  await supabase
    .from('encryption_keys')
    .update({
      status: 'retired',
      rotated_at: new Date().toISOString()
    })
    .eq('version', oldKey);

  return {
    newVersion,
    totalProcessed,
    success: true
  };
}

/**
 * Gets the encryption key version for a specific record
 */
export async function getKeyVersionForRecord(
  supabase: ReturnType<typeof createClient>,
  table: string,
  recordId: number | string
) {
  const { data, error } = await supabase
    .from(table)
    .select('encryption_version')
    .eq('id', recordId)
    .single();

  if (error) throw error;
  return data?.encryption_version;
}

/**
 * Gets all encryption keys with their status
 */
export async function getAllKeyVersions(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('encryption_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as KeyVersion[];
} 