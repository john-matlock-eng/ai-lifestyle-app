import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useTheme } from "../../contexts";
import type { Theme } from "../../contexts/ThemeContextType";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const copyUserId = async () => {
    if (user?.userId) {
      try {
        await navigator.clipboard.writeText(user.userId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } catch (err) {
        console.error("Failed to copy user ID:", err);
      }
    }
  };

  return (
    <header className="bg-surface border-b border-surface-muted shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="AI Lifestyle App"
              />
              <span className="ml-2 text-xl font-semibold text-gradient hidden sm:block">
                AI Lifestyle
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/dashboard"
                className={`${
                  isActive("/dashboard")
                    ? "text-accent font-medium"
                    : "text-text-secondary"
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Dashboard
              </Link>
              <Link
                to="/goals"
                className={`${
                  isActive("/goals")
                    ? "text-accent font-medium"
                    : "text-text-secondary"
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Goals
              </Link>
              <Link
                to="/meals"
                className={`${
                  isActive("/meals")
                    ? "text-accent font-medium"
                    : "text-text-secondary"
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Meals
              </Link>
              <Link
                to="/workouts"
                className={`${
                  isActive("/workouts")
                    ? "text-accent font-medium"
                    : "text-text-secondary"
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Workouts
              </Link>
              <Link
                to="/habits"
                className={`${
                  isActive("/habits")
                    ? "text-accent font-medium"
                    : "text-text-secondary"
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Habits
              </Link>
              <Link
                to="/journal"
                className={`${
                  isActive("/journal") ? "text-theme" : "text-muted"
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Journal
              </Link>
            </nav>
          </div>

          {/* Right side - User menu and mobile toggle */}
          <div className="flex items-center gap-4">
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center text-sm rounded-full focus:outline-none focus:shadow-focus transition-all"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center hover:shadow-glow transition-all">
                  <span className="text-white font-medium">
                    {user?.firstName?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="hidden md:block ml-2 text-text-secondary">
                  {user?.firstName} {user?.lastName}
                </span>
                <svg
                  className={`ml-2 h-5 w-5 text-text-muted transition-transform ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-surface border border-surface-muted z-50 glass">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <div className="px-4 py-3 border-b border-surface-muted">
                      <div className="font-medium text-text">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-sm text-text-muted mt-1">
                        {user?.email}
                      </div>

                      {/* User ID with Copy Button */}
                      {user?.userId && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-muted">User ID</p>
                            <p className="text-xs font-mono text-text-secondary truncate">
                              {user.userId}
                            </p>
                          </div>
                          <button
                            onClick={copyUserId}
                            className="p-1 hover:bg-button-hover-bg rounded transition-colors"
                            title="Copy User ID"
                          >
                            {copiedId ? (
                              <svg
                                className="w-4 h-4 text-success"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 text-text-muted"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-button-hover-bg hover:text-accent transition-colors"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-text-secondary hover:bg-button-hover-bg hover:text-accent transition-colors"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>

                    {/* Theme Selection */}
                    <div className="border-t border-surface-muted mt-1 pt-1">
                      <div className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                        Theme
                      </div>
                      <div className="px-2">
                        {[
                          { value: "light", label: "Light", icon: "☀️" },
                          { value: "dark", label: "Dark", icon: "🌙" },
                          { value: "serene", label: "Serene", icon: "🌿" },
                          { value: "vibrant", label: "Vibrant", icon: "🎨" },
                          { value: "midnight", label: "Midnight", icon: "🌌" },
                          {
                            value: "solarized",
                            label: "Solarized",
                            icon: "🌅",
                          },
                        ].map((themeOption) => (
                          <button
                            key={themeOption.value}
                            onClick={() => {
                              setTheme(themeOption.value as Theme);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded flex items-center gap-2 transition-colors ${
                              theme === themeOption.value
                                ? "bg-accent/20 text-accent"
                                : "text-text-secondary hover:bg-button-hover-bg hover:text-accent"
                            }`}
                            role="menuitem"
                          >
                            <span>{themeOption.icon}</span>
                            <span>{themeOption.label}</span>
                            {theme === themeOption.value && (
                              <svg
                                className="ml-auto h-4 w-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-surface-muted mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-button-hover-bg hover:text-accent transition-colors"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden ml-4 p-2 rounded-md text-text-muted hover:text-accent hover:bg-button-hover-bg focus:outline-none focus:shadow-focus transition-all"
              onClick={onMobileMenuToggle}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
