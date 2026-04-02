import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { PaperlessClient } from "./paperless.js";
import { registerDocumentTools } from "./tools/documents.js";
import { registerTagTools } from "./tools/tags.js";
import { registerMetadataTools } from "./tools/metadata.js";

const PORT = parseInt(process.env.PORT || "3100", 10);

function createServer() {
  const server = new McpServer({
    name: "paperless-mcp",
    version: "1.0.0",
  });

  const client = new PaperlessClient();
  registerDocumentTools(server, client);
  registerTagTools(server, client);
  registerMetadataTools(server, client);

  return server;
}

const app = express();
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "paperless-mcp" });
});

// Stateless MCP endpoint — create a fresh transport per request
app.post("/mcp", async (req, res) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Handle GET and DELETE for MCP protocol (session management / SSE)
app.get("/mcp", async (_req, res) => {
  res.writeHead(405).end(JSON.stringify({ error: "Method not allowed — this server is stateless. Use POST." }));
});

app.delete("/mcp", async (_req, res) => {
  res.writeHead(405).end(JSON.stringify({ error: "Method not allowed — this server is stateless." }));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Paperless MCP server listening on http://0.0.0.0:${PORT}/mcp`);
  console.log(`Paperless URL: ${process.env.PAPERLESS_URL || "http://webserver:8000"}`);
});
