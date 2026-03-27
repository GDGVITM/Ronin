import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { disconnectSocket } from "../socket/client";
import { getSocket } from "../socket/client";
import { http } from "../api/http";
import { RoninFigure, GdgLogo } from "../pages/LandingPage";
import type { EventState } from "../types";

type NavLinkItem = {
  to: string;
  label: string;
  disabled: boolean;
};

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventState, setEventState] = useState<EventState | null>(null);

  function handleLogout() {
    disconnectSocket();
    clearSession();
    navigate("/login");
  }

  const isActive = (path: string) => location.pathname === path;
  const inRound = location.pathname.startsWith("/round/");
  const activeRoundPath =
    eventState && eventState.roundStatus === "LIVE" && eventState.currentRound > 0
      ? `/round/${eventState.currentRound}`
      : null;

  useEffect(() => {
    if (!user || user.role === "ADMIN") return;

    let mounted = true;
    void http.get<EventState>("/round/event-state").then(({ data }) => {
      if (mounted) setEventState(data);
    }).catch(() => {});

    const socket = getSocket();
    if (!socket) {
      return () => {
        mounted = false;
      };
    }

    const refreshEventState = () => {
      void http.get<EventState>("/round/event-state").then(({ data }) => {
        if (mounted) setEventState(data);
      }).catch(() => {});
    };

    socket.on("round:started", refreshEventState);
    socket.on("round:reset", refreshEventState);

    return () => {
      mounted = false;
      socket.off("round:started", refreshEventState);
      socket.off("round:reset", refreshEventState);
    };
  }, [user]);

  if (!user) return null;

  const navLinks: NavLinkItem[] =
    user.role === "ADMIN"
      ? [
          { to: "/dashboard", label: "Dashboard", disabled: false },
          { to: "/admin", label: "Admin", disabled: false },
        ]
      : [
          { to: "/dashboard", label: "Dashboard", disabled: false },
          {
            to: "/round/1",
            label: "Round 1",
            disabled: activeRoundPath !== null && activeRoundPath !== "/round/1",
          },
          {
            to: "/round/2",
            label: "Round 2",
            disabled: activeRoundPath !== null && activeRoundPath !== "/round/2",
          },
          {
            to: "/round/3",
            label: "Round 3",
            disabled: activeRoundPath !== null && activeRoundPath !== "/round/3",
          },
        ];

  return (
    <>
      <nav className={`sticky top-0 z-40 w-full px-3 pt-3 pb-2 md:px-6 ${inRound ? "bg-black" : ""}`}>
        <div className={`navbar-shell flex items-center justify-between px-4 py-2.5 ${inRound ? "!bg-[#0a0a0a] !border-gray-800" : ""}`}>
          {/* Brand: GDG Logo */}
          <Link to="/dashboard" className="gdg-nav-brand">
            <GdgLogo dark={inRound} />
          </Link>

          {/* Center: nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.disabled ? (
                <span
                  key={link.to}
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 opacity-50"
                  title="Unavailable while another round is live"
                >
                  {link.label}
                </span>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? "bg-ghost-gold/14 text-ghost-gold"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>

          {/* Right: user + admin badge + logout */}
          <div className="flex items-center gap-2">
            <div
              className="hidden sm:flex mr-1 items-center justify-center overflow-hidden rounded-md"
              style={{ width: "92px", height: "44px" }}
            >
              <img
                src="/logo_app.png"
                alt="Last Standing Ronin logo"
                width={118}
                height={54}
                style={{ width: "118px", height: "54px", objectFit: "contain", transform: "scale(1.12)", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.18))" }}
              />
            </div>
            <span className="hidden sm:block text-xs text-gray-400 max-w-[110px] truncate">
              {user.name}
            </span>
            {user.role === "ADMIN" && (
              <span className="rounded-full bg-ghost-gold/14 px-2 py-0.5 text-xs font-bold text-ghost-gold border border-ghost-gold/22">
                ADMIN
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg border border-ghost-gold/50 px-3 py-1.5 text-xs text-ghost-gold hover:border-ghost-gold hover:text-ghost-gold hover:bg-ghost-gold/10 transition-colors"
            >
              Logout
            </button>
            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col gap-1 p-1 bg-transparent border-0 cursor-pointer"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="block w-5 h-0.5 bg-gray-400 rounded" />
              <span className="block w-5 h-0.5 bg-gray-400 rounded" />
              <span className="block w-5 h-0.5 bg-gray-400 rounded" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "menu-open" : "menu-closed"}`}>
        <button
          className="absolute top-5 right-5 text-gray-400 hover:text-white text-2xl bg-transparent border-0 cursor-pointer"
          onClick={() => setMenuOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>
        {/* Ronin in mobile menu */}
        <div
          className="mb-2 ghost-on"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <RoninFigure scale={0.75} />
        </div>
        {navLinks.map((link) =>
          link.disabled ? (
            <span
              key={link.to}
              aria-disabled="true"
              className="mobile-menu-link cursor-not-allowed opacity-50"
            >
              {link.label}
            </span>
          ) : (
            <Link
              key={link.to}
              to={link.to}
              className="mobile-menu-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ),
        )}
        <button
          onClick={() => {
            setMenuOpen(false);
            handleLogout();
          }}
          className="mt-4 rounded-lg border border-ghost-gold/50 px-6 py-2 text-ghost-gold font-semibold text-sm hover:bg-ghost-gold/10 transition-colors"
        >
          Logout
        </button>
      </div>
    </>
  );
}
