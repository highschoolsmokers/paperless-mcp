import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PaperlessClient } from "../paperless.js";

export function registerTagTools(server: McpServer, client: PaperlessClient) {
  server.tool(
    "list_tags",
    "List all tags in Paperless-ngx with their IDs, names, colors, and document counts.",
    {
      page: z.number().optional().describe("Page number (default 1)"),
      page_size: z
        .number()
        .optional()
        .describe("Results per page (default 100)"),
    },
    async (args) => {
      const result = await client.listTags(args.page, args.page_size);
      const tags = result.results.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        document_count: tag.document_count,
      }));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { count: result.count, tags },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "create_tag",
    "Create a new tag in Paperless-ngx.",
    {
      name: z.string().describe("Tag name"),
      color: z
        .string()
        .optional()
        .describe("Hex color for the tag (e.g. #ff0000)"),
    },
    async (args) => {
      const tag = await client.createTag(args.name, args.color);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { id: tag.id, name: tag.name, color: tag.color },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "tag_document",
    "Add or remove tags on a document. Specify the full desired tag list — this replaces all existing tags.",
    {
      document_id: z.number().describe("Document ID"),
      tag_ids: z
        .array(z.number())
        .describe(
          "Complete list of tag IDs to set on the document (replaces existing tags)"
        ),
    },
    async (args) => {
      const doc = await client.updateDocument(args.document_id, {
        tags: args.tag_ids,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                id: doc.id,
                title: doc.title,
                tags: doc.tags,
                message: "Tags updated successfully",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
