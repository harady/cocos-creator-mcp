const { createApp } = require("vue");

const panelDataMap = new WeakMap<any, any>();

module.exports = Editor.Panel.define({
    template: `
<div id="app">
    <h2>Cocos Creator MCP</h2>
    <div class="status">
        <span>Status: <strong :class="running ? 'on' : 'off'">{{ running ? 'Running' : 'Stopped' }}</strong></span>
    </div>
    <div class="port-row">
        <label>Port:</label>
        <input type="number" v-model.number="editPort" :disabled="running" min="1024" max="65535" />
        <ui-button v-if="!running && editPort !== port" @confirm="applyPort" class="small-btn">Apply</ui-button>
    </div>
    <div class="actions">
        <ui-button v-if="!running" @confirm="start">Start Server</ui-button>
        <ui-button v-if="running" @confirm="stop">Stop Server</ui-button>
    </div>
    <div v-if="running" class="info">
        <p>Endpoint: <code>http://127.0.0.1:{{ port }}/mcp</code></p>
        <p>Tools: <strong>{{ toolCount }}</strong></p>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
</div>
    `,
    style: `
#app { padding: 12px; font-family: sans-serif; color: #ccc; }
h2 { margin: 0 0 8px 0; font-size: 16px; }
.status { margin: 8px 0; }
.on { color: #4f4; }
.off { color: #f66; }
.port-row { margin: 8px 0; display: flex; align-items: center; gap: 8px; }
.port-row label { font-size: 12px; }
.port-row input { width: 80px; padding: 3px 6px; background: #222; color: #ccc; border: 1px solid #444; border-radius: 3px; font-size: 12px; }
.port-row input:disabled { opacity: 0.5; }
.actions { margin: 8px 0; }
.info { margin: 8px 0; padding: 8px; background: var(--color-normal-fill-emphasis); border-radius: 4px; }
.info p { margin: 4px 0; font-size: 12px; }
.info code { background: #333; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
.error { margin: 8px 0; color: #f66; font-size: 12px; }
    `,
    $: { app: "#app" },
    ready() {
        if (!this.$.app) return;
        const app = createApp({
            data() {
                return {
                    running: false,
                    port: 3000,
                    editPort: 3000,
                    toolCount: 0,
                    error: "",
                };
            },
            methods: {
                async start(this: any) {
                    try {
                        this.error = "";
                        const result = await Editor.Message.request("cocos-creator-mcp", "start-server");
                        this.running = result.running;
                        this.port = result.port;
                        this.editPort = result.port;
                        await this.refresh();
                    } catch (e: any) {
                        this.error = e.message || String(e);
                    }
                },
                async stop(this: any) {
                    try {
                        await Editor.Message.request("cocos-creator-mcp", "stop-server");
                        this.running = false;
                        this.toolCount = 0;
                    } catch (e: any) {
                        this.error = e.message || String(e);
                    }
                },
                async applyPort(this: any) {
                    try {
                        this.error = "";
                        const result = await Editor.Message.request("cocos-creator-mcp", "update-port", this.editPort);
                        this.port = result.port;
                        this.running = result.running;
                        if (this.running) await this.refresh();
                    } catch (e: any) {
                        this.error = e.message || String(e);
                    }
                },
                async refresh(this: any) {
                    try {
                        const status = await Editor.Message.request("cocos-creator-mcp", "get-server-status");
                        this.running = status.running;
                        this.port = status.port;
                        this.editPort = status.port;
                        this.toolCount = status.toolCount;
                    } catch (e: any) {
                        console.warn("[cocos-creator-mcp] refresh failed:", e);
                    }
                },
            },
            async mounted(this: any) {
                try {
                    await this.refresh();
                } catch (e) {
                    console.warn("[cocos-creator-mcp] mounted refresh failed:", e);
                }
            },
        });
        app.mount(this.$.app);
        panelDataMap.set(this, app);
    },
    close() {
        const app = panelDataMap.get(this);
        if (app) app.unmount();
    },
});
