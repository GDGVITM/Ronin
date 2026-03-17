import { useTheme } from "../theme/ThemeProvider";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5"  />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22"  x2="6.34" y2="6.34"  />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  if (floating) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`theme-fab ${isLight ? "theme-fab--light" : "theme-fab--dark"}`}
        aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
        title={`Switch to ${isLight ? "dark" : "light"} mode`}
      >
        <span className="theme-fab-icon-wrap">
          <span className={`theme-fab-icon-sun ${isLight ? "icon-visible" : "icon-hidden"}`}>
            <SunIcon />
          </span>
          <span className={`theme-fab-icon-moon ${isLight ? "icon-hidden" : "icon-visible"}`}>
            <MoonIcon />
          </span>
        </span>
        <span className="theme-fab-label">{isLight ? "Light" : "Dark"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle ${isLight ? "theme-toggle--light" : "theme-toggle--dark"}`}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <span className={`theme-toggle-track ${isLight ? "is-light" : "is-dark"}`}>
        <span className="theme-toggle-thumb">
          {isLight ? <SunIcon /> : <MoonIcon />}
        </span>
      </span>
      <span className="theme-toggle-label">{isLight ? "Light" : "Dark"}</span>
    </button>
  );
}
