const PAPERLESS_URL = process.env.PAPERLESS_URL || "http://webserver:8000";
const PAPERLESS_API_TOKEN = process.env.PAPERLESS_API_TOKEN || "";

interface PaperlessRequestOptions {
  method?: string;
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

export class PaperlessClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl?: string, token?: string) {
    this.baseUrl = (baseUrl || PAPERLESS_URL).replace(/\/$/, "");
    this.token = token || PAPERLESS_API_TOKEN;
    if (!this.token) {
      console.warn(
        "PAPERLESS_API_TOKEN is not set. API calls will fail unless using session auth."
      );
    }
  }

  private async request<T = unknown>(
    path: string,
    options: PaperlessRequestOptions = {}
  ): Promise<T> {
    const { method = "GET", params, body } = options;

    let url = `${this.baseUrl}/api${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Token ${this.token}`,
      Accept: "application/json; version=10",
    };

    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Paperless API ${method} ${path} returned ${res.status}: ${text}`
      );
    }

    return res.json() as Promise<T>;
  }

  async requestRaw(path: string): Promise<Buffer> {
    const url = `${this.baseUrl}/api${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Token ${this.token}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Paperless API GET ${path} returned ${res.status}`);
    }
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  // --- Documents ---

  async searchDocuments(params: {
    query?: string;
    correspondent?: number;
    document_type?: number;
    tags?: number[];
    created_after?: string;
    created_before?: string;
    page?: number;
    page_size?: number;
  }) {
    const searchParams: Record<string, string | number | undefined> = {
      query: params.query,
      correspondent__id: params.correspondent,
      document_type__id: params.document_type,
      created__date__gt: params.created_after,
      created__date__lt: params.created_before,
      page: params.page || 1,
      page_size: params.page_size || 25,
    };
    if (params.tags && params.tags.length > 0) {
      searchParams["tags__id__all"] = params.tags.join(",");
    }
    return this.request<PaginatedResponse<Document>>("/documents/", {
      params: searchParams,
    });
  }

  async getDocument(id: number) {
    return this.request<Document>(`/documents/${id}/`);
  }

  async downloadDocument(id: number, original = false): Promise<Buffer> {
    const path = original
      ? `/documents/${id}/download/?original=true`
      : `/documents/${id}/download/`;
    return this.requestRaw(path);
  }

  async updateDocument(id: number, data: Partial<DocumentUpdate>) {
    return this.request<Document>(`/documents/${id}/`, {
      method: "PATCH",
      body: data,
    });
  }

  async getDocumentSuggestions(id: number) {
    return this.request<DocumentSuggestions>(`/documents/${id}/suggestions/`);
  }

  // --- Tags ---

  async listTags(page = 1, pageSize = 100) {
    return this.request<PaginatedResponse<Tag>>("/tags/", {
      params: { page, page_size: pageSize },
    });
  }

  async createTag(name: string, color?: string) {
    return this.request<Tag>("/tags/", {
      method: "POST",
      body: { name, color: color || "#a6cee3" },
    });
  }

  // --- Correspondents ---

  async listCorrespondents(page = 1, pageSize = 100) {
    return this.request<PaginatedResponse<Correspondent>>("/correspondents/", {
      params: { page, page_size: pageSize },
    });
  }

  // --- Document Types ---

  async listDocumentTypes(page = 1, pageSize = 100) {
    return this.request<PaginatedResponse<DocumentType>>("/document_types/", {
      params: { page, page_size: pageSize },
    });
  }
}

// --- Types ---

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  all: number[];
}

export interface Document {
  id: number;
  correspondent: number | null;
  document_type: number | null;
  storage_path: number | null;
  title: string;
  content: string;
  tags: number[];
  created: string;
  created_date: string;
  modified: string;
  added: string;
  archive_serial_number: number | null;
  original_file_name: string;
  archived_file_name: string | null;
  owner: number | null;
  notes: unknown[];
  __search_hit__?: {
    score: number;
    highlights: string;
    note_highlights: string;
    rank: number;
  };
}

interface DocumentUpdate {
  title: string;
  correspondent: number | null;
  document_type: number | null;
  tags: number[];
  archive_serial_number: number | null;
}

interface DocumentSuggestions {
  correspondents: number[];
  tags: number[];
  document_types: number[];
  storage_paths: number[];
  dates: string[];
}

export interface Tag {
  id: number;
  slug: string;
  name: string;
  color: string;
  text_color: string;
  match: string;
  matching_algorithm: number;
  is_insensitive: boolean;
  document_count: number;
  owner: number | null;
}

export interface Correspondent {
  id: number;
  slug: string;
  name: string;
  match: string;
  matching_algorithm: number;
  is_insensitive: boolean;
  document_count: number;
  owner: number | null;
}

export interface DocumentType {
  id: number;
  slug: string;
  name: string;
  match: string;
  matching_algorithm: number;
  is_insensitive: boolean;
  document_count: number;
  owner: number | null;
}
