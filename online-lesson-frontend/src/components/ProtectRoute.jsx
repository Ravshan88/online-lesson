import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // Agar token bo‘lmasa, login sahifasiga yuboramiz
  if (!token) {
    return <Navigate to='/login' replace />;
  }

  // Aks holda, sahifani ko‘rsatamiz
  return children;
};

export default ProtectedRoute;
