import { ToolResult } from "./types";

/** Helper to create a successful text result */
export function ok(data: any): ToolResult {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
}

/** Helper to create an error result */
export function err(message: string): ToolResult {
    return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true,
    };
}
