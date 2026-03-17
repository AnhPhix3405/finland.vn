import axios from "axios";
import apiClient from "./axios-interceptor";

// Create a separate client for refresh requests (no interceptor)
export const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Export the main API client with interceptors
export default apiClient;
