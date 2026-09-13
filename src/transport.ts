import { z } from "zod";
import {
  MaketouError,
  MaketouRateLimitedError,
  MaketouResponseError,
  type MaketouValidationIssue,
} from "./errors.js";

export interface TransportOptions {
  apiKey: string;
  baseUrl: string;
  fetch: typeof globalThis.fetch;
}

const apiErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
});

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const retryAfter = Number(value);
  return Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : undefined;
}

function normalizeIssues(issues: readonly z.ZodIssue[]): MaketouValidationIssue[] {
  return issues.map((issue) => ({
    message: issue.code === "invalid_type" ? `expected ${issue.expected}` : "invalid value",
    path: issue.path.length === 0 ? "response" : issue.path.join("."),
  }));
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

  get<T>(path: string, operation: string, schema: z.ZodType<T>): Promise<T> {
    return this.request(path, { method: "GET" }, operation, schema);
  }

  post<T>(path: string, body: unknown, operation: string, schema: z.ZodType<T>): Promise<T> {
    return this.request(
      path,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      operation,
      schema,
    );
  }

  async request<T>(
    path: string,
    init: RequestInit,
    operation: string,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.#apiKey}`);
    const response = await this.#fetch(`${this.#baseUrl}${path}`, { ...init, headers });

    if (!response.ok) {
      await this.throwApiError(response, operation);
    }

    const payload = await this.readSuccessJson(response, operation);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new MaketouResponseError(operation, response.status, normalizeIssues(parsed.error.issues));
    }

    return parsed.data;
  }

  async readSuccessJson(response: Response, operation: string): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new MaketouResponseError(operation, response.status, [
        { message: "expected valid JSON", path: "response" },
      ]);
    }
  }

  async throwApiError(response: Response, operation: string): Promise<never> {
    const payload: unknown = await response.json().catch(() => undefined);
    const apiError = apiErrorSchema.safeParse(payload);
    const options = {
      code: apiError.success ? apiError.data.code : undefined,
      operation,
      retryAfter: parseRetryAfter(response.headers.get("Retry-After")),
      status: response.status,
    };
    const message = apiError.success && apiError.data.message !== undefined
      ? apiError.data.message
      : `Maketou request failed with status ${response.status}.`;

    if (response.status === 429) {
      throw new MaketouRateLimitedError(message, options);
    }

    throw new MaketouError(message, options);
  }
}
