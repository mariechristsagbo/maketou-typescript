import { describe, expect, it } from "vitest";
import { Maketou } from "../src/index.js";

describe("carts.retrieve", () => {
  it("retrieves a cart through an encoded cart path", async () => {
    const requests: Request[] = [];
    const maketou = new Maketou({
      apiKey: "test-api-key",
      fetch: async (input, init) => {
        requests.push(new Request(input, init));
        return Response.json({
          createdAt: "2025-11-28T14:27:00.805Z",
          customerInfo: { email: "customer@example.com" },
          id: "fd2d91d7-20d2-4b86-b067-d474fb0d1e60",
          meta: { orderId: "order-123" },
          paymentId: "19cf6af4-7e45-4f9f-96e7-89eb9c49d7b0",
          status: "completed",
          updatedAt: "2025-11-28T14:29:00.805Z",
        });
      },
    });

    const cart = await maketou.carts.retrieve("cart/with?reserved#characters");

    expect(cart).toMatchObject({
      meta: { orderId: "order-123" },
      paymentId: "19cf6af4-7e45-4f9f-96e7-89eb9c49d7b0",
      status: "completed",
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.method).toBe("GET");
    expect(requests[0]?.url).toBe(
      "https://api.maketou.net/api/v1/stores/cart/cart%2Fwith%3Freserved%23characters",
    );
    expect(requests[0]?.headers.get("authorization")).toBe("Bearer test-api-key");
    expect(requests[0]?.headers.has("content-type")).toBe(false);
  });
});
