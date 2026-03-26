"use strict";
const { createApp } = require("vue");
const panelDataMap = new WeakMap();
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
        if (!this.$.app)
            return;
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
                async start() {
                    try {
                        this.error = "";
                        const result = await Editor.Message.request("cocos-creator-mcp", "start-server");
                        this.running = result.running;
                        this.port = result.port;
                        this.editPort = result.port;
                        await this.refresh();
                    }
                    catch (e) {
                        this.error = e.message || String(e);
                    }
                },
                async stop() {
                    try {
                        await Editor.Message.request("cocos-creator-mcp", "stop-server");
                        this.running = false;
                        this.toolCount = 0;
                    }
                    catch (e) {
                        this.error = e.message || String(e);
                    }
                },
                async applyPort() {
                    try {
                        this.error = "";
                        const result = await Editor.Message.request("cocos-creator-mcp", "update-port", this.editPort);
                        this.port = result.port;
                        this.running = result.running;
                        if (this.running)
                            await this.refresh();
                    }
                    catch (e) {
                        this.error = e.message || String(e);
                    }
                },
                async refresh() {
                    try {
                        const status = await Editor.Message.request("cocos-creator-mcp", "get-server-status");
                        this.running = status.running;
                        this.port = status.port;
                        this.editPort = status.port;
                        this.toolCount = status.toolCount;
                    }
                    catch (e) {
                        console.warn("[cocos-creator-mcp] refresh failed:", e);
                    }
                },
            },
            async mounted() {
                try {
                    await this.refresh();
                }
                catch (e) {
                    console.warn("[cocos-creator-mcp] mounted refresh failed:", e);
                }
            },
        });
        app.mount(this.$.app);
        panelDataMap.set(this, app);
    },
    close() {
        const app = panelDataMap.get(this);
        if (app)
            app.unmount();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFckMsTUFBTSxZQUFZLEdBQUcsSUFBSSxPQUFPLEVBQVksQ0FBQztBQUU3QyxNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFFBQVEsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBcUJUO0lBQ0QsS0FBSyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7S0FlTjtJQUNELENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUU7SUFDbEIsS0FBSztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFBRSxPQUFPO1FBQ3hCLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQztZQUNsQixJQUFJO2dCQUNBLE9BQU87b0JBQ0gsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsSUFBSSxFQUFFLElBQUk7b0JBQ1YsUUFBUSxFQUFFLElBQUk7b0JBQ2QsU0FBUyxFQUFFLENBQUM7b0JBQ1osS0FBSyxFQUFFLEVBQUU7aUJBQ1osQ0FBQztZQUNOLENBQUM7WUFDRCxPQUFPLEVBQUU7Z0JBQ0wsS0FBSyxDQUFDLEtBQUs7b0JBQ1AsSUFBSSxDQUFDO3dCQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO3dCQUNoQixNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLGNBQWMsQ0FBQyxDQUFDO3dCQUNqRixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7d0JBQzlCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQzt3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QUMsQ0FBQztRQUNuQyxJQUFJLEdBQUc7WUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDM0IsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgY3JlYXRlQXBwIH0gPSByZXF1aXJlKFwidnVlXCIpO1xyXG5cclxuY29uc3QgcGFuZWxEYXRhTWFwID0gbmV3IFdlYWtNYXA8YW55LCBhbnk+KCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5kZWZpbmUoe1xyXG4gICAgdGVtcGxhdGU6IGBcclxuPGRpdiBpZD1cImFwcFwiPlxyXG4gICAgPGgyPkNvY29zIENyZWF0b3IgTUNQPC9oMj5cclxuICAgIDxkaXYgY2xhc3M9XCJzdGF0dXNcIj5cclxuICAgICAgICA8c3Bhbj5TdGF0dXM6IDxzdHJvbmcgOmNsYXNzPVwicnVubmluZyA/ICdvbicgOiAnb2ZmJ1wiPnt7IHJ1bm5pbmcgPyAnUnVubmluZycgOiAnU3RvcHBlZCcgfX08L3N0cm9uZz48L3NwYW4+XHJcbiAgICA8L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJwb3J0LXJvd1wiPlxyXG4gICAgICAgIDxsYWJlbD5Qb3J0OjwvbGFiZWw+XHJcbiAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiB2LW1vZGVsLm51bWJlcj1cImVkaXRQb3J0XCIgOmRpc2FibGVkPVwicnVubmluZ1wiIG1pbj1cIjEwMjRcIiBtYXg9XCI2NTUzNVwiIC8+XHJcbiAgICAgICAgPHVpLWJ1dHRvbiB2LWlmPVwiIXJ1bm5pbmcgJiYgZWRpdFBvcnQgIT09IHBvcnRcIiBAY29uZmlybT1cImFwcGx5UG9ydFwiIGNsYXNzPVwic21hbGwtYnRuXCI+QXBwbHk8L3VpLWJ1dHRvbj5cclxuICAgIDwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cImFjdGlvbnNcIj5cclxuICAgICAgICA8dWktYnV0dG9uIHYtaWY9XCIhcnVubmluZ1wiIEBjb25maXJtPVwic3RhcnRcIj5TdGFydCBTZXJ2ZXI8L3VpLWJ1dHRvbj5cclxuICAgICAgICA8dWktYnV0dG9uIHYtaWY9XCJydW5uaW5nXCIgQGNvbmZpcm09XCJzdG9wXCI+U3RvcCBTZXJ2ZXI8L3VpLWJ1dHRvbj5cclxuICAgIDwvZGl2PlxyXG4gICAgPGRpdiB2LWlmPVwicnVubmluZ1wiIGNsYXNzPVwiaW5mb1wiPlxyXG4gICAgICAgIDxwPkVuZHBvaW50OiA8Y29kZT5odHRwOi8vMTI3LjAuMC4xOnt7IHBvcnQgfX0vbWNwPC9jb2RlPjwvcD5cclxuICAgICAgICA8cD5Ub29sczogPHN0cm9uZz57eyB0b29sQ291bnQgfX08L3N0cm9uZz48L3A+XHJcbiAgICA8L2Rpdj5cclxuICAgIDxkaXYgdi1pZj1cImVycm9yXCIgY2xhc3M9XCJlcnJvclwiPnt7IGVycm9yIH19PC9kaXY+XHJcbjwvZGl2PlxyXG4gICAgYCxcclxuICAgIHN0eWxlOiBgXHJcbiNhcHAgeyBwYWRkaW5nOiAxMnB4OyBmb250LWZhbWlseTogc2Fucy1zZXJpZjsgY29sb3I6ICNjY2M7IH1cclxuaDIgeyBtYXJnaW46IDAgMCA4cHggMDsgZm9udC1zaXplOiAxNnB4OyB9XHJcbi5zdGF0dXMgeyBtYXJnaW46IDhweCAwOyB9XHJcbi5vbiB7IGNvbG9yOiAjNGY0OyB9XHJcbi5vZmYgeyBjb2xvcjogI2Y2NjsgfVxyXG4ucG9ydC1yb3cgeyBtYXJnaW46IDhweCAwOyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDhweDsgfVxyXG4ucG9ydC1yb3cgbGFiZWwgeyBmb250LXNpemU6IDEycHg7IH1cclxuLnBvcnQtcm93IGlucHV0IHsgd2lkdGg6IDgwcHg7IHBhZGRpbmc6IDNweCA2cHg7IGJhY2tncm91bmQ6ICMyMjI7IGNvbG9yOiAjY2NjOyBib3JkZXI6IDFweCBzb2xpZCAjNDQ0OyBib3JkZXItcmFkaXVzOiAzcHg7IGZvbnQtc2l6ZTogMTJweDsgfVxyXG4ucG9ydC1yb3cgaW5wdXQ6ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjU7IH1cclxuLmFjdGlvbnMgeyBtYXJnaW46IDhweCAwOyB9XHJcbi5pbmZvIHsgbWFyZ2luOiA4cHggMDsgcGFkZGluZzogOHB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1jb2xvci1ub3JtYWwtZmlsbC1lbXBoYXNpcyk7IGJvcmRlci1yYWRpdXM6IDRweDsgfVxyXG4uaW5mbyBwIHsgbWFyZ2luOiA0cHggMDsgZm9udC1zaXplOiAxMnB4OyB9XHJcbi5pbmZvIGNvZGUgeyBiYWNrZ3JvdW5kOiAjMzMzOyBwYWRkaW5nOiAycHggNnB4OyBib3JkZXItcmFkaXVzOiAzcHg7IGZvbnQtc2l6ZTogMTFweDsgfVxyXG4uZXJyb3IgeyBtYXJnaW46IDhweCAwOyBjb2xvcjogI2Y2NjsgZm9udC1zaXplOiAxMnB4OyB9XHJcbiAgICBgLFxyXG4gICAgJDogeyBhcHA6IFwiI2FwcFwiIH0sXHJcbiAgICByZWFkeSgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuJC5hcHApIHJldHVybjtcclxuICAgICAgICBjb25zdCBhcHAgPSBjcmVhdGVBcHAoe1xyXG4gICAgICAgICAgICBkYXRhKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBydW5uaW5nOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3J0OiAzMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGVkaXRQb3J0OiAzMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xDb3VudDogMCxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogXCJcIixcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1ldGhvZHM6IHtcclxuICAgICAgICAgICAgICAgIGFzeW5jIHN0YXJ0KHRoaXM6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiY29jb3MtY3JlYXRvci1tY3BcIiwgXCJzdGFydC1zZXJ2ZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVubmluZyA9IHJlc3VsdC5ydW5uaW5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcnQgPSByZXN1bHQucG9ydDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0UG9ydCA9IHJlc3VsdC5wb3J0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvciA9IGUubWVzc2FnZSB8fCBTdHJpbmcoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGFzeW5jIHN0b3AodGhpczogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdChcImNvY29zLWNyZWF0b3ItbWNwXCIsIFwic3RvcC1zZXJ2ZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRvb2xDb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXJyb3IgPSBlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhc3luYyBhcHBseVBvcnQodGhpczogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lcnJvciA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoXCJjb2Nvcy1jcmVhdG9yLW1jcFwiLCBcInVwZGF0ZS1wb3J0XCIsIHRoaXMuZWRpdFBvcnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcnQgPSByZXN1bHQucG9ydDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gcmVzdWx0LnJ1bm5pbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIGF3YWl0IHRoaXMucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVycm9yID0gZS5tZXNzYWdlIHx8IFN0cmluZyhlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgcmVmcmVzaCh0aGlzOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KFwiY29jb3MtY3JlYXRvci1tY3BcIiwgXCJnZXQtc2VydmVyLXN0YXR1c1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gc3RhdHVzLnJ1bm5pbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9ydCA9IHN0YXR1cy5wb3J0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRQb3J0ID0gc3RhdHVzLnBvcnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9vbENvdW50ID0gc3RhdHVzLnRvb2xDb3VudDtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiW2NvY29zLWNyZWF0b3ItbWNwXSByZWZyZXNoIGZhaWxlZDpcIiwgZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYXN5bmMgbW91bnRlZCh0aGlzOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiW2NvY29zLWNyZWF0b3ItbWNwXSBtb3VudGVkIHJlZnJlc2ggZmFpbGVkOlwiLCBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuICAgICAgICBhcHAubW91bnQodGhpcy4kLmFwcCk7XHJcbiAgICAgICAgcGFuZWxEYXRhTWFwLnNldCh0aGlzLCBhcHApO1xyXG4gICAgfSxcclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIGNvbnN0IGFwcCA9IHBhbmVsRGF0YU1hcC5nZXQodGhpcyk7XHJcbiAgICAgICAgaWYgKGFwcCkgYXBwLnVubW91bnQoKTtcclxuICAgIH0sXHJcbn0pO1xyXG4iXX0=