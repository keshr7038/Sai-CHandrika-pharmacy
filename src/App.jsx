import React, { useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import PortalSelection from './components/PortalSelection';
import OwnerLogin from './components/OwnerLogin';
import CustomerLogin from './components/CustomerLogin';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CustomerDashboard from './components/CustomerDashboard';
import Medicines from './components/Medicines';
import Sales from './components/Sales';
import Purchases from './components/Purchases';
import Vendors from './components/Vendors';
import Transactions from './components/Transactions';
import Profile from './components/Profile';
import AIChat from './components/AIChat';
import Customers from './components/Customers';
import DoctorConsultation from './components/DoctorConsultation';
import AppointmentsManager from './components/AppointmentsManager';
import './App.css';

// ===== PROTECTED ROUTE WRAPPERS =====
function OwnerProtectedRoute({ children }) {
  const { user } = useContext(AppContext);
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (user.role !== 'owner') {
    return <Navigate to="/customer-dashboard" replace />;
  }
  
  return children;
}

function CustomerProtectedRoute({ children }) {
  const { user } = useContext(AppContext);
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (user.role !== 'customer') {
    return <Navigate to="/owner-dashboard" replace />;
  }
  
  return children;
}

// ===== DASHBOARD WRAPPERS WITH STATE NAVIGATION =====
function OwnerDashboardWrapper() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard setCurrentTab={setCurrentTab} />;
      case 'medicines': return <Medicines />;
      case 'sales': return <Sales />;
      case 'purchases': return <Purchases />;
      case 'vendors': return <Vendors />;
      case 'transactions': return <Transactions />;
      case 'appointments': return <AppointmentsManager />;
      case 'customers': return <Customers />;
      case 'ai-assistant': return <AIChat />;
      case 'profile': return <Profile />;
      default: return <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderActiveView()}
    </Layout>
  );
}

function CustomerDashboardWrapper() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard': return <CustomerDashboard setCurrentTab={setCurrentTab} />;
      case 'shop': return <Sales />;
      case 'orders': return <Transactions />;
      case 'consultation': return <DoctorConsultation />;
      case 'ai-assistant': return <AIChat />;
      case 'profile': return <Profile />;
      default: return <CustomerDashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderActiveView()}
    </Layout>
  );
}

// ===== MAIN APP CONTENT =====
function AppContent() {
  const { loading, dbError, loadAllData } = useContext(AppContext);

  // Show loading while restoring session or fetching database status
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 animate-pulse">
          <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600">Loading Sai Chandrika Pharmacy...</p>
        <p className="text-xs text-gray-400 mt-1">Checking active user session</p>
      </div>
    );
  }

  // Show DB connection error
  if (dbError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Database Connection Error</h2>
          <p className="text-sm text-gray-500 mb-4">{dbError}</p>
          <p className="text-xs text-gray-400 mb-6">
            Make sure you've run the SQL migration in your Supabase project's SQL Editor.
          </p>
          <button onClick={loadAllData} className="btn-primary mx-auto">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Landing / Role Selection */}
      <Route path="/" element={<PortalSelection />} />
      
      {/* Portal Login Pages */}
      <Route path="/owner-login" element={<Navigate to="/" replace />} />
      <Route path="/customer-login" element={<Navigate to="/" replace />} />

      {/* Protected Owner Dashboard */}
      <Route 
        path="/owner-dashboard" 
        element={
          <OwnerProtectedRoute>
            <OwnerDashboardWrapper />
          </OwnerProtectedRoute>
        } 
      />

      {/* Protected Customer Dashboard */}
      <Route 
        path="/customer-dashboard" 
        element={
          <CustomerProtectedRoute>
            <CustomerDashboardWrapper />
          </CustomerProtectedRoute>
        } 
      />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
