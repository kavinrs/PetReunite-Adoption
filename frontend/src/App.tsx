// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import UserHome from "./pages/UserHome";
import VolunteerForm from "./pages/VolunteerForm";
import AdminHome from "./pages/AdminHome";
import PendingApprovals from "./pages/admin/PendingApprovals";
import AdminRegister from "./pages/AdminRegister";
import AdminProfile from "./pages/AdminProfile";
import AdminLostReportDetail from "./pages/AdminLostReportDetail";
import AdminFoundReportDetail from "./pages/AdminFoundReportDetail";
import AdminVolunteerDetail from "./pages/AdminVolunteerDetail";
import PrivateRoute from "./components/PrivateRoute";
import UserProfile from "./pages/UserProfile";
import ReportFoundPet from "./pages/ReportFoundPet";
import ReportLostPet from "./pages/ReportLostPet";
import PetDetailsPage from "./pages/PetDetailsPage";
import LostReportDetail from "./pages/LostReportDetail";
import FoundReportDetail from "./pages/FoundReportDetail";
import MyAdoptionRequests from "./pages/MyAdoptionRequests";
import Home from "./pages/Home";
import { useViewportStandardization } from "./hooks/useViewportStandardization";
import "./App.css";

// Admin Components
// Legacy admin report pages are routed to AdminHome tabs via redirects

export default function App() {
  // Apply viewport standardization to ensure consistent 100% scaling across all pages
  useViewportStandardization();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin/register" element={<AdminRegister />} />
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
        path="/user/volunteer"
        element={
          <PrivateRoute role="user">
            <VolunteerForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/user/found/:id"
        element={
          <PrivateRoute role="user">
            <FoundReportDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/user/lost/:id"
        element={
          <PrivateRoute role="user">
            <LostReportDetail />
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
        path="/pets/:id"
        element={
          <PrivateRoute role="user">
            <PetDetailsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/user/adoption-requests"
        element={
          <PrivateRoute role="user">
            <MyAdoptionRequests />
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
      <Route
        path="/admin/pending-approvals"
        element={
          <PrivateRoute role="admin">
            <PendingApprovals />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/lost/:id"
        element={
          <PrivateRoute role="admin">
            <AdminLostReportDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/found/:id"
        element={
          <PrivateRoute role="admin">
            <AdminFoundReportDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/volunteers/:id"
        element={
          <PrivateRoute role="admin">
            <AdminVolunteerDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/found-pets"
        element={
          <PrivateRoute role="admin">
            <Navigate to="/admin?tab=found" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/volunteers"
        element={
          <PrivateRoute role="admin">
            <Navigate to="/admin?tab=volunteers" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/lost-pets"
        element={
          <PrivateRoute role="admin">
            <Navigate to="/admin?tab=lost" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/adoption-requests"
        element={
          <PrivateRoute role="admin">
            <Navigate to="/admin?tab=adoptions" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <PrivateRoute role="admin">
            <AdminProfile />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
