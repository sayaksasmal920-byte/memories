import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Pages
import LandingPage from "./pages/LandingPage";
import InviteLogin from "./pages/InviteLogin";

import Dashboard from "./pages/Dashboard";
import Photos from "./pages/Photos";
import Videos from "./pages/Videos";
import Stickers from "./pages/Stickers";
import UploadMedia from "./pages/UploadMedia";
import MediaDetail from "./pages/MediaDetail";
import Collections from "./pages/Collections";
import Favorites from "./pages/Favorites";
import SearchPage from "./pages/SearchPage";
import AdminPanel from "./pages/AdminPanel";

// Guard: only renders children if user is authenticated, else redirects to landing
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // Wait for auth check before deciding
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public landing brand portal */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Public invite login access page */}
          <Route path="/u/:token" element={<InviteLogin />} />


          {/* Dedicated administrator panel — signed-in users only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Protected dashboard layouts */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />

          <Route
            path="/photos"
            element={
              <Layout>
                <Photos />
              </Layout>
            }
          />
          <Route
            path="/photos/upload"
            element={
              <Layout>
                <UploadMedia />
              </Layout>
            }
          />

          <Route
            path="/videos"
            element={
              <Layout>
                <Videos />
              </Layout>
            }
          />
          <Route
            path="/videos/upload"
            element={
              <Layout>
                <UploadMedia />
              </Layout>
            }
          />

          <Route path="/stickers" element={<Navigate to="/dashboard" replace />} />
          <Route path="/stickers/upload" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/media/:id"
            element={
              <Layout>
                <MediaDetail />
              </Layout>
            }
          />

          <Route path="/collections" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/favorites"
            element={
              <Layout>
                <Favorites />
              </Layout>
            }
          />

          <Route
            path="/search"
            element={
              <Layout>
                <SearchPage />
              </Layout>
            }
          />

          {/* Catch-all redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
