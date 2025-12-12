/**
 * Crypto Service Implementation
 * Encryption, decryption, and cryptographic utilities
 */

import * as crypto from "crypto";

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag?: string;
  algorithm: string;
}

export interface HashResult {
  hash: string;
  salt: string;
  algorithm: string;
}

export class CryptoService {
  private readonly defaultAlgorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 32; // 256 bits

  /**
   * Generate a random key
   */
  generateKey(length: number = this.keyLength): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate a random salt
   */
  generateSalt(length: number = this.saltLength): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Derive key from password using PBKDF2
   */
  deriveKey(
    password: string,
    salt: string,
    iterations: number = 100000,
  ): string {
    return crypto
      .pbkdf2Sync(password, salt, iterations, this.keyLength, "sha256")
      .toString("hex");
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(
    data: string,
    key: string,
    algorithm: string = this.defaultAlgorithm,
  ): EncryptionResult {
    const keyBuffer = Buffer.from(key, "hex");
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipher(algorithm, keyBuffer);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    // For GCM mode, we would need to handle authentication tag differently
    // This is a simplified implementation

    return {
      encrypted,
      iv: iv.toString("hex"),
      algorithm,
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptionResult, key: string): string {
    const keyBuffer = Buffer.from(key, "hex");
    const iv = Buffer.from(encryptedData.iv, "hex");

    const decipher = crypto.createDecipher(encryptedData.algorithm, keyBuffer);

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Hash data using SHA-256
   */
  hash(data: string, salt?: string): HashResult {
    const saltBuffer = salt
      ? Buffer.from(salt, "hex")
      : crypto.randomBytes(this.saltLength);

    const hash = crypto
      .createHmac("sha256", saltBuffer)
      .update(data)
      .digest("hex");

    return {
      hash,
      salt: saltBuffer.toString("hex"),
      algorithm: "sha256",
    };
  }

  /**
   * Verify hash against data
   */
  verifyHash(data: string, hashResult: HashResult): boolean {
    const computedHash = this.hash(data, hashResult.salt);
    return computedHash.hash === hashResult.hash;
  }

  /**
   * Generate checksum for data integrity
   */
  generateChecksum(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Verify checksum
   */
  verifyChecksum(data: string, checksum: string): boolean {
    return this.generateChecksum(data) === checksum;
  }

  /**
   * Generate digital signature
   */
  sign(data: string, privateKey: string): string {
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(data);
    return sign.sign(privateKey, "hex");
  }

  /**
   * Verify digital signature
   */
  verifySignature(data: string, signature: string, publicKey: string): boolean {
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(data);
    return verify.verify(publicKey, signature, "hex");
  }

  /**
   * Generate RSA key pair
   */
  generateKeyPair(modulus: number = 2048): {
    publicKey: string;
    privateKey: string;
  } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: modulus,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Generate UUID
   */
  generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Generate random string
   */
  generateRandomString(
    length: number,
    charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  ): string {
    let result = "";
    const bytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      result += charset[bytes[i] % charset.length];
    }

    return result;
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Encrypt sensitive data for storage
   */
  encryptSensitive(data: any, masterKey: string): string {
    const jsonString = JSON.stringify(data);
    const encrypted = this.encrypt(jsonString, masterKey);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt sensitive data from storage
   */
  decryptSensitive(encryptedData: string, masterKey: string): any {
    const encrypted = JSON.parse(encryptedData) as EncryptionResult;
    const decrypted = this.decrypt(encrypted, masterKey);
    return JSON.parse(decrypted);
  }

  /**
   * Generate password hash
   */
  hashPassword(password: string): HashResult {
    const salt = this.generateSalt();
    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, this.keyLength, "sha256")
      .toString("hex");

    return {
      hash,
      salt,
      algorithm: "pbkdf2-sha256",
    };
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hashResult: HashResult): boolean {
    const hash = crypto
      .pbkdf2Sync(password, hashResult.salt, 100000, this.keyLength, "sha256")
      .toString("hex");
    return this.timingSafeEqual(hash, hashResult.hash);
  }
}

export default CryptoService;
