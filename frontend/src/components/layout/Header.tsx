import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts';
import ThemeSelector from '../ThemeSelector';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
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
                  isActive('/dashboard') ? 'text-accent font-medium' : 'text-text-secondary'
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Dashboard
              </Link>
              <Link
                to="/goals"
                className={`${
                  isActive('/goals') ? 'text-accent font-medium' : 'text-text-secondary'
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Goals
              </Link>
              <Link
                to="/meals"
                className={`${
                  isActive('/meals') ? 'text-accent font-medium' : 'text-text-secondary'
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Meals
              </Link>
              <Link
                to="/workouts"
                className={`${
                  isActive('/workouts') ? 'text-accent font-medium' : 'text-text-secondary'
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Workouts
              </Link>
              <Link
                to="/wellness"
                className={`${
                  isActive('/wellness') ? 'text-accent font-medium' : 'text-text-secondary'
                } hover:text-accent px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                Wellness
              </Link>
              <Link
                to="/showcase"
                className="text-accent hover:text-accent-hover px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                🎨 Component Showcase
              </Link>
            </nav>
          </div>

          {/* Right side - Theme selector, User menu and mobile toggle */}
          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <div className="hidden md:block">
              <ThemeSelector />
            </div>
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
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden md:block ml-2 text-text-secondary">
                  {user?.firstName} {user?.lastName}
                </span>
                <svg
                  className={`ml-2 h-5 w-5 text-text-muted transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
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
                <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-surface border border-surface-muted z-50 glass">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <div className="px-4 py-2 text-sm text-text-secondary border-b border-surface-muted">
                      <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                      <div className="text-text-muted">{user?.email}</div>
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

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-button-hover-bg hover:text-accent transition-colors"
                      role="menuitem"
                    >
                      Sign out
                    </button>
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
