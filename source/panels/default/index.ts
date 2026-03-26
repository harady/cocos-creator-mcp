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
</div>
    `,
    style: `
#app { padding: 12px; font-family: sans-serif; }
.status { margin: 12px 0; }
.actions { margin: 12px 0; }
.info { margin: 12px 0; padding: 8px; background: var(--color-normal-fill-emphasis); border-radius: 4px; }
.info p { margin: 4px 0; }
    `,
    $: { app: "#app" },
    ready() {
        if (!this.$.app) return;
        const app = createApp({
            data() {
                return { running: false, port: 3001, toolCount: 0 };
            },
            methods: {
                async start(this: any) {
                    const result = await Editor.Message.request("cocos-creator-mcp", "start-server");
                    this.running = result.running;
                    this.port = result.port;
                    await this.refresh();
                },
                async stop(this: any) {
                    await Editor.Message.request("cocos-creator-mcp", "stop-server");
                    this.running = false;
                    this.toolCount = 0;
                },
                async refresh(this: any) {
                    const status = await Editor.Message.request("cocos-creator-mcp", "get-server-status");
                    this.running = status.running;
                    this.port = status.port;
                    this.toolCount = status.toolCount;
                },
            },
            async mounted() {
                await this.refresh();
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
