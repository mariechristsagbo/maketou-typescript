import { Carts } from "./carts.js";
import { MaketouConfigurationError } from "./errors.js";
import { MaketouTransport } from "./transport.js";

const DEFAULT_BASE_URL = "https://api.maketou.net";

export interface MaketouOptions {
  apiKey: string;
  fetch?: typeof globalThis.fetch;
}

export class Maketou {
  readonly carts: Carts;

  constructor(options: MaketouOptions) {
    if (options.apiKey.trim().length === 0) {
      throw new MaketouConfigurationError("Maketou API key must not be empty.");
    }

    this.carts = new Carts(
      new MaketouTransport({
        apiKey: options.apiKey,
        baseUrl: DEFAULT_BASE_URL,
        fetch: options.fetch ?? globalThis.fetch,
      }),
    );
  }
}
