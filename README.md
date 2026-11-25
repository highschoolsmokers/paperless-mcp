# paperless-mcp

A stateless [Model Context Protocol](https://modelcontextprotocol.io) server
that connects Claude (or any MCP client) to a
[Paperless-ngx](https://docs.paperless-ngx.com) document archive. It wraps the
Paperless REST API in typed tools for searching, reading, tagging, and
classifying documents.

## Tools

| Tool | What it does |
|---|---|
| `search_documents` | Full-text search, with filters, returning metadata and highlights |
| `get_document` | Full metadata and text content for one document |
| `download_document` | The archived PDF (or original file), base64-encoded |
| `get_document_suggestions` | Paperless's suggested tags, correspondent, and document type |
| `list_tags` | Every tag, with ID, name, color, and document count |
| `create_tag` | Create a tag |
| `tag_document` | Set a document's tags (replaces the existing list) |
| `list_correspondents` | Every correspondent, with document counts |
| `list_document_types` | Every document type, with document counts |

## Configuration

| Variable | Default | |
|---|---|---|
| `PAPERLESS_URL` | `http://webserver:8000` | Base URL of your Paperless-ngx instance |
| `PAPERLESS_API_TOKEN` | (none) | A Paperless API token (Profile → API token) |
| `PORT` | `3100` | Port the MCP server listens on |

## Run

```bash
npm install
PAPERLESS_URL=http://localhost:8000 PAPERLESS_API_TOKEN=... npm run dev
```

Or with Docker, next to Paperless:

```bash
docker build -t paperless-mcp .
docker run -p 3100:3100 -e PAPERLESS_URL=http://webserver:8000 -e PAPERLESS_API_TOKEN=... paperless-mcp
```

The MCP endpoint is `POST /mcp` (Streamable HTTP, stateless: each request is
independent, so `GET` and `DELETE` return 405). `GET /health` reports status.

**The server has no authentication of its own.** Anyone who can reach its port
can use your Paperless token through it. Run it on a private network beside
Paperless, or behind a proxy that authenticates.

## License

MIT. See [LICENSE](LICENSE).
