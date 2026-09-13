import { describe, expect, it } from "vitest";
import { Maketou, MaketouResponseError } from "../src/index.js";

describe("checkout response validation", () => {
  it("rejects a successful response that omits the checkout URL", async () => {
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () =>
        Response.json(
          {
            cart: {
              createdAt: "2025-11-28T14:27:00.805Z",
              customerInfo: {},
              id: "fd2d91d7-20d2-4b86-b067-d474fb0d1e60",
              status: "waiting_payment",
              updatedAt: "2025-11-28T14:27:00.805Z",
            },
          },
          { status: 201 },
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

    expect(error).toBeInstanceOf(MaketouResponseError);
    expect(error).toMatchObject({
      issues: [{ message: "expected string", path: "redirectUrl" }],
      operation: "carts.create",
      status: 201,
    });
  });
});
