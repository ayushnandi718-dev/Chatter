import ImageKit, { toFile } from "@imagekit/nodejs";

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
const imagekit = new ImageKit({ privateKey });

function hasImageKitConfig() {
    return Boolean(privateKey);
}

function createFileName(originalName = "upload") {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `chat-${Date.now()}-${safeName}`;
}

/**
 * Upload image or video buffer directly to ImageKit
 */
async function uploadChatMedia(file) {
    const fileName = createFileName(file.originalname);

    const result = await imagekit.files.upload({
        file: await toFile(file.buffer, fileName, { type: file.mimetype }),
        fileName,
        folder: "/chat",
    });

    return result.url;
}

export { uploadChatMedia, hasImageKitConfig };