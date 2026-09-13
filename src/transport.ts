import { MaketouError, MaketouRateLimitedError, MaketouResponseError } from "./errors.js";
import type { ParseResult } from "./parsers.js";

export interface TransportOptions {
  apiKey: string;
  baseUrl: string;
  fetch: typeof globalThis.fetch;
}

interface ApiErrorBody {
  code?: string;
  message?: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { code, message } = value as Record<string, unknown>;
  return (code === undefined || typeof code === "string") && (message === undefined || typeof message === "string");
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const retryAfter = Number(value);
  return Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : undefined;
}

export class MaketouTransport {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #fetch: typeof globalThis.fetch;

  constructor(options: TransportOptions) {
    this.#apiKey = options.apiKey;
    this.#baseUrl = options.baseUrl.replace(/\/$/, "");
    this.#fetch = options.fetch;
  }

  get<T>(path: string, operation: string, parse: (value: unknown) => ParseResult<T>): Promise<T> {
    return this.request(path, { method: "GET" }, operation, parse);
  }

  post<T>(
    path: string,
    body: unknown,
    operation: string,
    parse: (value: unknown) => ParseResult<T>,
  ): Promise<T> {
    return this.request(
      path,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      operation,
      parse,
    );
  }

  async request<T>(
    path: string,
    init: RequestInit,
    operation: string,
    parse: (value: unknown) => ParseResult<T>,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.#apiKey}`);
    const response = await this.#fetch(`${this.#baseUrl}${path}`, { ...init, headers });

    if (!response.ok) {
      await this.throwApiError(response, operation);
    }

    const parsed = parse(await response.json());
    if (!parsed.success) {
      throw new MaketouResponseError(operation, parsed.issues);
    }

    return parsed.value;
  }

  async throwApiError(response: Response, operation: string): Promise<never> {
    const payload: unknown = await response.json().catch(() => undefined);
    const apiError = isApiErrorBody(payload) ? payload : {};
    const options = {
      code: apiError.code,
      operation,
      retryAfter: parseRetryAfter(response.headers.get("Retry-After")),
      status: response.status,
    };
    const message = apiError.message ?? `Maketou request failed with status ${response.status}.`;

    if (response.status === 429) {
      throw new MaketouRateLimitedError(message, options);
    }

    throw new MaketouError(message, options);
  }
}
