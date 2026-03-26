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

/** Validate that a string looks like a CocosCreator UUID (not empty, reasonable format) */
export function validateUuid(uuid: string, label: string = "uuid"): string | null {
    if (!uuid || typeof uuid !== "string") {
        return `${label} is required`;
    }
    if (uuid.trim().length === 0) {
        return `${label} cannot be empty`;
    }
    // CocosCreator UUIDs: either standard format (8-4-4-4-12) or compressed (22 chars with +/=)
    // Be permissive — just reject obviously wrong values
    if (uuid.length < 10) {
        return `${label} "${uuid}" is too short to be a valid UUID`;
    }
    return null; // valid
}

/** Validate UUID and return err() if invalid, null if valid */
export function checkUuid(uuid: string, label: string = "uuid"): ToolResult | null {
    const error = validateUuid(uuid, label);
    return error ? err(error) : null;
}
