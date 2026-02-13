import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ProviderLandingPage from './pages/ProviderLandingPage';
import ProviderSignupWizard from './pages/ProviderSignupWizard';
import ProviderCheckout from './pages/ProviderCheckout';
import VerificationPage from './pages/VerificationPage';
import Dashboard from './components/features/Dashboard';

import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProviderPricingPage from './pages/ProviderPricingPage';

import DashboardLayout from './components/layout/DashboardLayout';
import LeadsPage from './pages/LeadsPage';
import QuotesPage from './pages/QuotesPage';
import PerformancePage from './pages/PerformancePage';
import SettingsPage from './pages/SettingsPage';
import BuyLeadsPage from './pages/BuyLeadsPage';
import AdminDashboard from './pages/AdminDashboard';
import ProviderLoginPage from './pages/ProviderLoginPage';
import BackgroundBlobs from './components/layout/BackgroundBlobs';
import HowItWorksPage from './pages/HowItWorksPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <BackgroundBlobs />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/comment-ca-marche" element={<HowItWorksPage />} />
          <Route path="/pro" element={<ProviderLandingPage />} />
          <Route path="/pro/login" element={<ProviderLoginPage />} />
          <Route path="/pro/signup" element={<ProviderSignupWizard />} />
          <Route path="/pro/verify" element={<VerificationPage />} />
          <Route path="/pro/pricing" element={
            <ProtectedRoute requireVerified={true}>
              <ProviderPricingPage />
            </ProtectedRoute>
          } />
          <Route path="/pro/checkout" element={
            <ProtectedRoute requireVerified={true}>
              <ProviderCheckout />
            </ProtectedRoute>
          } />
          <Route path="/pro/dashboard" element={
            <ProtectedRoute requireVerified={true}>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/pro/leads" element={
            <ProtectedRoute requireVerified={true}>
              <DashboardLayout>
                <LeadsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/pro/quotes" element={
            <ProtectedRoute requireVerified={true}>
              <DashboardLayout>
                <QuotesPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/pro/performance" element={
            <ProtectedRoute requireVerified={true}>
              <DashboardLayout>
                <PerformancePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/pro/settings" element={
            <ProtectedRoute requireVerified={true}>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/pro/buy-leads" element={
            <ProtectedRoute requireVerified={true}>
              <DashboardLayout>
                <BuyLeadsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
