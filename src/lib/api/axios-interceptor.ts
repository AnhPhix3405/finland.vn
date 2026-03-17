import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError, AxiosRequestConfig } from "axios";
import { getToken, setToken, removeToken, TokenType, isTokenExpired } from "./token-manager";

// Queue state
let isRefreshing = false;
interface QueuePromise {
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}
let failedQueue: QueuePromise[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create base axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Add Authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken(TokenType.ADMIN) || getToken(TokenType.USER);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Refresh Token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Check if 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if we have tokens to refresh
      const adminToken = getToken(TokenType.ADMIN);
      const userToken = getToken(TokenType.USER);

      // If no tokens, logout immediately
      if (!adminToken && !userToken) {
        removeToken(TokenType.ADMIN);
        removeToken(TokenType.USER);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err: Error) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Determine which token to refresh
        const tokenToRefresh = adminToken || userToken;
        const type = adminToken ? TokenType.ADMIN : TokenType.USER;

        // Call refresh endpoint (use specific client to avoid recursion)
        // Note: We assume refresh token logic is in auth.service.ts
        // We will implement a simple refresh function here for the pattern
        
        // For now, let's simulate a refresh call. 
        // In a real app, you'd call: await refreshAdminToken() or similar
        
        // Attempt refresh logic (You need to implement your refresh logic here)
        // This is a placeholder - replace with your actual refresh API call
        const refreshResponse = await axios.post(
          type === TokenType.ADMIN ? "/api/admin/refresh-token" : "/api/auth/refresh-token",
          {},
          {
            headers: {
              Authorization: `Bearer ${tokenToRefresh}`,
            },
          }
        );

        if (refreshResponse.data.success) {
          const newToken = refreshResponse.data.data.access_token;
          setToken(newToken, type);
          processQueue(null, newToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          // Reset refreshing state
          isRefreshing = false;
          
          return apiClient(originalRequest);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (refreshError) {
        const err = refreshError as Error;
        processQueue(err, null);
        removeToken(TokenType.ADMIN);
        removeToken(TokenType.USER);
        isRefreshing = false;
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
