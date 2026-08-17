import { useState, useRef } from "react";
import { useChatStore } from "../../store/useChatStore";
import { useSoundStore } from "../../store/useSoundStore";
import { Send, Image, X, Loader2, Video } from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function ChatComposer() {
    const [text, setText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);

    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const sendMessage = useChatStore((state) => state.sendMessage);
    const isSendingMedia = useChatStore((state) => state.isSendingMedia);
    const playKeystrokeSound = useSoundStore((state) => state.playKeystrokeSound);

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

        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
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

            // Reset input
            setText("");
            handleRemoveFile();
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleKeyDown = (e) => {
        playKeystrokeSound();

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-3 border-t border-white/10 bg-slate-900/70 backdrop-blur-xl z-20">
            {/* Media Attachment Preview */}
            {filePreview && (
                <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-800/80 p-2 border border-white/10 backdrop-blur-md">
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                        {isVideo ? (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Video className="h-6 w-6" />
                            </div>
                        ) : (
                            <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{selectedFile?.name}</p>
                        <p className="text-[10px] text-slate-400">
                            {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                    </div>
                    <button
                        onClick={handleRemoveFile}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Input form */}
            <form onSubmit={handleSend} className="flex items-end gap-2">
                {/* File Attachment Input (Hidden) */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="hidden"
                />

                {/* File Trigger Button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    title="Attach Image or Video (Max 25MB)"
                >
                    <Image className="h-5 w-5" />
                </button>

                {/* Message Input Box */}
                <div className="relative flex-1">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all max-h-32"
                    />
                </div>

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={(!text.trim() && !selectedFile) || isSendingMedia}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isSendingMedia ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </button>
            </form>
        </div>
    );
}
