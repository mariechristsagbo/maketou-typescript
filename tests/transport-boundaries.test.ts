import { describe, expect, it } from "vitest";
import { Maketou, MaketouError, MaketouResponseError } from "../src/index.js";

const checkoutInput = {
  email: "buyer@example.com",
  firstName: "Marie",
  lastName: "Christ",
  productDocumentId: "550e8400-e29b-41d4-a716-446655440000",
};

const cart = {
  createdAt: "2025-11-28T14:27:00.805Z",
  customerInfo: { email: "buyer@example.com" },
  id: "fd2d91d7-20d2-4b86-b067-d474fb0d1e60",
  status: "waiting_payment",
  updatedAt: "2025-11-28T14:27:00.805Z",
};

describe("HTTP response boundaries", () => {
  it("normalizes malformed successful JSON without exposing its body", async () => {
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () => new Response('{"email":"buyer@example.com"', { status: 201 }),
    });

    const error = await maketou.carts.create(checkoutInput).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(MaketouResponseError);
    expect(error).toMatchObject({
      issues: [{ message: "expected valid JSON", path: "response" }],
      operation: "carts.create",
      status: 201,
    });
    expect(String(error)).not.toContain("buyer@example.com");
  });

  it("rejects an unknown payment status without exposing the received value", async () => {
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () => Response.json({ ...cart, status: "refunded" }),
    });

    const error = await maketou.carts.retrieve(cart.id).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(MaketouResponseError);
    expect(error).toMatchObject({
      issues: [{ message: "invalid value", path: "status" }],
      status: 200,
    });
    expect(JSON.stringify(error)).not.toContain("refunded");
  });

  it("rejects malformed nested metadata without exposing customer information", async () => {
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () => Response.json({ ...cart, meta: { orderId: 42 } }),
    });

    const error = await maketou.carts.retrieve(cart.id).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(MaketouResponseError);
    expect(error).toMatchObject({
      issues: [{ message: "expected string", path: "meta.orderId" }],
      status: 200,
    });
    expect(JSON.stringify(error)).not.toContain("buyer@example.com");
  });

  it("rejects malformed customer information", async () => {
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () => Response.json({ ...cart, customerInfo: { email: 42 } }),
    });

    const error = await maketou.carts.retrieve(cart.id).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(MaketouResponseError);
    expect(error).toMatchObject({
      issues: [{ message: "expected string", path: "customerInfo.email" }],
      status: 200,
    });
  });

  it("accepts and strips additive response fields", async () => {
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () =>
        Response.json({
          ...cart,
          customerInfo: { ...cart.customerInfo, futureCustomerField: true },
          futureField: "safe additive field",
        }),
    });

    const result = await maketou.carts.retrieve(cart.id);

    expect(result).toMatchObject(cart);
    expect(result).not.toHaveProperty("futureField");
    expect(result.customerInfo).not.toHaveProperty("futureCustomerField");
  });

  it("keeps the actual HTTP status when an error body is malformed", async () => {
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () => new Response("<html>upstream failure</html>", { status: 500 }),
    });

    const error = await maketou.carts.retrieve(cart.id).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(MaketouError);
    expect(error).toMatchObject({ code: undefined, operation: "carts.retrieve", status: 500 });
  });

  it("preserves fetch failures for callers that need native causes", async () => {
    const networkError = new TypeError("connection refused");
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async () => {
        throw networkError;
      },
    });

    await expect(maketou.carts.retrieve(cart.id)).rejects.toBe(networkError);
  });
});
