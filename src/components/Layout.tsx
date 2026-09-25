import { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { logRender } from "@/lib/devLogger";
import ProfileShell from "@/components/profile/ProfileShell";

export default function Layout() {
  logRender("Layout");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const username = user?.username ?? "";
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [location.pathname, navigate, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <ProfileShell username={username} onLogout={handleLogout}>
      {offline && (
        <div
          role="status"
          className="bg-amber-50 px-6 py-2 text-sm text-amber-800"
        >
          Ви в офлайн-режимі.
        </div>
      )}
      <Outlet />
    </ProfileShell>
  );
}
