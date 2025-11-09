import axios from "axios";
import { jwtDecode } from "jwt-decode";

const axiosClient = axios.create({
  baseURL: "http://localhost:8000", // 🔑 Backend API
  timeout: 6000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor - add token to requests
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    // Check if token is expired
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        // Token expired, remove it and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(new Error("Token expired"));
      }
    } catch (error) {
      // Invalid token, remove it
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      window.location.href = "/login";
      return Promise.reject(new Error("Invalid token"));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 errors (unauthorized/expired token)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
