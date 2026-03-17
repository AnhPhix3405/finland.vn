import { useAdminStore } from "@/src/store/adminStore";
import { useAuthStore } from "@/src/store/authStore";

export enum TokenType {
  USER = "user",
  ADMIN = "admin",
}

export const getToken = (type: TokenType = TokenType.USER): string | null => {
  if (type === TokenType.ADMIN) {
    return useAdminStore.getState().accessToken;
  }
  return useAuthStore.getState().accessToken;
};

export const setToken = (token: string, type: TokenType = TokenType.USER): void => {
  if (type === TokenType.ADMIN) {
    useAdminStore.getState().setAuth(token);
  } else {
    useAuthStore.getState().setAuth(token);
  }
};

export const removeToken = (type: TokenType = TokenType.USER): void => {
  if (type === TokenType.ADMIN) {
    useAdminStore.getState().clearAuth();
  } else {
    useAuthStore.getState().clearAuth();
  }
};

export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    const exp = payload.exp;
    if (!exp) return true;
    // Check if token expires in less than 1 minute
    return Date.now() >= (exp - 60) * 1000;
  } catch {
    return true;
  }
};
