import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Income from './components/Income/Income';
import Analytics from './components/Analytics/Analytics';
import Settings from './components/Settings/Settings';
import Login from './components/Auth/Login';
import BudgetManagement from './components/Budget/BudgetManagement';
import BankStatements from './components/BankStatements/BankStatements';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/income"
              element={
                <PrivateRoute>
                  <Layout>
                    <Income />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <PrivateRoute>
                  <Layout>
                    <BudgetManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/statements"
              element={
                <PrivateRoute>
                  <Layout>
                    <BankStatements />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;