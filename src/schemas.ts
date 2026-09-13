import { z } from "zod";
import type { Cart, CartDetails, CartStatus, Checkout, CustomerInfo } from "./types.js";

const cartStatusSchema = z.enum([
  "waiting_payment",
  "completed",
  "abandoned",
  "payment_failed",
]) satisfies z.ZodType<CartStatus>;

const customerInfoSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  lang: z.string().optional(),
  phone: z.string().optional(),
}) satisfies z.ZodType<CustomerInfo>;

const cartSchema = z.object({
  createdAt: z.string().datetime({ offset: true }),
  customerInfo: customerInfoSchema,
  id: z.string().uuid(),
  status: cartStatusSchema,
  updatedAt: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<Cart>;

export const cartDetailsResponseSchema = cartSchema.extend({
  meta: z.record(z.string(), z.string()).optional(),
  paymentId: z.string().uuid().optional(),
}) satisfies z.ZodType<CartDetails>;

export const checkoutResponseSchema = z.object({
  cart: cartSchema,
  redirectUrl: z.url(),
}) satisfies z.ZodType<Checkout>;
