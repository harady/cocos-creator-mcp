const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

// dist/ 配下の全 .js ファイルの内容からハッシュを生成
// コードが同じなら常に同じ値になる
const distDir = path.join(__dirname, "..", "dist");
const hash = crypto.createHash("sha256");

const jsFiles = fs.readdirSync(distDir)
    .filter(f => f.endsWith(".js"))
    .sort(); // 順序を安定させる

for (const file of jsFiles) {
    const content = fs.readFileSync(path.join(distDir, file), "utf8");
    // __BUILD_HASH__ プレースホルダーは除外して計算（自己参照を避ける）
    hash.update(content.replace(/__BUILD_HASH__/g, ""));
}

const buildHash = hash.digest("hex").substring(0, 12);

// mcp-server.js にハッシュを埋め込む
const serverFile = path.join(distDir, "mcp-server.js");
const serverContent = fs.readFileSync(serverFile, "utf8");
fs.writeFileSync(serverFile, serverContent.replace("__BUILD_HASH__", buildHash));

// package.json の description にハッシュを付与
const pkgFile = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
const baseDesc = pkg.description.replace(/\s*\[[a-f0-9]+\]$/, ""); // 既存ハッシュを除去
pkg.description = `${baseDesc} [${buildHash}]`;
fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 4) + "\n");

console.log("BUILD_HASH:", buildHash);

// ── dist自動同期: ゲームプロジェクトの extensions/ にコピー ──
// SYNC_TARGET 環境変数 or settings ファイルで同期先を指定
const settingsFile = path.join(__dirname, "..", "sync-targets.json");
let syncTargets = [];

if (process.env.SYNC_TARGET) {
    syncTargets = process.env.SYNC_TARGET.split(",").map(s => s.trim());
} else if (fs.existsSync(settingsFile)) {
    syncTargets = JSON.parse(fs.readFileSync(settingsFile, "utf8")).targets || [];
}

if (syncTargets.length > 0) {
    const rootDir = path.join(__dirname, "..");
    const filesToSync = ["dist", "client", "i18n", "static", "package.json", "package-lock.json"];

    for (const target of syncTargets) {
        const targetDir = path.resolve(target);
        if (!fs.existsSync(path.dirname(targetDir))) {
            console.warn(`SYNC SKIP: parent dir not found: ${targetDir}`);
            continue;
        }
        console.log(`SYNC: ${targetDir}`);
        for (const entry of filesToSync) {
            const src = path.join(rootDir, entry);
            const dst = path.join(targetDir, entry);
            if (!fs.existsSync(src)) continue;
            if (fs.statSync(src).isDirectory()) {
                copyDirSync(src, dst);
            } else {
                fs.mkdirSync(path.dirname(dst), { recursive: true });
                fs.copyFileSync(src, dst);
            }
        }
        console.log(`SYNC DONE: ${targetDir}`);
    }
} else {
    console.log("SYNC: no targets configured (set SYNC_TARGET or create sync-targets.json)");
}

function copyDirSync(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const dstPath = path.join(dst, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, dstPath);
        } else {
            fs.copyFileSync(srcPath, dstPath);
        }
    }
}
