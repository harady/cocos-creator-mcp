"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveOldFiles = archiveOldFiles;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const HOURS_24 = 24 * 60 * 60 * 1000;
/**
 * 24時間以上前のファイルを OLD_yyyyMM フォルダに移動する.
 */
function archiveOldFiles(dir) {
    try {
        let files;
        try {
            files = fs_1.default.readdirSync(dir);
        }
        catch (_a) {
            return;
        }
        const now = Date.now();
        let archived = 0;
        for (const file of files) {
            const filePath = path_1.default.join(dir, file);
            const stat = fs_1.default.statSync(filePath);
            if (stat.isDirectory())
                continue;
            if (now - stat.mtimeMs < HOURS_24)
                continue;
            const fileDate = new Date(stat.mtimeMs);
            const yyyy = fileDate.getFullYear();
            const mm = String(fileDate.getMonth() + 1).padStart(2, "0");
            const archiveDir = path_1.default.join(dir, `OLD_${yyyy}${mm}`);
            fs_1.default.mkdirSync(archiveDir, { recursive: true });
            fs_1.default.renameSync(filePath, path_1.default.join(archiveDir, file));
            archived++;
        }
        if (archived > 0) {
            console.log(`[cocos-creator-mcp] ${archived}件のファイルを月別フォルダにアーカイブ (${dir})`);
        }
    }
    catch (e) {
        console.warn("[cocos-creator-mcp] アーカイブ失敗:", e);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJjaGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9hcmNoaXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBUUEsMENBbUNDO0FBM0NELDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsTUFBTSxRQUFRLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBRXJDOztHQUVHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLEdBQVc7SUFDdkMsSUFBSSxDQUFDO1FBQ0QsSUFBSSxLQUFlLENBQUM7UUFDcEIsSUFBSSxDQUFDO1lBQ0QsS0FBSyxHQUFHLFlBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUFDLFdBQU0sQ0FBQztZQUNMLE9BQU87UUFDWCxDQUFDO1FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQztRQUVqQixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLFlBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFbkMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUFFLFNBQVM7WUFDakMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRO2dCQUFFLFNBQVM7WUFFNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUQsTUFBTSxVQUFVLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0RCxZQUFFLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRTlDLFlBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckQsUUFBUSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixRQUFRLHdCQUF3QixHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQy9FLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSBcImZzXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcblxyXG5jb25zdCBIT1VSU18yNCA9IDI0ICogNjAgKiA2MCAqIDEwMDA7XHJcblxyXG4vKipcclxuICogMjTmmYLplpPku6XkuIrliY3jga7jg5XjgqHjgqTjg6vjgpIgT0xEX3l5eXlNTSDjg5Xjgqnjg6vjg4Djgavnp7vli5XjgZnjgosuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYXJjaGl2ZU9sZEZpbGVzKGRpcjogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGxldCBmaWxlczogc3RyaW5nW107XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyhkaXIpO1xyXG4gICAgICAgIH0gY2F0Y2gge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIGxldCBhcmNoaXZlZCA9IDA7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xyXG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZmlsZVBhdGgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkgY29udGludWU7XHJcbiAgICAgICAgICAgIGlmIChub3cgLSBzdGF0Lm10aW1lTXMgPCBIT1VSU18yNCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmaWxlRGF0ZSA9IG5ldyBEYXRlKHN0YXQubXRpbWVNcyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHl5eXkgPSBmaWxlRGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICBjb25zdCBtbSA9IFN0cmluZyhmaWxlRGF0ZS5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgXCIwXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBhcmNoaXZlRGlyID0gcGF0aC5qb2luKGRpciwgYE9MRF8ke3l5eXl9JHttbX1gKTtcclxuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGFyY2hpdmVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgZnMucmVuYW1lU3luYyhmaWxlUGF0aCwgcGF0aC5qb2luKGFyY2hpdmVEaXIsIGZpbGUpKTtcclxuICAgICAgICAgICAgYXJjaGl2ZWQrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcmNoaXZlZCA+IDApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFtjb2Nvcy1jcmVhdG9yLW1jcF0gJHthcmNoaXZlZH3ku7bjga7jg5XjgqHjgqTjg6vjgpLmnIjliKXjg5Xjgqnjg6vjg4DjgavjgqLjg7zjgqvjgqTjg5YgKCR7ZGlyfSlgKTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKFwiW2NvY29zLWNyZWF0b3ItbWNwXSDjgqLjg7zjgqvjgqTjg5blpLHmlZc6XCIsIGUpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==