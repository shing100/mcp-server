#!/usr/bin/env node
import process from 'process';

// Get Args
const args = process.argv.slice(2);
let apiKey = process.env.PROMPTSTACK_API_KEY;
let serverUrl = process.env.PROMPTSTACK_SERVER_URL || 'https://mcp.promstack.com';
let debug = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--api-key' && args[i + 1]) {
    apiKey = args[i + 1];
    i++;
  } else if (args[i] === '--server' && args[i + 1]) {
    serverUrl = args[i + 1];
    i++;
  } else if (args[i] === '--debug') {
    debug = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
PromStack MCP Server

Usage:
  npx promstack-mcp-server [options]

Options:
  --api-key <key>    Your PromStack API key
  --server <url>     Server URL (default: https://mcp.promstack.com)
  --debug            Enable debug logging
  --help, -h         Show this help message

Environment Variables:
  PROMPTSTACK_API_KEY     API key
  PROMPTSTACK_SERVER_URL  Server URL
`);
    process.exit(0);
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
PromStack MCP Server

Usage:
  npx promstack-mcp-server [options]

Options:
  --api-key <key>    Your PromStack API key
  --server <url>     Server URL (default: https://mcp.promstack.com)
  --debug            Enable debug logging
  --help, -h         Show this help message

Environment Variables:
  PROMPTSTACK_API_KEY     API key
  PROMPTSTACK_SERVER_URL  Server URL
`);
    process.exit(0);
  }
}

if (!apiKey) {
  console.error('Error: API key is required');
  console.error('Use --api-key YOUR_KEY or set PROMPTSTACK_API_KEY environment variable');
  process.exit(1);
}

// Set Env for index.js
process.env.PROMPTSTACK_API_KEY = apiKey;
process.env.PROMPTSTACK_SERVER_URL = serverUrl;
process.env.DEBUG = String(debug);

// Start Server
import('../src/index.js');
