// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UserHome from "./pages/UserHome";
import AdminHome from "./pages/AdminHome";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      {/* protected routes remain */}
      <Route path="/user" element={<PrivateRoute role="user"><UserHome /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute role="admin"><AdminHome /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
