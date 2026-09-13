# @marie-christ/maketou

A small, community-maintained TypeScript SDK for the [Maketou public API](https://docs-api.maketou.com/).

> **Unofficial.** This independent package is not affiliated with, endorsed by, or maintained by Maketou.

## Scope

The current public Maketou API documents two server-side operations, both available here:

- Create a checkout cart with `maketou.carts.create(...)`.
- Retrieve a cart with `maketou.carts.retrieve(cartId)`.

No undocumented endpoints, webhooks, automatic retries, or payment-confirmation shortcuts are included.

## Requirements

- Node.js 20 or newer.
- A Maketou API key, kept on the server only.

## Install

```sh
pnpm add @marie-christ/maketou
```

This package has no runtime dependencies.

## Quick start

```ts
import { Maketou } from "@marie-christ/maketou";

const apiKey = process.env.MAKETOU_API_KEY;
if (apiKey === undefined) {
  throw new Error("MAKETOU_API_KEY is required.");
}

const maketou = new Maketou({ apiKey });

const checkout = await maketou.carts.create({
  productDocumentId: "<product-document-id>",
  email: "buyer@example.com",
  firstName: "Marie",
  lastName: "Christ",
  redirectURL: "https://your-app.example/payments/complete",
});

// Redirect the buyer to checkout.redirectUrl and persist checkout.cart.id.
const cart = await maketou.carts.retrieve(checkout.cart.id);
if (cart.status === "completed") {
  // Grant access only after a server-side status check.
}
```

`redirectURL` deliberately preserves Maketou’s request casing. The returned checkout URL is `redirectUrl`.

## API

### `new Maketou({ apiKey, fetch? })`

`apiKey` is required. `fetch` is optional and exists for controlled server runtimes and tests; Node 20+ provides `fetch` globally.

### `maketou.carts.create(input)`

Calls `POST /api/v1/stores/cart/checkout` and resolves to:

```ts
interface Checkout {
  cart: Cart;
  redirectUrl: string;
}
```

`input` requires `productDocumentId`, `email`, `firstName`, and `lastName`. Optional documented fields are `phone`, `redirectURL`, `meta` (`Record<string, string>`), and `customerPrice` for Maketou products configured with free pricing.

### `maketou.carts.retrieve(cartId)`

Calls `GET /api/v1/stores/cart/{cartId}` and resolves to `CartDetails`. Known status values are:

```ts
"waiting_payment" | "completed" | "abandoned" | "payment_failed"
```

Only `completed` should be treated as a successful payment.

## Errors and rate limits

Every API failure is a `MaketouError` with `operation`, HTTP `status`, and optional API `code`.

- `MaketouRateLimitedError` is used for HTTP `429` and exposes `retryAfter` when Maketou returns `Retry-After`.
- `MaketouResponseError` is used when a successful response does not match the documented shape. Its `issues` contain field paths and expected types, never request or response values.
- `MaketouConfigurationError` is thrown immediately for an empty API key.

```ts
import { MaketouError, MaketouRateLimitedError } from "@marie-christ/maketou";

try {
  await maketou.carts.retrieve(cartId);
} catch (error: unknown) {
  if (error instanceof MaketouRateLimitedError) {
    // Wait error.retryAfter seconds when it is defined before deciding to retry.
  } else if (error instanceof MaketouError) {
    // Handle the documented operation, HTTP status, and API code.
  } else {
    throw error;
  }
}
```

The SDK does **not** retry automatically. In particular, it never retries checkout creation: Maketou does not document an idempotency mechanism for that operation.

## Security

- Do not expose `MAKETOU_API_KEY` to browsers, mobile clients, logs, source control, or public error responses.
- Create checkouts and verify cart status from trusted server code.
- Store `checkout.cart.id` and verify the cart server-side before granting access.
- Treat `redirectUrl` as a payment destination supplied by Maketou; do not use it as proof of payment.

## Limitations

- The public documentation currently lists only checkout creation and cart retrieval. This SDK intentionally implements only those operations.
- No Maketou sandbox, webhooks, idempotency key, pagination, or retry contract is documented in the public API references used here.
- `customerPrice` has no documented currency, precision, or range constraints; the SDK forwards the typed number without inventing validation rules.
- Runtime validation covers API responses. Request fields are strongly typed in TypeScript; Maketou remains the authoritative validator for request semantics.
- No integration tests run against Maketou because they require a non-production API key and a documented sandbox or test store. If Maketou later provides one, use `MAKETOU_API_KEY` only through the environment and never commit it.

## Development

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation audit

[`AUDIT.md`](./AUDIT.md) records observed discrepancies between the public documentation, OpenAPI specification, and unauthenticated production responses as of 2026-09-13.

## License

[MIT](./LICENSE)
