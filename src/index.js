import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

// Configuration from Environment
const API_KEY = process.env.PROMPTSTACK_API_KEY;
const SERVER_URL = process.env.PROMPTSTACK_SERVER_URL || 'https://mcp.promstack.com';
const DEBUG = process.env.DEBUG === 'true';

if (!API_KEY) {
    console.error("Error: PROMPTSTACK_API_KEY environment variable is required.");
    process.exit(1);
}

// Helper: Call Backend
async function callBackend(method, params) {
    const body = {
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now(),
    };

    if (DEBUG) console.error(`[PromStack MCP] Request: ${method}`, JSON.stringify(params));

    try {
        const response = await fetch(`${SERVER_URL}/api/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (DEBUG) console.error(`[PromStack MCP] Response:`, JSON.stringify(data));

        if (data.error) {
            throw new Error(data.error.message || 'Unknown error from backend');
        }

        return data.result;
    } catch (error) {
        console.error(`[PromStack MCP] Error: ${error.message}`);
        throw error;
    }
}

// Initialize Server
const server = new McpServer({
    name: "promstack-mcp",
    version: "1.0.0",
});

// Register Tools
server.tool(
    "list_prompts",
    {
        projectId: z.number().optional().describe("Filter by Project ID"),
        search: z.string().optional().describe("Search term for prompts"),
        limit: z.number().optional().default(20).describe("Limit number of results")
    },
    async ({ projectId, search, limit }) => {
        const result = await callBackend('tools/call', {
            name: 'list_prompts',
            arguments: { projectId, search, limit }
        });

        // Backend returns standard MCPToolResult { content: [...], isError: ... }
        return result;
    }
);

server.tool(
    "get_prompt",
    {
        promptId: z.number().describe("ID of the prompt to retrieve")
    },
    async ({ promptId }) => {
        const result = await callBackend('tools/call', {
            name: 'get_prompt',
            arguments: { promptId }
        });
        return result;
    }
);

server.tool(
    "select_prompt",
    {
        taskDescription: z.string().describe("Description of the task to find prompts for"),
        projectId: z.number().optional(),
        topK: z.number().optional().default(3)
    },
    async ({ taskDescription, projectId, topK }) => {
        const result = await callBackend('tools/call', {
            name: 'select_prompt',
            arguments: { taskDescription, projectId, topK }
        });
        return result;
    }
);

server.tool(
    "export_skill",
    {
        promptId: z.number().describe("ID of the prompt to export as a skill"),
        includeResources: z.boolean().optional().default(false)
    },
    async ({ promptId, includeResources }) => {
        const result = await callBackend('tools/call', {
            name: 'export_skill',
            arguments: { promptId, includeResources }
        });
        return result;
    }
);

server.tool(
    "query_context",
    {
        promptId: z.number().describe("ID of the prompt to query context for"),
        maxTokens: z.number().optional().default(10000).describe("Maximum tokens (max: 10000)"),
        refreshCache: z.boolean().optional().default(false).describe("Force refresh cache")
    },
    async ({ promptId, maxTokens, refreshCache }) => {
        const result = await callBackend('tools/call', {
            name: 'query_context',
            arguments: { promptId, maxTokens, refreshCache }
        });
        return result;
    }
);

// Register Resources
// Note: The SDK's resource method expects a different pattern.
// We'll implement a dynamic resource handler if possible, but SDK usually defines static resources.
// For now, let's implement the specific list resources.

server.resource(
    "prompts-list",
    "promstack://prompts/list",
    async (uri) => {
        const result = await callBackend('resources/read', { uri: uri.href });
        // Backend returns { contents: [...] }
        return result;
    }
);

server.resource(
    "projects-list",
    "promstack://projects/list",
    async (uri) => {
        const result = await callBackend('resources/read', { uri: uri.href });
        return result;
    }
);

// Start Server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    if (DEBUG) console.error("[PromStack MCP] Server connected to stdio");
}

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
