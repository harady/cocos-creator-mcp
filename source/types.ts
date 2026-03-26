/** MCP Tool definition (JSON Schema based) */
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, any>;
        required?: string[];
    };
}

/** Result returned from tool execution */
export interface ToolResult {
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
}

/** Interface that all tool categories must implement */
export interface ToolCategory {
    readonly categoryName: string;
    getTools(): ToolDefinition[];
    execute(toolName: string, args: Record<string, any>): Promise<ToolResult>;
}

/** JSON-RPC 2.0 request */
export interface JsonRpcRequest {
    jsonrpc: "2.0";
    id?: string | number;
    method: string;
    params?: any;
}

/** JSON-RPC 2.0 response */
export interface JsonRpcResponse {
    jsonrpc: "2.0";
    id?: string | number | null;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

/** Server configuration */
export interface ServerConfig {
    port: number;
    autoStart: boolean;
}

export const DEFAULT_CONFIG: ServerConfig = {
    port: 3001,
    autoStart: false,
};
