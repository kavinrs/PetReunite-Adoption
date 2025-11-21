// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UserHome from "./pages/UserHome";
import AdminHome from "./pages/AdminHome";
import PrivateRoute from "./components/PrivateRoute";
import UserProfile from "./pages/UserProfile";
import ReportFoundPet from "./pages/ReportFoundPet";
import ReportLostPet from "./pages/ReportLostPet";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* protected routes remain */}
      <Route
        path="/user"
        element={
          <PrivateRoute role="user">
            <UserHome />
          </PrivateRoute>
        }
      />
      <Route
        path="/user/profile"
        element={
          <PrivateRoute role="user">
            <UserProfile />
          </PrivateRoute>
        }
      />
      <Route
        path="/user/report-lost"
        element={
          <PrivateRoute role="user">
            <ReportLostPet />
          </PrivateRoute>
        }
      />
      <Route
        path="/user/report-found"
        element={
          <PrivateRoute role="user">
            <ReportFoundPet />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute role="admin">
            <AdminHome />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
