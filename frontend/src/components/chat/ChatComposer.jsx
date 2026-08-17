import { useState, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSoundStore } from "../../store/useSoundStore";
import { Send, Image, X, Loader2, Video, Plus } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function ChatComposer() {
    const [text, setText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);

    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const sendMessage = useChatStore((state) => state.sendMessage);
    const isSendingMedia = useChatStore((state) => state.isSendingMedia);
    const selectedUser = useChatStore((state) => state.selectedUser);
    const playKeystrokeSound = useSoundStore((state) => state.playKeystrokeSound);
    const sendTyping = useChatStore((state) => state.sendTyping);
    const sendStopTyping = useChatStore((state) => state.sendStopTyping);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.error("File size must be under 25MB");
            return;
        }

        const isImg = file.type.startsWith("image/");
        const isVid = file.type.startsWith("video/");

        if (!isImg && !isVid) {
            toast.error("Only images and videos are supported");
            return;
        }

        setSelectedFile(file);
        setIsVideo(isVid);
        setFilePreview(URL.createObjectURL(file));
    };

    const handleRemoveFile = () => {
        if (filePreview) URL.revokeObjectURL(filePreview);
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if ((!text.trim() && !selectedFile) || isSendingMedia) return;

        try {
            if (selectedFile) {
                const formData = new FormData();
                if (text.trim()) formData.append("text", text.trim());
                formData.append("file", selectedFile);
                await sendMessage(formData);
            } else {
                await sendMessage({ text: text.trim() });
            }

            setText("");
            handleRemoveFile();
            if (selectedUser?._id) sendStopTyping(selectedUser._id);
        } catch (error) {
            // error handled by store
        }
    };

    const handleKeyDown = (e) => {
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

    return (
        <div className="px-3 pb-3 pt-1 safe-area-bottom" style={{ background: 'var(--bg-chat)' }}>
            {filePreview && (
                <div className="mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2"
                     style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md flex items-center justify-center"
                         style={{ background: 'var(--bg-elevated)' }}>
                        {isVideo ? (
                            <Video className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                        ) : (
                            <img src={filePreview} alt="" className="h-full w-full object-cover" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate"
                           style={{ color: 'var(--text-primary)' }}>
                            {selectedFile?.name}
                        </p>
                        <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                            {(selectedFile?.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                    </div>
                    <button onClick={handleRemoveFile}
                            className="h-5 w-5 flex items-center justify-center rounded-full transition-colors"
                            style={{ color: 'var(--text-muted)' }}>
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-1.5">
                <input type="file"
                       ref={fileInputRef}
                       onChange={handleFileChange}
                       accept="image/*,video/*"
                       className="hidden" />

                <button type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Attach">
                    <Plus className="h-4 w-4" />
                </button>

                <div className="relative flex-1">
                    <textarea ref={textareaRef}
                              value={text}
                              onChange={handleTextChange}
                              onKeyDown={handleKeyDown}
                              placeholder="Type a message..."
                              rows={1}
                              className="w-full resize-none rounded-lg px-3 py-2 text-xs outline-none transition-colors"
                              style={{
                                  background: 'var(--bg-surface)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--border)',
                              }}
                              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                              maxLength={4000} />
                </div>

                <button type="submit"
                        disabled={(!text.trim() && !selectedFile) || isSendingMedia}
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
