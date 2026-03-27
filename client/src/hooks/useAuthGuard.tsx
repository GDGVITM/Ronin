import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { fetchMe } from "../api/auth";
import { connectSocket } from "../socket/client";
import { Navbar } from "../components/Navbar";

export function AuthGuard() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [loading, setLoading] = useState(!user && !!token);
  const location = useLocation();
  const inRound = location.pathname.startsWith("/round/");

  useEffect(() => {
    if (token && !user) {
      connectSocket(token);
      fetchMe()
        .then((u) => {
          setUser(u);
          setLoading(false);
        })
        .catch(() => {
          clearSession();
          setLoading(false);
        });
    } else if (token && user) {
      connectSocket(token);
    }
  }, [token, user, setUser, clearSession]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#000" }}>
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-ghost-gold border-t-transparent" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (inRound) {
    return (
      <>
        <div className="round-shell min-h-screen">
          <Navbar />
          <Outlet />
        </div>
      </>
    );
  }

  return (
    <div className="app-shell min-h-screen">
      <Navbar />
      <Outlet />
    </div>
  );
}
