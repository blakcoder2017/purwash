import { apiFetch } from "./client";
import { Order, OrderStatus, User } from "../types";

export const login = async (email: string, password: string) => {
  return apiFetch<{ success: boolean; data: { user: User; token: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
};

export const getProfile = async () => {
  return apiFetch<{ success: boolean; data: { user: User } }>("/auth/profile");
};

export const updateProfile = async (payload: {
  profile?: { firstName?: string; lastName?: string; phone?: string; avatar?: string };
}) => {
  return apiFetch<{ success: boolean; data: { user: User } }>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  return apiFetch<{ success: boolean; message: string }>(
    "/auth/change-password",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
};

export const verifyMomo = async (payload: {
  momoNumber: string;
  momoNetwork: string;
  businessName?: string;
}) => {
  return apiFetch<{ success: boolean; data: { resolvedName: string } }>(
    "/auth/verify-momo",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
};

export const getPendingOrders = async () => {
  return apiFetch<Order[]>("/v1/manage/orders/pending");
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  return apiFetch<{ success: boolean; newStatus: OrderStatus }>(
    `/v1/manage/orders/${orderId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
};

export const getJobHistory = async (limit = 20) => {
  return apiFetch<Order[]>(`/v1/manage/orders/history?limit=${limit}`);
};

export const getWallet = async () => {
  return apiFetch<{ success: boolean; data: any }>("/wallet");
};

export const registerPushToken = async (token: string) => {
  return apiFetch<{ success: boolean; tokens: string[] }>("/users/push-token", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
};
