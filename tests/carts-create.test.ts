import { describe, expect, it } from "vitest";
import { Maketou } from "../src/index.js";

const checkoutResponse = {
  cart: {
    id: "fd2d91d7-20d2-4b86-b067-d474fb0d1e60",
    createdAt: "2025-11-28T14:27:00.805Z",
    updatedAt: "2025-11-28T14:27:00.805Z",
    status: "waiting_payment",
    customerInfo: {
      email: "customer@example.com",
      firstName: "Marie",
      lastName: "Christ",
    },
  },
  redirectUrl: "https://checkout.example.test/session",
};

describe("carts.create", () => {
  it("creates an authenticated checkout cart and returns the documented response", async () => {
    const requests: Request[] = [];
    const fakeFetch: typeof globalThis.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      requests.push(new Request(input, init));
      return Response.json(checkoutResponse, { status: 201 });
    };
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: fakeFetch,
    });

    const checkout = await maketou.carts.create({
      productDocumentId: "550e8400-e29b-41d4-a716-446655440000",
      email: "customer@example.com",
      firstName: "Marie",
      lastName: "Christ",
      redirectURL: "https://example.com/success",
    });

    expect(checkout).toEqual(checkoutResponse);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe("https://api.maketou.net/api/v1/stores/cart/checkout");
    expect(requests[0]?.method).toBe("POST");
    expect(requests[0]?.headers.get("authorization")).toBe("Bearer test-api-key");
    expect(requests[0]?.headers.get("content-type")).toBe("application/json");
    await expect(requests[0]?.json()).resolves.toEqual({
      productDocumentId: "550e8400-e29b-41d4-a716-446655440000",
      email: "customer@example.com",
      firstName: "Marie",
      lastName: "Christ",
      redirectURL: "https://example.com/success",
    });
  });
});
