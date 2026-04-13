/**
 * Shared screenshot utility — used by debug-tools and other tools that need screenshots.
 */

export interface ProcessedImage {
    buffer: Buffer;
    width: number;
    height: number;
    format: string;
}

export interface ScreenshotResult {
    success: boolean;
    path: string;
    size: number;
    format: string;
    originalSize: string;
    savedSize: string;
}

export async function processImage(pngBuffer: Buffer, maxWidth: number, desiredFormat?: string): Promise<ProcessedImage> {
    try {
        const Vips = require("wasm-vips");
        const vips = await Vips();
        let image = vips.Image.newFromBuffer(pngBuffer);
        if (maxWidth > 0 && image.width > maxWidth) {
            image = image.thumbnailImage(maxWidth);
        }
        if (desiredFormat === "png") {
            const pngOut = image.pngsaveBuffer();
            const result = { buffer: Buffer.from(pngOut), width: image.width, height: image.height, format: "png" };
            image.delete();
            return result;
        }
        const outBuf = image.webpsaveBuffer({ Q: 85 });
        const result = { buffer: Buffer.from(outBuf), width: image.width, height: image.height, format: "webp" };
        image.delete();
        return result;
    } catch {
        // Fallback: NativeImage resize + JPEG
        const electron = require("electron");
        let image = electron.nativeImage.createFromBuffer(pngBuffer);
        if (maxWidth > 0) {
            const size = image.getSize();
            if (size.width > maxWidth) {
                const ratio = maxWidth / size.width;
                image = image.resize({ width: Math.round(size.width * ratio), height: Math.round(size.height * ratio) });
            }
        }
        const size = image.getSize();
        const buffer = image.toJPEG(85);
        return { buffer, width: size.width, height: size.height, format: "jpeg" };
    }
}

export async function takeEditorScreenshot(savePath?: string | undefined, maxWidth?: number): Promise<ScreenshotResult> {
    const fs = require("fs");
    const path = require("path");
    const electron = require("electron");
    const windows = electron.BrowserWindow.getAllWindows();
    if (!windows || windows.length === 0) {
        throw new Error("No editor window found");
    }
    // Find the main (largest) window
    let win = windows[0];
    let maxArea = 0;
    for (const w of windows) {
        const bounds = w.getBounds();
        const area = bounds.width * bounds.height;
        if (area > maxArea) {
            maxArea = area;
            win = w;
        }
    }
    // Bring to front and wait for render
    win.show();
    await new Promise(r => setTimeout(r, 300));
    const nativeImage = await win.webContents.capturePage();
    const originalSize = nativeImage.getSize();
    const pngBuffer = nativeImage.toPNG();

    const effectiveMaxWidth = maxWidth !== undefined ? maxWidth : 960;
    const { buffer, width, height, format } = await processImage(pngBuffer, effectiveMaxWidth);

    const ext = format === "webp" ? "webp" : format === "jpeg" ? "jpg" : "png";
    if (!savePath) {
        const dir = path.join(Editor.Project.tmpDir, "screenshots");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        savePath = path.join(dir, `screenshot_${timestamp}.${ext}`);
    }

    const finalPath = savePath!;
    fs.writeFileSync(finalPath, buffer);
    return {
        success: true, path: finalPath, size: buffer.length, format,
        originalSize: `${originalSize.width}x${originalSize.height}`,
        savedSize: `${width}x${height}`,
    };
}
