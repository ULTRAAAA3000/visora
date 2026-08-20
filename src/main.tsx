import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { AuthProvider } from './lib/AuthContext';
import { ToastProvider } from './components/ToastProvider';
import ProtectedRoute from './components/ProtectedRoute';
import { initAnalytics, trackPageview } from './lib/analytics';
import { trackPageviewSelf } from './lib/selfAnalytics';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Connect from './pages/Connect';
import Docs from './pages/marketing/Docs';
import Guide from './pages/marketing/Guide';
import About from './pages/marketing/About';
import Privacy from './pages/marketing/Privacy';
import Terms from './pages/marketing/Terms';
import RefundPolicy from './pages/marketing/RefundPolicy';
import NotFound from './pages/NotFound';
import TemplatesPublic from './pages/marketing/TemplatesPublic';
import Changelog from './pages/marketing/Changelog';
import Contact from './pages/marketing/Contact';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Templates from './pages/dashboard/Templates';
import History from './pages/dashboard/History';
import TemplateEditor from './pages/dashboard/TemplateEditor';
import Bulk from './pages/dashboard/Bulk';
import DashboardGuide from './pages/dashboard/Guide';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBilling from './pages/admin/AdminBilling';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminMessages from './pages/admin/AdminMessages';

import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root element not found in index.html');

initAnalytics();

/** Fires a GA4 pageview on every in-app route change (see src/lib/analytics.ts). */
function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname + location.search);
    trackPageviewSelf(location.pathname);
  }, [location.pathname, location.search]);
  return null;
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <RouteTracker />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/templates" element={<TemplatesPublic />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/contact" element={<Contact />} />

          <Route
            path="/connect"
            element={
              <ProtectedRoute>
                <Connect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="templates" element={<Templates />} />
            <Route path="history" element={<History />} />
            <Route path="templates/:id" element={<TemplateEditor />} />
            <Route path="bulk" element={<Bulk />} />
            <Route path="guide" element={<DashboardGuide />} />
          </Route>

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="messages" element={<AdminMessages />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
