import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { disconnectSocket } from "../socket/client";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    disconnectSocket();
    clearSession();
    navigate("/login");
  }

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/round/1", label: "Round 1" },
    { to: "/round/2", label: "Round 2" },
    { to: "/round/3", label: "Round 3" },
  ];

  if (user.role === "ADMIN") {
    navLinks.push({ to: "/admin", label: "Admin" });
  }

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-800 bg-ghost-panel/95 px-6 py-2 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-lg font-bold text-ghost-gold">
          Way Of Ghost
        </Link>
        <div className="flex gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-ghost-gold/15 text-ghost-gold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user.name}</span>
        {user.role === "ADMIN" && (
          <span className="rounded bg-ghost-gold/20 px-2 py-0.5 text-xs font-semibold text-ghost-gold">
            ADMIN
          </span>
        )}
        <button
          onClick={handleLogout}
          className="rounded border border-gray-700 px-3 py-1 text-sm text-gray-400 hover:border-ghost-red hover:text-ghost-red"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
