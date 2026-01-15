import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

export const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("rider_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeaders()),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data as any)?.message || "Request failed";
    throw new Error(message);
  }

  return data as T;
};
