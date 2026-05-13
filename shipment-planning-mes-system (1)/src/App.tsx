import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ErpPoolPage } from './pages/ErpPoolPage';
import { PreparationControlPage } from './pages/PreparationControlPage';
import { OperationPlanningPage } from './pages/OperationPlanningPage';
import { ShipmentCompletionPage } from './pages/ShipmentCompletionPage';
import { VehiclePlanningPage } from './pages/VehiclePlanningPage';
import { Loading3DPage } from './pages/Loading3DPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';

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
  const { currentUser, initializeData } = useAppStore();

  useEffect(() => {
    if (currentUser) {
      // In production, data comes from API - initialize mock as fallback
      initializeData();
    }
  }, [currentUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Ana Sistem Akışı */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/erp-pool" element={<ProtectedRoute><ErpPoolPage /></ProtectedRoute>} />
        <Route path="/preparation" element={<ProtectedRoute><PreparationControlPage /></ProtectedRoute>} />
        <Route path="/planning" element={<ProtectedRoute><OperationPlanningPage /></ProtectedRoute>} />
        <Route path="/vehicle-planning" element={<ProtectedRoute><VehiclePlanningPage /></ProtectedRoute>} />
        <Route path="/loading-3d" element={<ProtectedRoute><Loading3DPage /></ProtectedRoute>} />
        <Route path="/execution" element={<ProtectedRoute><ShipmentCompletionPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}