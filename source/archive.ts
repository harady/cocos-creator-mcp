import fs from "fs";
import path from "path";

const HOURS_24 = 24 * 60 * 60 * 1000;

/**
 * 24時間以上前のファイルを OLD_yyyyMM フォルダに移動する.
 */
export function archiveOldFiles(dir: string): void {
    try {
        let files: string[];
        try {
            files = fs.readdirSync(dir);
        } catch {
            return;
        }

        const now = Date.now();
        let archived = 0;

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) continue;
            if (now - stat.mtimeMs < HOURS_24) continue;

            const fileDate = new Date(stat.mtimeMs);
            const yyyy = fileDate.getFullYear();
            const mm = String(fileDate.getMonth() + 1).padStart(2, "0");
            const archiveDir = path.join(dir, `OLD_${yyyy}${mm}`);
            fs.mkdirSync(archiveDir, { recursive: true });

            fs.renameSync(filePath, path.join(archiveDir, file));
            archived++;
        }

        if (archived > 0) {
            console.log(`[cocos-creator-mcp] ${archived}件のファイルを月別フォルダにアーカイブ (${dir})`);
        }
    } catch (e) {
        console.warn("[cocos-creator-mcp] アーカイブ失敗:", e);
    }
}
