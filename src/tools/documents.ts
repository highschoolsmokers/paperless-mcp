import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PaperlessClient } from "../paperless.js";

export function registerDocumentTools(
  server: McpServer,
  client: PaperlessClient
) {
  server.tool(
    "search_documents",
    "Search Paperless-ngx documents by full-text query and/or filters. Returns matching documents with metadata and search highlights.",
    {
      query: z.string().optional().describe("Full-text search query"),
      correspondent_id: z
        .number()
        .optional()
        .describe("Filter by correspondent ID"),
      document_type_id: z
        .number()
        .optional()
        .describe("Filter by document type ID"),
      tag_ids: z
        .array(z.number())
        .optional()
        .describe("Filter by tag IDs (all must match)"),
      created_after: z
        .string()
        .optional()
        .describe("Filter documents created after this date (YYYY-MM-DD)"),
      created_before: z
        .string()
        .optional()
        .describe("Filter documents created before this date (YYYY-MM-DD)"),
      page: z.number().optional().describe("Page number (default 1)"),
      page_size: z
        .number()
        .optional()
        .describe("Results per page (default 25, max 100)"),
    },
    async (args) => {
      const result = await client.searchDocuments({
        query: args.query,
        correspondent: args.correspondent_id,
        document_type: args.document_type_id,
        tags: args.tag_ids,
        created_after: args.created_after,
        created_before: args.created_before,
        page: args.page,
        page_size: args.page_size,
      });

      const docs = result.results.map((doc) => ({
        id: doc.id,
        title: doc.title,
        correspondent: doc.correspondent,
        document_type: doc.document_type,
        tags: doc.tags,
        created: doc.created_date,
        archive_serial_number: doc.archive_serial_number,
        original_file_name: doc.original_file_name,
        search_score: doc.__search_hit__?.score,
        search_highlights: doc.__search_hit__?.highlights,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { count: result.count, page: args.page || 1, documents: docs },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "get_document",
    "Get full metadata and content for a specific document by ID.",
    {
      id: z.number().describe("Document ID"),
    },
    async (args) => {
      const doc = await client.getDocument(args.id);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                id: doc.id,
                title: doc.title,
                correspondent: doc.correspondent,
                document_type: doc.document_type,
                tags: doc.tags,
                created: doc.created_date,
                modified: doc.modified,
                added: doc.added,
                archive_serial_number: doc.archive_serial_number,
                original_file_name: doc.original_file_name,
                content: doc.content,
                notes: doc.notes,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "download_document",
    "Download a document's archived PDF (or original file). Returns base64-encoded content.",
    {
      id: z.number().describe("Document ID"),
      original: z
        .boolean()
        .optional()
        .describe(
          "If true, download the original uploaded file instead of the archived PDF"
        ),
    },
    async (args) => {
      const buffer = await client.downloadDocument(args.id, args.original);
      const base64 = buffer.toString("base64");
      return {
        content: [
          {
            type: "text" as const,
            text: `Document ${args.id} downloaded (${buffer.length} bytes). Base64 content:\n${base64}`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_document_suggestions",
    "Get auto-classification suggestions for a document (suggested tags, correspondent, document type).",
    {
      id: z.number().describe("Document ID"),
    },
    async (args) => {
      const suggestions = await client.getDocumentSuggestions(args.id);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(suggestions, null, 2),
          },
        ],
      };
    }
  );
}
