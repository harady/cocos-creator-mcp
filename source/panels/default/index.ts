const { createApp } = require("vue");

const panelDataMap = new WeakMap<any, any>();

module.exports = Editor.Panel.define({
    template: `
<div id="app">
    <h2>Cocos Creator MCP</h2>
    <div class="status">
        <span>Status: <strong>{{ running ? 'Running' : 'Stopped' }}</strong></span>
        <span v-if="running"> (port {{ port }})</span>
    </div>
    <div class="actions">
        <ui-button v-if="!running" @confirm="start">Start Server</ui-button>
        <ui-button v-if="running" @confirm="stop">Stop Server</ui-button>
    </div>
    <div v-if="running" class="info">
        <p>Tools: {{ toolCount }}</p>
        <p>Endpoint: http://127.0.0.1:{{ port }}/mcp</p>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
</div>
    `,
    style: `
#app { padding: 12px; font-family: sans-serif; color: #ccc; }
h2 { margin: 0 0 8px 0; font-size: 16px; }
.status { margin: 8px 0; }
.actions { margin: 8px 0; }
.info { margin: 8px 0; padding: 8px; background: var(--color-normal-fill-emphasis); border-radius: 4px; }
.info p { margin: 4px 0; font-size: 12px; }
.error { margin: 8px 0; color: #f66; font-size: 12px; }
    `,
    $: { app: "#app" },
    ready() {
        if (!this.$.app) return;
        const app = createApp({
            data() {
                return { running: false, port: 3001, toolCount: 0, error: "" };
            },
            methods: {
                async start(this: any) {
                    try {
                        this.error = "";
                        const result = await Editor.Message.request("cocos-creator-mcp", "start-server");
                        this.running = result.running;
                        this.port = result.port;
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
                async refresh(this: any) {
                    try {
                        const status = await Editor.Message.request("cocos-creator-mcp", "get-server-status");
                        this.running = status.running;
                        this.port = status.port;
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
