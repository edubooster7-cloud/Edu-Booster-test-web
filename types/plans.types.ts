export type PlanType = "free" | "paid";
export type Currency = "USD" | "CDF";

export interface PlanPrice {
  id: string;
  planId: string;
  currency: Currency;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  type: PlanType;
  name: string;
  description: string | null;
  price: number;
  questionsPerDay: number | null;
  totalQuestions: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  prices: PlanPrice[];
}

export interface GetPlansResponse {
  status: "success";
  results: number;
  data: {
    plans: Plan[];
  };
}

export interface GetPlanByIdResponse {
  status: "success";
  data: {
    plan: Plan;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "expired" | "cancelled" | "pending";
  startedAt: string;
  expiresAt: string | null;
  cancelledAt: string | null;
  renewedAt: string | null;
  paymentRef: string | null;
  paymentMethod: string | null;
  clientPhone: string | null;
  currency: string | null;
  plan: Plan;
}

export interface GetMySubscriptionResponse {
  status: "success";
  data: {
    subscription: Subscription | null;
  };
}

export interface InitiateChargeResponse {
  status: string;
  message: string;
  data: {
    payment: {
      sessionId: string;
    };
  };
}
