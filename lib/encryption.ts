import { createHash, randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';

const KEY_VERSION_LENGTH = 8;
const KEY_LENGTH = 32;

export function generateKeyVersion(): string {
  return randomBytes(KEY_VERSION_LENGTH).toString('hex');
}

export async function rotateKey(
  encryptedData: { encrypted: string; iv: string; salt: string; tag: string; version?: string },
  oldKey: string,
  newKey: string,
  newVersion: string
): Promise<{ success: boolean; newData?: any; error?: string }> {
  try {
    const key = await promisify(scrypt)(oldKey, Buffer.from(encryptedData.salt, 'base64'), 32) as Buffer;
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encryptedData.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
      decipher.final()
    ]);
    
    // Re-encrypt with new key
    const newSalt = randomBytes(16);
    const newKey32 = await promisify(scrypt)(newKey, newSalt, 32) as Buffer;
    const newIv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', newKey32, newIv);
    const newEncrypted = Buffer.concat([cipher.update(decrypted), cipher.final()]);
    
    return {
      success: true,
      newData: {
        encrypted: newEncrypted.toString('base64'),
        iv: newIv.toString('base64'),
        salt: newSalt.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        version: newVersion
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during key rotation'
    };
  }
}

export class MessageEncryption {
  static async generateSharedSecret(userId1: string, userId2: string): Promise<Buffer> {
    const sortedIds = [userId1, userId2].sort().join(':');
    return promisify(scrypt)(sortedIds, 'salt', 32) as Promise<Buffer>;
  }

  static async encryptMessage(content: string, key: Buffer) {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  }

  static async decryptMessage(encryptedData: { ciphertext: string; iv: string; salt: string }, key: Buffer) {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encryptedData.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(encryptedData.salt, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.ciphertext, 'base64')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  }
}

export async function encrypt(data: string, masterKey: string): Promise<{ encrypted: string; iv: string; salt: string; tag: string }> {
  const salt = randomBytes(16);
  const key = await promisify(scrypt)(masterKey, salt, KEY_LENGTH) as Buffer;
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    tag: tag.toString('base64')
  };
}

export async function decrypt(encryptedData: { encrypted: string; iv: string; salt: string; tag: string }, masterKey: string): Promise<string> {
  const key = await promisify(scrypt)(masterKey, Buffer.from(encryptedData.salt, 'base64'), KEY_LENGTH) as Buffer;
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encryptedData.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
} 