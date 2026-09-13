import type { Cart, CartStatus, Checkout, CustomerInfo } from "./types.js";

export type ParseResult<T> =
  | { issues: readonly string[]; success: false }
  | { success: true; value: T };

const CART_STATUSES = new Set<CartStatus>([
  "waiting_payment",
  "completed",
  "abandoned",
  "payment_failed",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(value: unknown, path: string, issues: string[]): string | undefined {
  if (typeof value !== "string") {
    issues.push(`${path}: expected a string`);
    return undefined;
  }

  return value;
}

function readOptionalString(value: unknown, path: string, issues: string[]): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    issues.push(`${path}: expected a string`);
    return undefined;
  }

  return value;
}

function parseCustomerInfo(value: unknown, issues: string[]): CustomerInfo | undefined {
  if (!isRecord(value)) {
    issues.push("cart.customerInfo: expected an object");
    return undefined;
  }

  return {
    email: readOptionalString(value.email, "cart.customerInfo.email", issues),
    firstName: readOptionalString(value.firstName, "cart.customerInfo.firstName", issues),
    lastName: readOptionalString(value.lastName, "cart.customerInfo.lastName", issues),
    lang: readOptionalString(value.lang, "cart.customerInfo.lang", issues),
    phone: readOptionalString(value.phone, "cart.customerInfo.phone", issues),
  };
}

function parseCart(value: unknown, issues: string[]): Cart | undefined {
  if (!isRecord(value)) {
    issues.push("cart: expected an object");
    return undefined;
  }

  const id = readRequiredString(value.id, "cart.id", issues);
  const createdAt = readRequiredString(value.createdAt, "cart.createdAt", issues);
  const updatedAt = readRequiredString(value.updatedAt, "cart.updatedAt", issues);
  const customerInfo = parseCustomerInfo(value.customerInfo, issues);
  const status = value.status;
  const isKnownStatus = typeof status === "string" && CART_STATUSES.has(status as CartStatus);

  if (!isKnownStatus) {
    issues.push("cart.status: expected a known cart status");
  }

  if (
    id === undefined ||
    createdAt === undefined ||
    updatedAt === undefined ||
    customerInfo === undefined ||
    !isKnownStatus
  ) {
    return undefined;
  }

  return { createdAt, customerInfo, id, status: status as CartStatus, updatedAt };
}

export function parseCheckout(value: unknown): ParseResult<Checkout> {
  const issues: string[] = [];

  if (!isRecord(value)) {
    return { issues: ["response: expected an object"], success: false };
  }

  const cart = parseCart(value.cart, issues);
  const redirectUrl = readRequiredString(value.redirectUrl, "redirectUrl", issues);

  if (cart === undefined || redirectUrl === undefined) {
    return { issues, success: false };
  }

  return { success: true, value: { cart, redirectUrl } };
}
