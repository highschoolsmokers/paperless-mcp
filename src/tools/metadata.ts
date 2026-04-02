import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PaperlessClient } from "../paperless.js";

export function registerMetadataTools(
  server: McpServer,
  client: PaperlessClient
) {
  server.tool(
    "list_correspondents",
    "List all correspondents in Paperless-ngx with their IDs, names, and document counts.",
    {
      page: z.number().optional().describe("Page number (default 1)"),
      page_size: z
        .number()
        .optional()
        .describe("Results per page (default 100)"),
    },
    async (args) => {
      const result = await client.listCorrespondents(
        args.page,
        args.page_size
      );
      const correspondents = result.results.map((c) => ({
        id: c.id,
        name: c.name,
        document_count: c.document_count,
      }));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { count: result.count, correspondents },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "list_document_types",
    "List all document types in Paperless-ngx with their IDs, names, and document counts.",
    {
      page: z.number().optional().describe("Page number (default 1)"),
      page_size: z
        .number()
        .optional()
        .describe("Results per page (default 100)"),
    },
    async (args) => {
      const result = await client.listDocumentTypes(
        args.page,
        args.page_size
      );
      const types = result.results.map((t) => ({
        id: t.id,
        name: t.name,
        document_count: t.document_count,
      }));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { count: result.count, document_types: types },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
