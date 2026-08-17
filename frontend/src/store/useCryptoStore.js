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

function devLog(label, data) {
    if (IS_DEV) console.log(`[E2EE] ${label}`, data);
}

function devWarn(label, data) {
    if (IS_DEV) console.warn(`[E2EE] ${label}`, data);
}

function devError(label, data) {
    if (IS_DEV) console.error(`[E2EE] ${label}`, data);
}

export const useCryptoStore = create((set, get) => ({
    identityPrivateKey: null,
    identityPublicKeyJwk: null,
    identityFingerprint: "",
    cryptoState: CryptoState.KEY_SETUP,
    sessionKeys: {},
    friendsPublicKeys: {},

    ensureIdentityKey: async () => {
        const { identityPrivateKey } = get();
        if (identityPrivateKey) {
            devLog("IDENTITY KEY ALREADY LOADED", { fingerprint: get().identityFingerprint });
            return;
        }

        devLog("IDENTITY KEY SETUP START", {});

        try {
            devLog("RUNNING CRYPTO SELF-TEST", {});
            try {
                await cryptoSelfTest();
                devLog("CRYPTO SELF-TEST PASSED", {});
            } catch (testError) {
                devError("CRYPTO SELF-TEST FAILED", { message: testError.message });
                set({ cryptoState: CryptoState.ENCRYPTION_FAILED });
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

                devLog("IDENTITY KEY LOADED FROM INDEXEDDB", { fingerprint: fp });

                await axiosInstance.post("/users/upload-public-key", {
                    publicKey: stored.publicJwk,
                    fingerprint: fp,
                }).catch((err) => devWarn("PUBLIC KEY UPLOAD FAILED", { error: err.message }));

                return;
            }

            devLog("GENERATING NEW IDENTITY KEYPAIR", {});
            const keyPair = await generateIdentityKeyPair();
            const pubJwk = keyPair.publicJwk;
            const fp = await fingerprintPublicKey(pubJwk);

            await axiosInstance.post("/users/upload-public-key", {
                publicKey: pubJwk,
                fingerprint: fp,
            });

            set({
                identityPrivateKey: keyPair.privateKey,
                identityPublicKeyJwk: pubJwk,
                identityFingerprint: fp,
                cryptoState: CryptoState.ENCRYPTED,
            });

            devLog("NEW IDENTITY KEYPAIR GENERATED", { fingerprint: fp });
        } catch (error) {
            devError("IDENTITY KEY SETUP FAILED", { name: error?.name, message: error?.message });
            set({ cryptoState: CryptoState.KEY_SETUP });
        }
    },

    fetchFriendPublicKey: async (userId) => {
        const { friendsPublicKeys } = get();
        if (friendsPublicKeys[userId]) {
            devLog("FRIEND KEY CACHED", { userId });
            return friendsPublicKeys[userId];
        }

        devLog("FETCHING FRIEND PUBLIC KEY", { userId });

        try {
            const res = await axiosInstance.get(`/users/${userId}/public-key`);
            const keyData = res.data;

            devLog("FRIEND KEY RECEIVED", {
                userId,
                hasPublicKey: Boolean(keyData.publicKey),
                publicKeyType: typeof keyData.publicKey,
                publicKeyPreview: typeof keyData.publicKey === "string"
                    ? keyData.publicKey.slice(0, 60) + "..."
                    : typeof keyData.publicKey,
                fingerprint: keyData.fingerprint,
            });

            set((state) => ({
                friendsPublicKeys: {
                    ...state.friendsPublicKeys,
                    [userId]: keyData,
                },
            }));

            return keyData;
        } catch (error) {
            devError("FRIEND KEY FETCH FAILED", {
                userId,
                status: error.response?.status,
                message: error.response?.data?.message || error.message,
            });
            if (error.response?.status === 404) {
                set({ cryptoState: CryptoState.SESSION_REQUIRED });
            }
            return null;
        }
    },

    getOrCreateSessionKey: async (friendUserId, conversationId) => {
        const { sessionKeys, identityPrivateKey } = get();

        if (sessionKeys[conversationId]) {
            devLog("SESSION KEY FROM MEMORY", { conversationId });
            return sessionKeys[conversationId];
        }

        let cached = null;
        try {
            cached = await loadSessionKey(conversationId);
        } catch {
            // ignore
        }

        if (cached) {
            set((state) => ({
                sessionKeys: { ...state.sessionKeys, [conversationId]: cached },
            }));
            devLog("SESSION KEY FROM INDEXEDDB", { conversationId });
            return cached;
        }

        if (!identityPrivateKey) {
            devError("NO IDENTITY PRIVATE KEY", { cryptoState: get().cryptoState });
            set({ cryptoState: CryptoState.KEY_SETUP });
            return null;
        }

        devLog("DERIVING NEW SESSION KEY", { conversationId, friendUserId });

        const friendKeyData = await get().fetchFriendPublicKey(friendUserId);
        if (!friendKeyData?.publicKey) {
            devError("FRIEND PUBLIC KEY MISSING OR INVALID", {
                friendUserId,
                friendKeyData,
            });
            set({ cryptoState: CryptoState.SESSION_REQUIRED });
            return null;
        }

        try {
            devLog("IMPORTING FRIEND PUBLIC KEY FOR ECDH", {
                friendUserId,
                publicKeyType: typeof friendKeyData.publicKey,
                publicKeyPreview: typeof friendKeyData.publicKey === "string"
                    ? friendKeyData.publicKey.slice(0, 60) + "..."
                    : "non-string",
            });

            const sessionKey = await deriveSessionKey(
                identityPrivateKey,
                friendKeyData.publicKey,
                conversationId
            );

            set((state) => ({
                sessionKeys: { ...state.sessionKeys, [conversationId]: sessionKey },
                cryptoState: CryptoState.ENCRYPTED,
            }));

            devLog("SESSION KEY DERIVED SUCCESSFULLY", { conversationId });

            await storeSessionKey(conversationId, sessionKey).catch(() => {});

            return sessionKey;
        } catch (error) {
            devError("SESSION KEY DERIVATION FAILED", {
                name: error?.name,
                message: error?.message,
                conversationId,
                friendUserId,
            });
            set({ cryptoState: CryptoState.ENCRYPTION_FAILED });
            return null;
        }
    },

    encryptOutgoing: async (plaintext, friendUserId, conversationId, sequenceNumber) => {
        devLog("ENCRYPT OUTGOING START", { friendUserId, conversationId, sequenceNumber });

        const sessionKey = await get().getOrCreateSessionKey(friendUserId, conversationId);
        if (!sessionKey) {
            devError("ENCRYPT ABORTED: NO SESSION KEY", { friendUserId, conversationId });
            return null;
        }

        const messageId = generateMessageId();
        const authUser = useAuthStore.getState().authUser;

        devLog("ENCRYPT METADATA", {
            messageId,
            conversationId,
            senderId: authUser?._id,
            recipientId: friendUserId,
            sequenceNumber: sequenceNumber || 0,
            protocolVersion: PROTOCOL_VERSION,
        });

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

            devLog("ENCRYPT SUCCESS", {
                ciphertextLength: result.ciphertext?.length,
                ivLength: result.iv?.length,
                messageId,
            });

            return {
                encryptedText: result.ciphertext,
                iv: result.iv,
                messageId,
                sequenceNumber: sequenceNumber || 0,
                protocolVersion: PROTOCOL_VERSION,
            };
        } catch (error) {
            devError("ENCRYPT FAILED", {
                name: error?.name,
                message: error?.message,
            });
            return null;
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

        devLog("DECRYPT INCOMING", {
            messageId: message.clientMessageId || message._id,
            conversationId,
            senderId: message.senderId,
            receiverId: message.receiverId,
            sequenceNumber: message.sequenceNumber,
            protocolVersion: message.protocolVersion,
        });

        const sessionKey = await get().getOrCreateSessionKey(
            message.senderId === authUser._id ? message.receiverId : message.senderId,
            conversationId
        );

        if (!sessionKey) {
            devError("DECRYPT ABORTED: NO SESSION KEY", { messageId: message._id });
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
            devLog("DECRYPT SUCCESS", { messageId: message.clientMessageId || message._id });
            return plaintext;
        } catch (error) {
            devError("DECRYPT FAILED", {
                name: error?.name,
                message: error?.message,
                messageId: message.clientMessageId || message._id,
            });
            return null;
        }
    },

    decryptMessages: async (messages) => {
        const results = [];
        for (const msg of messages) {
            if (msg.encryptedText && msg.iv) {
                const plaintext = await get().decryptIncoming(msg);
                results.push({ ...msg, text: plaintext ?? "🔒 Could not decrypt this message." });
            } else {
                results.push(msg);
            }
        }
        return results;
    },
}));
