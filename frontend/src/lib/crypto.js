import { PROTOCOL_VERSION, HKDF_SALT, HKDF_INFO } from "./crypto-states.js";

const DB_NAME = "chatter-e2ee";
const DB_VERSION = 1;
const KEY_STORE = "keys";
const SESSION_STORE = "sessions";
const IDENTITY_PRIV_KEY = "identity-private";
const IDENTITY_PUB_JWK = "identity-public-jwk";

function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(KEY_STORE)) {
                db.createObjectStore(KEY_STORE);
            }
            if (!db.objectStoreNames.contains(SESSION_STORE)) {
                db.createObjectStore(SESSION_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function idbPut(storeName, key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbGet(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbDelete(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function generateIdentityKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"]
    );

    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

    await idbPut(KEY_STORE, IDENTITY_PRIV_KEY, keyPair.privateKey);
    await idbPut(KEY_STORE, IDENTITY_PUB_JWK, JSON.stringify(publicJwk));

    return {
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
        publicJwk: JSON.stringify(publicJwk),
    };
}

export async function loadIdentityPrivateKey() {
    try {
        const privateKey = await idbGet(KEY_STORE, IDENTITY_PRIV_KEY);
        const pubJwkStr = await idbGet(KEY_STORE, IDENTITY_PUB_JWK);
        if (!privateKey) return null;
        return {
            privateKey,
            publicJwk: pubJwkStr || null,
        };
    } catch {
        return null;
    }
}

export function importPublicKeyJWK(jwkString) {
    const jwk = typeof jwkString === "string" ? JSON.parse(jwkString) : jwkString;
    return crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
    );
}

async function deriveRawSharedSecret(privateKey, remotePublicKeyJwk) {
    const remoteKey = typeof remotePublicKeyJwk === "string"
        ? await importPublicKeyJWK(remotePublicKeyJwk)
        : remotePublicKeyJwk;

    return crypto.subtle.deriveBits(
        { name: "ECDH", public: remoteKey },
        privateKey,
        256
    );
}

async function hkdfDeriveAesKey(sharedSecretBits, conversationId) {
    const hkdfKey = await crypto.subtle.importKey(
        "raw",
        sharedSecretBits,
        "HKDF",
        false,
        ["deriveKey"]
    );

    const info = new TextEncoder().encode(conversationId || "chatter-default");

    return crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: HKDF_SALT,
            info: info,
        },
        hkdfKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function deriveSessionKey(identityPrivateKey, remoteIdentityPublicKeyJwk, conversationId) {
    const sharedSecretBits = await deriveRawSharedSecret(identityPrivateKey, remoteIdentityPublicKeyJwk);
    return hkdfDeriveAesKey(sharedSecretBits, conversationId);
}

export function generateRandomIV() {
    return crypto.getRandomValues(new Uint8Array(12));
}

export function createAAD({ protocolVersion, conversationId, messageId, senderId, recipientId, sequenceNumber }) {
    const aadObject = {
        v: protocolVersion ?? PROTOCOL_VERSION,
        c: conversationId,
        m: messageId,
        s: senderId,
        r: recipientId,
        n: sequenceNumber ?? 0,
    };
    return new TextEncoder().encode(JSON.stringify(aadObject));
}

export async function encryptMessage(sessionKey, plaintext, aad) {
    const iv = generateRandomIV();
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
        sessionKey,
        encoded
    );

    return {
        ciphertext: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv),
    };
}

export async function decryptMessage(sessionKey, ciphertextBase64, ivBase64, aad) {
    const ciphertext = base64ToBuffer(ciphertextBase64);
    const iv = base64ToBuffer(ivBase64);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv), additionalData: aad, tagLength: 128 },
        sessionKey,
        ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
}

export async function fingerprintPublicKey(publicKeyJwkString) {
    const jwk = typeof publicKeyJwkString === "string"
        ? publicKeyJwkString
        : JSON.stringify(publicKeyJwkString);

    const data = new TextEncoder().encode(jwk);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);

    const hex = Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();

    const groups = [];
    for (let i = 0; i < hex.length; i += 4) {
        groups.push(hex.slice(i, i + 4));
    }
    return groups.join(" ");
}

export async function storeSessionKey(conversationId, key) {
    await idbPut(SESSION_STORE, conversationId, key);
}

export async function loadSessionKey(conversationId) {
    try {
        return await idbGet(SESSION_STORE, conversationId);
    } catch {
        return null;
    }
}

export async function removeSessionKey(conversationId) {
    try {
        await idbDelete(SESSION_STORE, conversationId);
    } catch {
        // ignore
    }
}

export function generateMessageId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export async function cryptoSelfTest() {
    const alice = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"]
    );
    const bob = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"]
    );

    const alicePubJwk = await crypto.subtle.exportKey("jwk", alice.publicKey);
    const bobPubJwk = await crypto.subtle.exportKey("jwk", bob.publicKey);

    const aliceSharedBits = await crypto.subtle.deriveBits(
        { name: "ECDH", public: bob.publicKey },
        alice.privateKey,
        256
    );
    const bobSharedBits = await crypto.subtle.deriveBits(
        { name: "ECDH", public: alice.publicKey },
        bob.privateKey,
        256
    );

    const aliceHash = new Uint8Array(await crypto.subtle.digest("SHA-256", aliceSharedBits));
    const bobHash = new Uint8Array(await crypto.subtle.digest("SHA-256", bobSharedBits));

    const secretsMatch = aliceHash.every((v, i) => v === bobHash[i]);
    if (!secretsMatch) throw new Error("SELF-TEST FAILED: ECDH shared secrets differ");

    const testConvId = "self-test-" + Date.now();
    const aliceKey = await hkdfDeriveAesKey(aliceSharedBits, testConvId);
    const bobKey = await hkdfDeriveAesKey(bobSharedBits, testConvId);

    const aad = new TextEncoder().encode(JSON.stringify({ test: true }));
    const iv = generateRandomIV();
    const testPlaintext = "hello chatter e2ee";

    const ciphertextBuf = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
        aliceKey,
        new TextEncoder().encode(testPlaintext)
    );

    const decryptedBuf = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
        bobKey,
        ciphertextBuf
    );

    const decrypted = new TextDecoder().decode(decryptedBuf);
    if (decrypted !== testPlaintext) throw new Error("SELF-TEST FAILED: Decrypted text mismatch");

    const badAad = new TextEncoder().encode(JSON.stringify({ test: false }));
    try {
        await crypto.subtle.decrypt(
            { name: "AES-GCM", iv, additionalData: badAad, tagLength: 128 },
            bobKey,
            ciphertextBuf
        );
        throw new Error("SELF-TEST FAILED: Should have rejected bad AAD");
    } catch (e) {
        if (e.message.includes("SELF-TEST FAILED")) throw e;
    }

    return true;
}
