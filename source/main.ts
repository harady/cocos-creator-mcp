import { McpServer } from "./mcp-server";
import { SceneTools } from "./tools/scene-tools";
import { NodeTools } from "./tools/node-tools";
import { ServerConfig, DEFAULT_CONFIG } from "./types";
import path from "path";
import fs from "fs";

let server: McpServer | null = null;

function getSettingsPath(): string {
    return path.join(Editor.Project.path, "settings", "cocos-creator-mcp.json");
}

function loadConfig(): ServerConfig {
    try {
        const p = getSettingsPath();
        if (fs.existsSync(p)) {
            const data = JSON.parse(fs.readFileSync(p, "utf-8"));
            return { ...DEFAULT_CONFIG, ...data };
        }
    } catch (e) {
        console.warn("[cocos-creator-mcp] Failed to load settings, using defaults");
    }
    return { ...DEFAULT_CONFIG };
}

function saveConfig(config: ServerConfig): void {
    try {
        const p = getSettingsPath();
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(p, JSON.stringify(config, null, 2), "utf-8");
    } catch (e) {
        console.error("[cocos-creator-mcp] Failed to save settings:", e);
    }
}

function createServer(config: ServerConfig): McpServer {
    const s = new McpServer(config);
    s.register(new SceneTools());
    s.register(new NodeTools());
    return s;
}

export const methods: Record<string, (...args: any[]) => any> = {
    openPanel() {
        Editor.Panel.open("cocos-creator-mcp");
    },

    async startServer() {
        if (server?.isRunning) return { running: true, port: server.port };
        const config = loadConfig();
        server = createServer(config);
        await server.start();
        return { running: true, port: server.port };
    },

    async stopServer() {
        if (server) {
            await server.stop();
            server = null;
        }
        return { running: false };
    },

    getServerStatus() {
        return {
            running: server?.isRunning ?? false,
            port: server?.port ?? loadConfig().port,
            toolCount: server?.getAllTools().length ?? 0,
        };
    },
};

export async function load() {
    console.log("[cocos-creator-mcp] Extension loaded");
    const config = loadConfig();
    server = createServer(config);

    if (config.autoStart) {
        try {
            await server.start();
            console.log(`[cocos-creator-mcp] Auto-started on port ${config.port}`);
        } catch (e) {
            console.error("[cocos-creator-mcp] Auto-start failed:", e);
        }
    }
}

export async function unload() {
    if (server) {
        await server.stop();
        server = null;
    }
    console.log("[cocos-creator-mcp] Extension unloaded");
}
