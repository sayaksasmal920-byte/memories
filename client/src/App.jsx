import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";

// Pages
import LandingPage from "./pages/LandingPage";
import InviteLogin from "./pages/InviteLogin";
import ChangePassword from "./pages/ChangePassword";
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

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public landing brand portal */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Public invite login access page */}
          <Route path="/u/:token" element={<InviteLogin />} />

          {/* Forced password update flow */}
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Dedicated administrator panel */}
          <Route path="/admin" element={<AdminPanel />} />

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

          <Route
            path="/stickers"
            element={
              <Layout>
                <Stickers />
              </Layout>
            }
          />
          <Route
            path="/stickers/upload"
            element={
              <Layout>
                <UploadMedia />
              </Layout>
            }
          />

          <Route
            path="/media/:id"
            element={
              <Layout>
                <MediaDetail />
              </Layout>
            }
          />

          <Route
            path="/collections"
            element={
              <Layout>
                <Collections />
              </Layout>
            }
          />

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
