import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);

  // Authenticate session on load or token update
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    async function fetchMe() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error("Auth verify session error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, [token]);

  // Login handler
  const login = async (inviteToken, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteToken, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Set user immediately to prevent layout redirect before token useEffect resolves
      setUser({
        userId: data.userId,
        inviteToken: data.inviteToken,
        mustChangePassword: data.mustChangePassword,
      });

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setLoading(false);
      return data; // returns token, mustChangePassword, inviteToken, userId
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Change password handler
  const changePassword = async (newPassword) => {
    const res = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update password");
    }

    // Refresh user state
    setUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
    return data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  // API wrapper that inserts Auth headers dynamically
  const apiCall = async (endpoint, options = {}) => {
    const headers = options.headers || {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      logout();
    }

    return res;
  };

  const downloadFile = async (url, title) => {
    try {
      const downloadName = title || "memory";
      const proxyUrl = `/api/media/download-file?url=${encodeURIComponent(url)}&name=${encodeURIComponent(downloadName)}`;
      const res = await apiCall(proxyUrl);
      if (!res.ok) throw new Error("Proxy download error");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const extension = url.split(".").pop().split("?")[0] || "jpg";
      a.download = `${downloadName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        changePassword,
        apiCall,
        downloadFile,
        isAuthenticated: !!user && !user.mustChangePassword,
        mustChangePassword: !!user && user.mustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
