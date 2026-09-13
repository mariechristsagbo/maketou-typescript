import { describe, expect, it } from "vitest";
import { Maketou, MaketouRateLimitedError } from "../src/index.js";

describe("Maketou API errors", () => {
  it("exposes retry metadata for a rate-limited checkout", async () => {
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () =>
        Response.json(
          {
            code: "RATE_LIMITED",
            message: "Too many requests. Please retry later.",
          },
          {
            headers: { "Retry-After": "7" },
            status: 429,
          },
        ),
    });

    const error = await maketou.carts
      .create({
        productDocumentId: "550e8400-e29b-41d4-a716-446655440000",
        email: "customer@example.com",
        firstName: "Marie",
        lastName: "Christ",
      })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(MaketouRateLimitedError);
    expect(error).toMatchObject({
      code: "RATE_LIMITED",
      operation: "carts.create",
      retryAfter: 7,
      status: 429,
    });
  });
});
