export interface User {
  id: string;
  name: string;
  avatar: string;
  publicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
  publicKeyString: string; // For display
}

export interface EncryptedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  ciphertext: string; // Base64 encoded encrypted data
  timestamp: number;
}

export interface DecryptedMessage extends EncryptedMessage {
  plaintext: string; // The actual readable text
  isDecrypted: boolean;
}

export type UserRole = 'A' | 'B';

export interface CryptoKeys {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}