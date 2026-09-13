export interface TransportOptions {
  apiKey: string;
  baseUrl: string;
  fetch: typeof globalThis.fetch;
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

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    return (await response.json()) as T;
  }
}
