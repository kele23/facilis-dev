import crypto from 'node:crypto';
import { useRuntimeConfig } from 'nitro/runtime-config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT = 'facilis';

function getKey() {
    const secretKey = useRuntimeConfig().encryptionSecret as string;
    return crypto.scryptSync(secretKey, SALT, 32);
}

export function encryptToken(text: string): string {
    if (!text) return '';
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key as any, iv as any);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

export function decryptToken(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return '';
    const key = getKey();

    const parts = encryptedText.split(':');
    if (parts.length !== 3) return '';

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key as any, iv as any);
    decipher.setAuthTag(authTag as any);

    let decrypted = decipher.update(encrypted as any, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
