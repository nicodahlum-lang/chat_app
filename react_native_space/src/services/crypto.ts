import { RSA } from 'react-native-rsa-native';
import { storage } from '../utils/storage';

const PUBLIC_KEY_STORE = 'e2e_public_key';
const PRIVATE_KEY_STORE = 'e2e_private_key';

export class CryptoService {
    private publicKey: string | null = null;
    private privateKey: string | null = null;

    async generateKeyPair(): Promise<string> {
        try {
            const keys = await RSA.generateKeys(2048);
            this.publicKey = keys.public;
            this.privateKey = keys.private;

            await storage.setItem(PUBLIC_KEY_STORE, keys.public);
            await storage.setItem(PRIVATE_KEY_STORE, keys.private);

            return keys.public;
        } catch (e) {
            console.error('generateKeyPair error', e);
            return '';
        }
    }

    async loadKeys(): Promise<boolean> {
        this.publicKey = await storage.getItem(PUBLIC_KEY_STORE);
        this.privateKey = await storage.getItem(PRIVATE_KEY_STORE);
        return !!this.privateKey && !!this.publicKey;
    }

    getPublicKey() {
        return this.publicKey;
    }

    async encryptMessage(message: string, recipientPublicKey: string): Promise<string> {
        if (!recipientPublicKey || !message) return message;
        try {
            const encrypted = await RSA.encrypt(message, recipientPublicKey);
            return `ENC:${encrypted}`;
        } catch (e) {
            console.error('encrypt error', e);
            return message; // return unencrypted as fallback
        }
    }

    async decryptMessage(encryptedMessage: string): Promise<string> {
        if (!encryptedMessage || !encryptedMessage.startsWith('ENC:')) {
            return encryptedMessage; // Not encrypted
        }

        if (!this.privateKey) {
            console.warn('Private key not loaded for decryption');
            return '[Message encrypted]';
        }

        try {
            const rawEncrypted = encryptedMessage.substring(4); // Remove ENC:
            return await RSA.decrypt(rawEncrypted, this.privateKey);
        } catch (e) {
            console.error('decrypt error', e);
            return '[Unable to decrypt]';
        }
    }
}

export const cryptoService = new CryptoService();
