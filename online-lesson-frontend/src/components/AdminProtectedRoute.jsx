import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../api/userApi";
import { Spin } from "antd";

const AdminProtectedRoute = ({ children }) => {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token");

  // Fetch current user to check role
  const {
    data: user,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: userApi.me,
    enabled: !!token,
    retry: false
  });

  // If no token, redirect to login
  if (!token) {
    return <Navigate to='/login' replace />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh"
        }}
      >
        <Spin size='large' />
      </div>
    );
  }

  // If error or user is not admin, redirect to home
  if (isError || !user || user.role !== "admin") {
    return <Navigate to='/home' replace />;
  }

  // User is admin, show the page
  return children;
};

export default AdminProtectedRoute;
