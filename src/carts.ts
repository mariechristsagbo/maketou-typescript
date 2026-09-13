import { cartDetailsResponseSchema, checkoutResponseSchema } from "./schemas.js";
import type { CartDetails, Checkout, CreateCartInput } from "./types.js";
import { MaketouTransport } from "./transport.js";

export class Carts {
  readonly #transport: MaketouTransport;

  constructor(transport: MaketouTransport) {
    this.#transport = transport;
  }

  retrieve(cartId: string): Promise<CartDetails> {
    return this.#transport.get(
      `/api/v1/stores/cart/${encodeURIComponent(cartId)}`,
      "carts.retrieve",
      cartDetailsResponseSchema,
    );
  }

  create(input: CreateCartInput): Promise<Checkout> {
    return this.#transport.post<Checkout>(
      "/api/v1/stores/cart/checkout",
      input,
      "carts.create",
      checkoutResponseSchema,
    );
  }
}
