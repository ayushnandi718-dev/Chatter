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
} from "../lib/crypto";
import { CryptoState, PROTOCOL_VERSION } from "../lib/crypto-states";

export const useCryptoStore = create((set, get) => ({
    identityPrivateKey: null,
    identityPublicKeyJwk: null,
    identityFingerprint: "",
    cryptoState: CryptoState.KEY_SETUP,
    sessionKeys: {},
    friendsPublicKeys: {},

    ensureIdentityKey: async () => {
        const { identityPrivateKey } = get();
        if (identityPrivateKey) return;

        try {
            const stored = await loadIdentityPrivateKey();

            if (stored?.privateKey && stored?.publicJwk) {
                const fp = await fingerprintPublicKey(stored.publicJwk);
                set({
                    identityPrivateKey: stored.privateKey,
                    identityPublicKeyJwk: stored.publicJwk,
                    identityFingerprint: fp,
                    cryptoState: CryptoState.ENCRYPTED,
                });

                await axiosInstance.post("/users/upload-public-key", {
                    publicKey: stored.publicJwk,
                    fingerprint: fp,
                }).catch(() => {});

                return;
            }

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
        } catch (error) {
            console.error("Failed to ensure identity key:", error);
            set({ cryptoState: CryptoState.KEY_SETUP });
        }
    },

    fetchFriendPublicKey: async (userId) => {
        const { friendsPublicKeys } = get();
        if (friendsPublicKeys[userId]) return friendsPublicKeys[userId];

        try {
            const res = await axiosInstance.get(`/users/${userId}/public-key`);
            const keyData = res.data;

            set((state) => ({
                friendsPublicKeys: {
                    ...state.friendsPublicKeys,
                    [userId]: keyData,
                },
            }));

            return keyData;
        } catch (error) {
            if (error.response?.status === 404) {
                set({ cryptoState: CryptoState.SESSION_REQUIRED });
            }
            return null;
        }
    },

    getOrCreateSessionKey: async (friendUserId, conversationId) => {
        const { sessionKeys, identityPrivateKey, friendsPublicKeys } = get();

        if (sessionKeys[conversationId]) {
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
            return cached;
        }

        if (!identityPrivateKey) {
            set({ cryptoState: CryptoState.KEY_SETUP });
            return null;
        }

        const friendKeyData = friendsPublicKeys[friendUserId] || await get().fetchFriendPublicKey(friendUserId);
        if (!friendKeyData?.publicKey) {
            set({ cryptoState: CryptoState.SESSION_REQUIRED });
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
            }));

            await storeSessionKey(conversationId, sessionKey).catch(() => {});

            return sessionKey;
        } catch (error) {
            console.error("Failed to derive session key:", error);
            set({ cryptoState: CryptoState.ENCRYPTION_FAILED });
            return null;
        }
    },

    encryptOutgoing: async (plaintext, friendUserId, conversationId, sequenceNumber) => {
        const sessionKey = await get().getOrCreateSessionKey(friendUserId, conversationId);
        if (!sessionKey) return null;

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

        const result = await encryptMessage(sessionKey, plaintext, aad);
        return {
            encryptedText: result.ciphertext,
            iv: result.iv,
            messageId,
            sequenceNumber: sequenceNumber || 0,
            protocolVersion: PROTOCOL_VERSION,
        };
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

        const sessionKey = await get().getOrCreateSessionKey(
            message.senderId === authUser._id ? message.receiverId : message.senderId,
            conversationId
        );

        if (!sessionKey) {
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
            return plaintext;
        } catch (error) {
            console.error("Decryption failed:", error);
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
