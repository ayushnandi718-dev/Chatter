import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import {
    generateIdentityKeyPair,
    loadIdentityPrivateKey,
    deriveSessionKey,
    encryptMessage,
    decryptMessage,
    createAAD,
    fingerprintPublicKey,
    generateMessageId,
    storeSessionKey,
    loadSessionKey,
    cryptoSelfTest,
} from "../lib/crypto";
import { CryptoState, PROTOCOL_VERSION } from "../lib/crypto-states";

const IS_DEV = import.meta.env.DEV;

function log(label, data) {
    if (IS_DEV) console.log(`[E2EE] ${label}`, data);
}

function warn(label, data) {
    console.warn(`[E2EE] ${label}`, data);
}

function error(label, data) {
    console.error(`[E2EE] ${label}`, data);
}

export const useCryptoStore = create((set, get) => ({
    identityPrivateKey: null,
    identityPublicKeyJwk: null,
    identityFingerprint: "",
    cryptoState: CryptoState.KEY_SETUP,
    lastError: "",
    sessionKeys: {},
    friendsPublicKeys: {},

    setLastError: (msg) => set({ lastError: msg }),

    ensureIdentityKey: async () => {
        const { identityPrivateKey } = get();
        if (identityPrivateKey) {
            log("IDENTITY KEY ALREADY LOADED", { fingerprint: get().identityFingerprint });
            return;
        }

        log("IDENTITY KEY SETUP START", {});

        try {
            log("RUNNING CRYPTO SELF-TEST", {});
            try {
                await cryptoSelfTest();
                log("CRYPTO SELF-TEST PASSED", {});
            } catch (testError) {
                error("CRYPTO SELF-TEST FAILED", { message: testError.message });
                set({ cryptoState: CryptoState.ENCRYPTION_FAILED, lastError: "Crypto self-test failed: " + testError.message });
                return;
            }

            const stored = await loadIdentityPrivateKey();

            if (stored?.privateKey && stored?.publicJwk) {
                const fp = await fingerprintPublicKey(stored.publicJwk);
                set({
                    identityPrivateKey: stored.privateKey,
                    identityPublicKeyJwk: stored.publicJwk,
                    identityFingerprint: fp,
                    cryptoState: CryptoState.ENCRYPTED,
                });

                log("IDENTITY KEY LOADED FROM INDEXEDDB", { fingerprint: fp });

                try {
                    await axiosInstance.post("/users/upload-public-key", {
                        publicKey: stored.publicJwk,
                        fingerprint: fp,
                    });
                    log("PUBLIC KEY UPLOADED", {});
                } catch (uploadErr) {
                    warn("PUBLIC KEY UPLOAD FAILED", { error: uploadErr.message, status: uploadErr.response?.status });
                }

                return;
            }

            log("GENERATING NEW IDENTITY KEYPAIR", {});
            const keyPair = await generateIdentityKeyPair();
            const pubJwk = keyPair.publicJwk;
            const fp = await fingerprintPublicKey(pubJwk);

            try {
                await axiosInstance.post("/users/upload-public-key", {
                    publicKey: pubJwk,
                    fingerprint: fp,
                });
                log("NEW PUBLIC KEY UPLOADED", {});
            } catch (uploadErr) {
                warn("NEW PUBLIC KEY UPLOAD FAILED", { error: uploadErr.message, status: uploadErr.response?.status });
            }

            set({
                identityPrivateKey: keyPair.privateKey,
                identityPublicKeyJwk: pubJwk,
                identityFingerprint: fp,
                cryptoState: CryptoState.ENCRYPTED,
            });

            log("NEW IDENTITY KEYPAIR GENERATED", { fingerprint: fp });
        } catch (err) {
            error("IDENTITY KEY SETUP FAILED", { name: err?.name, message: err?.message });
            set({ cryptoState: CryptoState.KEY_SETUP, lastError: "Key setup failed: " + (err?.message || "unknown error") });
        }
    },

    fetchFriendPublicKey: async (userId) => {
        const { friendsPublicKeys } = get();
        if (friendsPublicKeys[userId]) {
            log("FRIEND KEY CACHED", { userId });
            return friendsPublicKeys[userId];
        }

        log("FETCHING FRIEND PUBLIC KEY", { userId });

        try {
            const res = await axiosInstance.get(`/users/${userId}/public-key`);
            const keyData = res.data;

            log("FRIEND KEY RECEIVED", {
                userId,
                hasPublicKey: Boolean(keyData.publicKey),
                publicKeyType: typeof keyData.publicKey,
                fingerprint: keyData.fingerprint,
            });

            set((state) => ({
                friendsPublicKeys: {
                    ...state.friendsPublicKeys,
                    [userId]: keyData,
                },
            }));

            return keyData;
        } catch (err) {
            error("FRIEND KEY FETCH FAILED", {
                userId,
                status: err.response?.status,
                message: err.response?.data?.message || err.message,
            });
            if (err.response?.status === 404) {
                set({ cryptoState: CryptoState.SESSION_REQUIRED });
            }
            return null;
        }
    },

    getOrCreateSessionKey: async (friendUserId, conversationId) => {
        const { sessionKeys, identityPrivateKey } = get();

        if (!conversationId) {
            error("NO CONVERSATION ID", {});
            return null;
        }

        if (sessionKeys[conversationId]) {
            log("SESSION KEY FROM MEMORY", { conversationId });
            return sessionKeys[conversationId];
        }

        let cached = null;
        try {
            cached = await loadSessionKey(conversationId);
        } catch (e) {
            warn("SESSION KEY LOAD FAILED", { conversationId, error: e.message });
        }

        if (cached) {
            set((state) => ({
                sessionKeys: { ...state.sessionKeys, [conversationId]: cached },
            }));
            log("SESSION KEY FROM INDEXEDDB", { conversationId });
            return cached;
        }

        if (!identityPrivateKey) {
            error("NO IDENTITY PRIVATE KEY", { cryptoState: get().cryptoState });
            set({ cryptoState: CryptoState.KEY_SETUP, lastError: "Identity key not loaded. Please refresh the page." });
            return null;
        }

        log("DERIVING NEW SESSION KEY", { conversationId, friendUserId });

        const friendKeyData = await get().fetchFriendPublicKey(friendUserId);
        if (!friendKeyData?.publicKey) {
            error("FRIEND PUBLIC KEY MISSING OR INVALID", { friendUserId, friendKeyData });
            set({ cryptoState: CryptoState.SESSION_REQUIRED, lastError: "Friend has not set up encryption yet." });
            return null;
        }

        try {
            const sessionKey = await deriveSessionKey(
                identityPrivateKey,
                friendKeyData.publicKey,
                conversationId
            );

            set((state) => ({
                sessionKeys: { ...state.sessionKeys, [conversationId]: sessionKey },
                cryptoState: CryptoState.ENCRYPTED,
            }));

            log("SESSION KEY DERIVED SUCCESSFULLY", { conversationId });

            try {
                await storeSessionKey(conversationId, sessionKey);
            } catch (storeErr) {
                warn("SESSION KEY STORAGE FAILED", { conversationId, error: storeErr.message });
            }

            return sessionKey;
        } catch (err) {
            error("SESSION KEY DERIVATION FAILED", {
                name: err?.name,
                message: err?.message,
                conversationId,
                friendUserId,
            });
            set({ cryptoState: CryptoState.ENCRYPTION_FAILED, lastError: "Key derivation failed: " + (err?.message || "unknown error") });
            return null;
        }
    },

    encryptOutgoing: async (plaintext, friendUserId, conversationId, sequenceNumber) => {
        log("ENCRYPT OUTGOING START", { friendUserId, conversationId, sequenceNumber });

        const sessionKey = await get().getOrCreateSessionKey(friendUserId, conversationId);
        if (!sessionKey) {
            const reason = get().lastError || "Could not establish secure session";
            error("ENCRYPT ABORTED: NO SESSION KEY", { friendUserId, conversationId, reason });
            return { error: reason };
        }

        const messageId = generateMessageId();
        const authUser = useAuthStore.getState().authUser;

        const aad = createAAD({
            protocolVersion: PROTOCOL_VERSION,
            conversationId,
            messageId,
            senderId: authUser._id,
            recipientId: friendUserId,
            sequenceNumber: sequenceNumber || 0,
        });

        try {
            const result = await encryptMessage(sessionKey, plaintext, aad);

            log("ENCRYPT SUCCESS", { ciphertextLength: result.ciphertext?.length, ivLength: result.iv?.length });

            return {
                encryptedText: result.ciphertext,
                iv: result.iv,
                messageId,
                sequenceNumber: sequenceNumber || 0,
                protocolVersion: PROTOCOL_VERSION,
            };
        } catch (err) {
            error("ENCRYPT FAILED", { name: err?.name, message: err?.message });
            return { error: "Encryption failed: " + (err?.message || "unknown error") };
        }
    },

    decryptIncoming: async (message) => {
        if (message.text && !message.encryptedText) {
            return message.text;
        }

        if (!message.encryptedText || !message.iv) {
            return "[Legacy message]";
        }

        const authUser = useAuthStore.getState().authUser;
        const conversationId = [message.senderId, message.receiverId].sort().join("-");

        const friendUserId = message.senderId === authUser._id ? message.receiverId : message.senderId;

        const sessionKey = await get().getOrCreateSessionKey(friendUserId, conversationId);

        if (!sessionKey) {
            error("DECRYPT ABORTED: NO SESSION KEY", { messageId: message._id });
            return null;
        }

        const aad = createAAD({
            protocolVersion: message.protocolVersion || PROTOCOL_VERSION,
            conversationId,
            messageId: message.clientMessageId || message._id,
            senderId: message.senderId,
            recipientId: message.receiverId,
            sequenceNumber: message.sequenceNumber || 0,
        });

        try {
            const plaintext = await decryptMessage(sessionKey, message.encryptedText, message.iv, aad);
            log("DECRYPT SUCCESS", { messageId: message.clientMessageId || message._id });
            return plaintext;
        } catch (err) {
            error("DECRYPT FAILED", {
                name: err?.name,
                message: err?.message,
                messageId: message.clientMessageId || message._id,
            });
            return null;
        }
    },

    decryptMessages: async (messages) => {
        const results = [];
        for (const msg of messages) {
            let decryptedMsg = msg;
            if (msg.encryptedText && msg.iv) {
                const plaintext = await get().decryptIncoming(msg);
                decryptedMsg = { ...msg, text: plaintext ?? "🔒 Could not decrypt this message." };
            }
            if (decryptedMsg.replyToMessage?.encryptedText && decryptedMsg.replyToMessage?.iv) {
                const replyPlaintext = await get().decryptIncoming(decryptedMsg.replyToMessage);
                decryptedMsg = {
                    ...decryptedMsg,
                    replyToMessage: { ...decryptedMsg.replyToMessage, text: replyPlaintext ?? "🔒 Could not decrypt" },
                };
            }
            results.push(decryptedMsg);
        }
        return results;
    },
}));
