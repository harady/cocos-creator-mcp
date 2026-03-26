import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

export class BuilderTools implements ToolCategory {
    readonly categoryName = "builder";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "builder_open_panel",
                description: "Open the Build panel in the editor.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "builder_get_settings",
                description: "Get the current build settings/configuration.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "builder_query_tasks",
                description: "Query active build tasks.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "builder_run_preview",
                description: "Start the preview server for browser testing.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "builder_stop_preview",
                description: "Stop the preview server.",
                inputSchema: { type: "object", properties: {} },
            },
        ];
    }

    async execute(toolName: string, _args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "builder_open_panel":
                    Editor.Panel.open("builder");
                    return ok({ success: true });
                case "builder_get_settings": {
                    const settings = await (Editor.Message.request as any)("builder", "query-build-options").catch(() => null);
                    return ok({ success: true, settings });
                }
                case "builder_query_tasks": {
                    const tasks = await (Editor.Message.request as any)("builder", "query-tasks").catch(() => []);
                    return ok({ success: true, tasks });
                }
                case "builder_run_preview":
                    await (Editor.Message.request as any)("preview", "start");
                    return ok({ success: true, message: "Preview started" });
                case "builder_stop_preview":
                    await (Editor.Message.request as any)("preview", "stop");
                    return ok({ success: true, message: "Preview stopped" });
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
