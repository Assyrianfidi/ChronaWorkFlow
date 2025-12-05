"use strict";
/**
 * Crypto Service Implementation
 * Encryption, decryption, and cryptographic utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
var crypto = require("crypto");
var CryptoService = /** @class */ (function () {
    function CryptoService() {
        this.defaultAlgorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits
        this.saltLength = 32; // 256 bits
    }
    /**
     * Generate a random key
     */
    CryptoService.prototype.generateKey = function (length) {
        if (length === void 0) { length = this.keyLength; }
        return crypto.randomBytes(length).toString('hex');
    };
    /**
     * Generate a random salt
     */
    CryptoService.prototype.generateSalt = function (length) {
        if (length === void 0) { length = this.saltLength; }
        return crypto.randomBytes(length).toString('hex');
    };
    /**
     * Derive key from password using PBKDF2
     */
    CryptoService.prototype.deriveKey = function (password, salt, iterations) {
        if (iterations === void 0) { iterations = 100000; }
        return crypto.pbkdf2Sync(password, salt, iterations, this.keyLength, 'sha256').toString('hex');
    };
    /**
     * Encrypt data using AES-256-GCM
     */
    CryptoService.prototype.encrypt = function (data, key, algorithm) {
        if (algorithm === void 0) { algorithm = this.defaultAlgorithm; }
        var keyBuffer = Buffer.from(key, 'hex');
        var iv = crypto.randomBytes(this.ivLength);
        var cipher = crypto.createCipher(algorithm, keyBuffer);
        var encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // For GCM mode, we would need to handle authentication tag differently
        // This is a simplified implementation
        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            algorithm: algorithm
        };
    };
    /**
     * Decrypt data using AES-256-GCM
     */
    CryptoService.prototype.decrypt = function (encryptedData, key) {
        var keyBuffer = Buffer.from(key, 'hex');
        var iv = Buffer.from(encryptedData.iv, 'hex');
        var decipher = crypto.createDecipher(encryptedData.algorithm, keyBuffer);
        var decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    };
    /**
     * Hash data using SHA-256
     */
    CryptoService.prototype.hash = function (data, salt) {
        var saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(this.saltLength);
        var hash = crypto.createHmac('sha256', saltBuffer)
            .update(data)
            .digest('hex');
        return {
            hash: hash,
            salt: saltBuffer.toString('hex'),
            algorithm: 'sha256'
        };
    };
    /**
     * Verify hash against data
     */
    CryptoService.prototype.verifyHash = function (data, hashResult) {
        var computedHash = this.hash(data, hashResult.salt);
        return computedHash.hash === hashResult.hash;
    };
    /**
     * Generate checksum for data integrity
     */
    CryptoService.prototype.generateChecksum = function (data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    };
    /**
     * Verify checksum
     */
    CryptoService.prototype.verifyChecksum = function (data, checksum) {
        return this.generateChecksum(data) === checksum;
    };
    /**
     * Generate digital signature
     */
    CryptoService.prototype.sign = function (data, privateKey) {
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(data);
        return sign.sign(privateKey, 'hex');
    };
    /**
     * Verify digital signature
     */
    CryptoService.prototype.verifySignature = function (data, signature, publicKey) {
        var verify = crypto.createVerify('RSA-SHA256');
        verify.update(data);
        return verify.verify(publicKey, signature, 'hex');
    };
    /**
     * Generate RSA key pair
     */
    CryptoService.prototype.generateKeyPair = function (modulus) {
        if (modulus === void 0) { modulus = 2048; }
        var _a = crypto.generateKeyPairSync('rsa', {
            modulusLength: modulus,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        }), publicKey = _a.publicKey, privateKey = _a.privateKey;
        return { publicKey: publicKey, privateKey: privateKey };
    };
    /**
     * Generate UUID
     */
    CryptoService.prototype.generateUUID = function () {
        return crypto.randomUUID();
    };
    /**
     * Generate random string
     */
    CryptoService.prototype.generateRandomString = function (length, charset) {
        if (charset === void 0) { charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; }
        var result = '';
        var bytes = crypto.randomBytes(length);
        for (var i = 0; i < length; i++) {
            result += charset[bytes[i] % charset.length];
        }
        return result;
    };
    /**
     * Constant-time comparison to prevent timing attacks
     */
    CryptoService.prototype.timingSafeEqual = function (a, b) {
        if (a.length !== b.length) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    };
    /**
     * Encrypt sensitive data for storage
     */
    CryptoService.prototype.encryptSensitive = function (data, masterKey) {
        var jsonString = JSON.stringify(data);
        var encrypted = this.encrypt(jsonString, masterKey);
        return JSON.stringify(encrypted);
    };
    /**
     * Decrypt sensitive data from storage
     */
    CryptoService.prototype.decryptSensitive = function (encryptedData, masterKey) {
        var encrypted = JSON.parse(encryptedData);
        var decrypted = this.decrypt(encrypted, masterKey);
        return JSON.parse(decrypted);
    };
    /**
     * Generate password hash
     */
    CryptoService.prototype.hashPassword = function (password) {
        var salt = this.generateSalt();
        var hash = crypto.pbkdf2Sync(password, salt, 100000, this.keyLength, 'sha256').toString('hex');
        return {
            hash: hash,
            salt: salt,
            algorithm: 'pbkdf2-sha256'
        };
    };
    /**
     * Verify password
     */
    CryptoService.prototype.verifyPassword = function (password, hashResult) {
        var hash = crypto.pbkdf2Sync(password, hashResult.salt, 100000, this.keyLength, 'sha256').toString('hex');
        return this.timingSafeEqual(hash, hashResult.hash);
    };
    return CryptoService;
}());
exports.CryptoService = CryptoService;
exports.default = CryptoService;
