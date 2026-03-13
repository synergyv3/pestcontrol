import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import WorkOrders from './pages/WorkOrders';
import WorkOrderDetail from './pages/WorkOrderDetail';
import Schedule from './pages/Schedule';
import Invoices from './pages/Invoices';
import Users from './pages/Users';

function ProtectedRoute({ children, adminOnly = false, managerOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner spinner-dark" /><span style={{color:'#64748B'}}>Loading...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (managerOnly && !['admin', 'manager'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner spinner-dark" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/new" element={<ProtectedRoute managerOnly><CustomerDetail isNew /></ProtectedRoute>} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="work-orders" element={<WorkOrders />} />
            <Route path="work-orders/new" element={<ProtectedRoute managerOnly><WorkOrderDetail isNew /></ProtectedRoute>} />
            <Route path="work-orders/:id" element={<WorkOrderDetail />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="invoices" element={<ProtectedRoute managerOnly><Invoices /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
