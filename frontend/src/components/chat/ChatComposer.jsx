import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSoundStore } from "../../store/useSoundStore";
import { useCryptoStore } from "../../store/useCryptoStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useFriendStore } from "../../store/useFriendStore";
import { CryptoState } from "../../lib/crypto-states";
import { Send, Image, X, Loader2, Video, Plus, Mic, FileText, StopCircle, AlertTriangle, Smile } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { ReplyPreview } from "./ReplyPreview";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ChatComposer({ onCancelReply }) {
    const [text, setText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [fileInfo, setFileInfo] = useState({ name: "", type: "", size: 0 });
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const fileInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordTimerRef = useRef(null);

    const sendMessage = useChatStore((state) => state.sendMessage);
    const isSendingMedia = useChatStore((state) => state.isSendingMedia);
    const selectedUser = useChatStore((state) => state.selectedUser);
    const playKeystrokeSound = useSoundStore((state) => state.playKeystrokeSound);
    const sendTyping = useChatStore((state) => state.sendTyping);
    const sendStopTyping = useChatStore((state) => state.sendStopTyping);
    const cryptoState = useCryptoStore((state) => state.cryptoState);
    const lastError = useCryptoStore((state) => state.lastError);
    const replyingTo = useChatStore((state) => state.replyingTo);

    const getSenderName = useCallback((senderId) => {
        const authUser = useAuthStore.getState().authUser;
        if (senderId === authUser?._id) return "You";
        const friends = useFriendStore.getState().friends;
        const f = friends.find((f) => f._id === senderId);
        if (f) return f.displayName || f.username;
        return "User";
    }, []);

    useEffect(() => {
        return () => {
            if (recordTimerRef.current) clearInterval(recordTimerRef.current);
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size must be under 25MB");
            return;
        }
        setSelectedFile(file);
        setFileInfo({ name: file.name, type: file.type, size: file.size });
        if (file.type.startsWith("image/")) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
        setShowAttachMenu(false);
    };

    const handleRemoveFile = () => {
        if (filePreview) URL.revokeObjectURL(filePreview);
        setSelectedFile(null);
        setFilePreview(null);
        setFileInfo({ name: "", type: "", size: 0 });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveAudio = () => {
        if (recordedBlob) URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
        setRecordedBlob(null);
        setRecordDuration(0);
    };

    const getSupportedMimeType = () => {
        const types = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4",
            "audio/ogg;codecs=opus",
            "audio/wav",
        ];
        for (const type of types) {
            if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return "";
    };

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast.error("Recording not supported in this browser");
            return;
        }

        try {
            const permissionStatus = await navigator.permissions?.query({ name: "microphone" });
            if (permissionStatus?.state === "denied") {
                toast.error("Microphone is blocked in browser settings. Allow it for this site and reload.");
                return;
            }
        } catch {
            // permissions.query not supported — proceed to getUserMedia
        }

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                toast.error("Microphone permission denied. Click the lock icon in the address bar and allow microphone access.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                toast.error("No microphone found. Connect a microphone and try again.");
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                toast.error("Microphone is in use by another app. Close other apps using the mic.");
            } else {
                toast.error("Could not access microphone: " + (err.message || err.name));
            }
            return;
        }

        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            stream.getTracks().forEach((t) => t.stop());
            toast.error("No supported audio format found in this browser");
            return;
        }

        try {
            const recorder = new MediaRecorder(stream, { mimeType });
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onerror = () => {
                stream.getTracks().forEach((t) => t.stop());
                setIsRecording(false);
                if (recordTimerRef.current) clearInterval(recordTimerRef.current);
                toast.error("Recording error occurred");
            };

            recorder.onstop = () => {
                const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "wav";
                const blob = new Blob(audioChunksRef.current, { type: mimeType.split(";")[0] });
                setRecordedBlob(blob);
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            setRecordDuration(0);
            setShowAttachMenu(false);

            recordTimerRef.current = setInterval(() => {
                setRecordDuration((d) => d + 1);
            }, 1000);
        } catch (err) {
            stream.getTracks().forEach((t) => t.stop());
            toast.error("Could not start recording: " + (err.message || err.name));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setIsRecording(false);
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setIsRecording(false);
        setRecordedBlob(null);
        setRecordDuration(0);
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (isSendingMedia) return;

        try {
            if (recordedBlob) {
                const audioFile = new File([recordedBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
                const formData = new FormData();
                formData.append("file", audioFile);
                await sendMessage(formData);
                handleRemoveAudio();
            } else if (selectedFile) {
                const formData = new FormData();
                if (text.trim()) formData.append("text", text.trim());
                formData.append("file", selectedFile);
                await sendMessage(formData);
                handleRemoveFile();
                setText("");
            } else if (text.trim()) {
                await sendMessage({ text: text.trim() });
                setText("");
            } else {
                return;
            }

            if (selectedUser?._id) sendStopTyping(selectedUser._id);
        } catch {
            // error handled by store
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape" && replyingTo) {
            e.preventDefault();
            if (onCancelReply) onCancelReply();
            return;
        }
        playKeystrokeSound();
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
        if (selectedUser?._id) {
            sendTyping(selectedUser._id);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => sendStopTyping(selectedUser._id), 2000);
        }
    };

    const isDesktop = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const handleDragOver = useCallback((e) => {
        if (!isDesktop) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, [isDesktop]);

    const handleDragLeave = useCallback((e) => {
        if (!isDesktop) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === e.target) {
            setIsDragOver(false);
        }
    }, [isDesktop]);

    const handleDrop = useCallback((e) => {
        if (!isDesktop) return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size must be under 25MB");
            return;
        }
        setSelectedFile(file);
        setFileInfo({ name: file.name, type: file.type, size: file.size });
        if (file.type.startsWith("image/")) {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    }, [isDesktop]);

    const hasContent = text.trim() || selectedFile || recordedBlob;

    const getFileIcon = (type) => {
        if (type?.startsWith("image/")) return <Image className="h-4 w-4" />;
        if (type?.startsWith("video/")) return <Video className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    };

    return (
        <div className="px-3 pb-3 pt-1 safe-area-bottom relative"
             style={{ background: 'var(--bg-chat)' }}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}>

            {isDragOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg"
                     style={{
                         background: 'rgba(0,0,0,0.5)',
                         border: '2px dashed var(--accent)',
                     }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        Drop files to send
                    </span>
                </div>
            )}
            {replyingTo && (
                <div className="mb-2">
                    <ReplyPreview
                        replyingTo={replyingTo}
                        senderName={getSenderName(replyingTo.senderId)}
                        onCancel={onCancelReply}
                    />
                </div>
            )}

            {/* Recording indicator */}
            {isRecording && (
                <div className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                     style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                        Recording {formatDuration(recordDuration)}
                    </span>
                    <div className="flex-1" />
                    <button onClick={cancelRecording}
                            className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                            style={{ color: 'var(--danger)' }}>
                        <X className="h-4 w-4" />
                    </button>
                    <button onClick={stopRecording}
                            className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                            style={{ background: 'var(--danger)', color: 'white' }}>
                        <StopCircle className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Recorded audio preview */}
            {recordedBlob && !isRecording && (
                <div className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2"
                     style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <div className="h-8 w-8 flex items-center justify-center rounded-lg shrink-0"
                         style={{ background: 'var(--accent-muted)' }}>
                        <Mic className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <audio src={URL.createObjectURL(recordedBlob)} controls className="h-8 flex-1" style={{ maxHeight: '32px' }} />
                    <button onClick={handleRemoveAudio}
                            className="h-6 w-6 flex items-center justify-center rounded-full"
                            style={{ color: 'var(--text-muted)' }}>
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* File preview */}
            {selectedFile && (
                <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2"
                     style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md flex items-center justify-center"
                         style={{ background: 'var(--bg-elevated)' }}>
                        {filePreview ? (
                            <img src={filePreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span style={{ color: 'var(--accent)' }}>{getFileIcon(fileInfo.type)}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {fileInfo.name}
                        </p>
                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                            {formatFileSize(fileInfo.size)}
                        </p>
                    </div>
                    <button onClick={handleRemoveFile}
                            className="h-5 w-5 flex items-center justify-center rounded-full"
                            style={{ color: 'var(--text-muted)' }}>
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {cryptoState !== CryptoState.ENCRYPTED && cryptoState !== CryptoState.KEY_SETUP && (
                <div className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2"
                     style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--danger)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--danger)' }}>
                        {lastError || "Encryption not available. Messages cannot be sent."}
                    </span>
                </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-1.5">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"
                       accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar,.csv,.xlsx,.pptx" />
                <input type="file" ref={audioInputRef} onChange={handleFileChange} className="hidden"
                       accept="audio/*" />

                {/* Emoji picker */}
                {showEmojiPicker && (
                    <div className="absolute bottom-full mb-2 left-12 z-50">
                        <EmojiPicker
                            onSelect={(emoji) => {
                                setText((prev) => prev + emoji);
                                textareaRef.current?.focus();
                            }}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    </div>
                )}

                {/* Attach button */}
                <div className="relative">
                    <button type="button"
                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                            style={{ color: showAttachMenu ? 'var(--accent)' : 'var(--text-muted)', background: showAttachMenu ? 'var(--accent-muted)' : 'transparent' }}
                            title="Attach">
                        <Plus className="h-4 w-4" />
                    </button>

                    {showAttachMenu && (
                        <div className="absolute bottom-full mb-2 left-0 w-44 rounded-lg py-1 z-50"
                             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <button onClick={() => { fileInputRef.current.accept = "image/*,video/*"; fileInputRef.current.click(); }}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <Image className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                                Photo / Video
                            </button>
                            <button onClick={() => { fileInputRef.current.accept = ".pdf,.doc,.docx,.txt,.zip,.rar,.csv,.xlsx,.pptx,.pdf"; fileInputRef.current.click(); }}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <FileText className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
                                Document
                            </button>
                            <button onClick={() => { startRecording(); }}
                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <Mic className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                                Voice Message
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative flex-1">
                    <textarea ref={textareaRef}
                              value={text}
                              onChange={handleTextChange}
                              onKeyDown={handleKeyDown}
                              placeholder={isRecording ? "Recording..." : "Type a message..."}
                              rows={1}
                              disabled={isRecording}
                              className="w-full resize-none rounded-lg px-3 py-2 text-xs outline-none transition-colors disabled:opacity-50"
                              style={{
                                  background: 'var(--bg-surface)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--border)',
                              }}
                              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                              maxLength={4000} />
                </div>

                <button type="button"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                        style={{ color: showEmojiPicker ? 'var(--accent)' : 'var(--text-muted)', background: showEmojiPicker ? 'var(--accent-muted)' : 'transparent' }}
                        title="Emoji">
                    <Smile className="h-4 w-4" />
                </button>

                <button type="submit"
                        disabled={!hasContent || isSendingMedia}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white transition-colors disabled:opacity-30"
                        style={{ background: 'var(--accent)' }}>
                    {isSendingMedia ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Send className="h-3.5 w-3.5" />
                    )}
                </button>
            </form>
        </div>
    );
}
