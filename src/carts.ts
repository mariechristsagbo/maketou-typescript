import type { Checkout, CreateCartInput } from "./types.js";
import { MaketouTransport } from "./transport.js";

export class Carts {
  readonly #transport: MaketouTransport;

  constructor(transport: MaketouTransport) {
    this.#transport = transport;
  }

  create(input: CreateCartInput): Promise<Checkout> {
    return this.#transport.post<Checkout>("/api/v1/stores/cart/checkout", input);
  }
}
