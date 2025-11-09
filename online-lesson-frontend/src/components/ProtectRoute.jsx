import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children }) => {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token");

  // Agar token bo‘lmasa, login sahifasiga yuboramiz
  if (!token) {
    return <Navigate to='/login' replace />;
  }

  // Check if token is expired
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      // Token expired, remove it and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      return <Navigate to='/login' replace />;
    }
  } catch (error) {
    // Invalid token, remove it and redirect to login
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    return <Navigate to='/login' replace />;
  }

  // Aks holda, sahifani ko‘rsatamiz
  return children;
};

export default ProtectedRoute;
