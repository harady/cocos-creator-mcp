import { ToolCategory, ToolDefinition, ToolResult } from "../types";
import { ok, err } from "../tool-base";

export class PreferencesTools implements ToolCategory {
    readonly categoryName = "preferences";

    getTools(): ToolDefinition[] {
        return [
            {
                name: "preferences_get",
                description: "Get a preference value by key.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Protocol name (e.g. 'general', 'builder', 'engine')" },
                        key: { type: "string", description: "Preference key" },
                    },
                    required: ["protocol", "key"],
                },
            },
            {
                name: "preferences_set",
                description: "Set a preference value.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Protocol name" },
                        key: { type: "string", description: "Preference key" },
                        value: { description: "Value to set" },
                    },
                    required: ["protocol", "key", "value"],
                },
            },
            {
                name: "preferences_get_all",
                description: "Get all preferences for a given protocol.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Protocol name (e.g. 'general')" },
                    },
                    required: ["protocol"],
                },
            },
            {
                name: "preferences_reset",
                description: "Reset a preference to its default value.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Protocol name" },
                        key: { type: "string", description: "Preference key to reset" },
                    },
                    required: ["protocol", "key"],
                },
            },
        ];
    }

    async execute(toolName: string, args: Record<string, any>): Promise<ToolResult> {
        try {
            switch (toolName) {
                case "preferences_get": {
                    const value = Editor.Profile.getConfig(args.protocol, args.key);
                    return ok({ success: true, protocol: args.protocol, key: args.key, value });
                }
                case "preferences_set":
                    Editor.Profile.setConfig(args.protocol, args.key, args.value);
                    return ok({ success: true, protocol: args.protocol, key: args.key });
                case "preferences_get_all": {
                    const config = Editor.Profile.getConfig(args.protocol);
                    return ok({ success: true, protocol: args.protocol, config });
                }
                case "preferences_reset":
                    Editor.Profile.removeConfig(args.protocol, args.key);
                    return ok({ success: true, protocol: args.protocol, key: args.key });
                default:
                    return err(`Unknown tool: ${toolName}`);
            }
        } catch (e: any) {
            return err(e.message || String(e));
        }
    }
}
