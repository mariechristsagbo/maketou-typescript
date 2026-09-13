export type CartStatus =
  | "waiting_payment"
  | "completed"
  | "abandoned"
  | "payment_failed";

export interface CustomerInfo {
  email?: string;
  firstName?: string;
  lastName?: string;
  lang?: string;
  phone?: string;
}

export interface Cart {
  createdAt: string;
  customerInfo: CustomerInfo;
  id: string;
  status: CartStatus;
  updatedAt: string;
}

export interface CartDetails extends Cart {
  meta?: Record<string, string>;
  paymentId?: string;
}

export interface CreateCartInput {
  customerPrice?: number;
  email: string;
  firstName: string;
  lastName: string;
  meta?: Record<string, string>;
  phone?: string;
  productDocumentId: string;
  redirectURL?: string;
}

export interface CartDetails extends Cart {
  meta?: Record<string, string>;
  paymentId?: string;
}

export interface Checkout {
  cart: Cart;
  redirectUrl: string;
}
