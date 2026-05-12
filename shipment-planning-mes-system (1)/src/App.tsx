import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlanningPage } from './pages/PlanningPage';
import { ExecutionPage } from './pages/ExecutionPage';
import { VehiclePlanningPage } from './pages/VehiclePlanningPage';
import { Loading3DPage } from './pages/Loading3DPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { currentUser, initializeData, shipments } = useAppStore();

  // Initialize data if logged in but no data
  useEffect(() => {
    if (currentUser && shipments.length === 0) {
      initializeData();
    }
  }, [currentUser]);

  // Start ERP sync polling
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      // In production: calls /api/erp/sync
      // Here: simulated sync tick (handled in store)
    }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/planning"
          element={
            <ProtectedRoute>
              <PlanningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/execution"
          element={
            <ProtectedRoute>
              <ExecutionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-planning"
          element={
            <ProtectedRoute>
              <VehiclePlanningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loading-3d"
          element={
            <ProtectedRoute>
              <Loading3DPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
