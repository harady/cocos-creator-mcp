const { createApp } = require("vue");

const panelDataMap = new WeakMap<any, any>();

module.exports = Editor.Panel.define({
    template: `
<div id="app">
    <h2>Cocos Creator MCP</h2>
    <div class="status">
        <span>Status: <strong :class="running ? 'on' : 'off'">{{ running ? 'Running' : 'Stopped' }}</strong></span>
        <span v-if="running"> (port {{ port }})</span>
    </div>
    <div class="actions">
        <ui-button v-if="!running" @confirm="start">Start Server</ui-button>
        <ui-button v-if="running" @confirm="stop">Stop Server</ui-button>
    </div>
    <div v-if="running" class="info">
        <p>Endpoint: <code>http://127.0.0.1:{{ port }}/mcp</code></p>
        <p>Tools: <strong>{{ toolCount }}</strong>
            <span class="toggle" @click="showTools = !showTools">{{ showTools ? 'Hide' : 'Show' }}</span>
        </p>
    </div>
    <div v-if="running && showTools" class="tool-list">
        <div class="tool-search">
            <input type="text" v-model="search" placeholder="Search tools..." />
        </div>
        <div class="tool-categories">
            <div v-for="(tools, cat) in filteredTools" :key="cat" class="category">
                <div class="cat-name">{{ cat }} ({{ tools.length }})</div>
                <div v-for="t in tools" :key="t" class="tool-name">{{ t }}</div>
            </div>
        </div>
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
.actions { margin: 8px 0; }
.info { margin: 8px 0; padding: 8px; background: var(--color-normal-fill-emphasis); border-radius: 4px; }
.info p { margin: 4px 0; font-size: 12px; }
.info code { background: #333; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
.toggle { margin-left: 8px; color: #6af; cursor: pointer; font-size: 11px; }
.toggle:hover { text-decoration: underline; }
.error { margin: 8px 0; color: #f66; font-size: 12px; }
.tool-list { margin: 8px 0; max-height: 300px; overflow-y: auto; }
.tool-search input { width: 100%; padding: 4px 8px; background: #222; color: #ccc; border: 1px solid #444; border-radius: 3px; font-size: 12px; box-sizing: border-box; }
.category { margin: 6px 0; }
.cat-name { font-size: 11px; color: #8af; font-weight: bold; margin-bottom: 2px; }
.tool-name { font-size: 11px; color: #aaa; padding: 1px 0 1px 12px; }
    `,
    $: { app: "#app" },
    ready() {
        if (!this.$.app) return;
        const app = createApp({
            data() {
                return {
                    running: false,
                    port: 3000,
                    toolCount: 0,
                    error: "",
                    showTools: false,
                    search: "",
                    toolNames: [] as string[],
                };
            },
            computed: {
                filteredTools(this: any) {
                    const grouped: Record<string, string[]> = {};
                    const q = this.search.toLowerCase();
                    for (const name of this.toolNames) {
                        if (q && !name.includes(q)) continue;
                        const cat = name.split("_")[0];
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(name);
                    }
                    return grouped;
                },
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
                        this.toolNames = [];
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
                        this.toolNames = status.toolNames || [];
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
