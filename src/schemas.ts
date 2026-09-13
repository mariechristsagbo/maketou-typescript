import { z } from "zod";
import type { Cart, CartDetails, CartStatus, Checkout, CustomerInfo } from "./types.js";

const cartStatusSchema = z.enum([
  "waiting_payment",
  "completed",
  "abandoned",
  "payment_failed",
]);

const customerInfoSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  lang: z.string().optional(),
  phone: z.string().optional(),
});

const cartSchema = z.object({
  createdAt: z.string().datetime({ offset: true }),
  customerInfo: customerInfoSchema,
  id: z.string().uuid(),
  status: cartStatusSchema,
  updatedAt: z.string().datetime({ offset: true }),
});

export const cartDetailsResponseSchema = cartSchema.extend({
  meta: z.record(z.string(), z.string()).optional(),
  paymentId: z.string().uuid().optional(),
});

export const checkoutResponseSchema = z.object({
  cart: cartSchema,
  redirectUrl: z.url(),
});

const _cartStatusSchema: z.ZodType<CartStatus> = cartStatusSchema;
const _customerInfoSchema: z.ZodType<CustomerInfo> = customerInfoSchema;
const _cartSchema: z.ZodType<Cart> = cartSchema;
const _cartDetailsSchema: z.ZodType<CartDetails> = cartDetailsResponseSchema;
const _checkoutSchema: z.ZodType<Checkout> = checkoutResponseSchema;

void [_cartStatusSchema, _customerInfoSchema, _cartSchema, _cartDetailsSchema, _checkoutSchema];
