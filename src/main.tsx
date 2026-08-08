import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Connect from './pages/Connect';
import Docs from './pages/marketing/Docs';
import Guide from './pages/marketing/Guide';
import TemplatesPublic from './pages/marketing/TemplatesPublic';
import Changelog from './pages/marketing/Changelog';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Templates from './pages/dashboard/Templates';
import TemplateEditor from './pages/dashboard/TemplateEditor';
import DashboardGuide from './pages/dashboard/Guide';

import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root element not found in index.html');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/templates" element={<TemplatesPublic />} />
          <Route path="/changelog" element={<Changelog />} />

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
            <Route path="templates/:id" element={<TemplateEditor />} />
            <Route path="guide" element={<DashboardGuide />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
