export const CryptoState = Object.freeze({
    KEY_SETUP: "KEY_SETUP",
    ENCRYPTED: "ENCRYPTED",
    KEY_CHANGED: "KEY_CHANGED",
    DECRYPTION_FAILED: "DECRYPTION_FAILED",
    ENCRYPTION_FAILED: "ENCRYPTION_FAILED",
    SESSION_REQUIRED: "SESSION_REQUIRED",
    KEY_REVOKED: "KEY_REVOKED",
});

export const PROTOCOL_VERSION = 1;
export const HKDF_SALT = new TextEncoder().encode("chatter-e2ee-v1");
export const HKDF_INFO = new TextEncoder().encode("chatter-session-key");
export const FINGERPRINT_ALGO = "SHA-256";
