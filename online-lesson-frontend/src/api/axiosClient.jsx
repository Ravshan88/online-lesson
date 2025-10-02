import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8000", // 🔑 Backend API
  timeout: 6000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Agar token kerak bo‘lsa, shu yerda qo‘shish mumkin
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
