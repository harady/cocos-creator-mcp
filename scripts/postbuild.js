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
