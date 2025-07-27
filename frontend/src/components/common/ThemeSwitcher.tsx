import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../contexts";
import { THEME_OPTIONS } from "../../config/themes";
import { clsx } from "clsx";
import "./ThemeSwitcher.css";

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentTheme = THEME_OPTIONS.find((opt) => opt.value === theme);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Custom Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="theme-dropdown-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentTheme?.icon}</span>
          <span className="text-[var(--text)] font-medium">
            {currentTheme?.label}
          </span>
        </div>
        <svg
          className={clsx("dropdown-arrow", isOpen && "open")}
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
      {isOpen && (
        <div
          className="theme-dropdown-menu animate-in fade-in slide-in-from-top-1"
          role="listbox"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setTheme(option.value);
                setIsOpen(false);
              }}
              className={clsx(
                "theme-dropdown-item",
                theme === option.value && "selected",
              )}
              role="option"
              aria-selected={theme === option.value}
            >
              <span className="text-lg">{option.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-[var(--text)]">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-[var(--text-muted)]">
                    {option.description}
                  </div>
                )}
              </div>
              {theme === option.value && (
                <svg
                  className="h-5 w-5 text-[var(--accent)] flex-shrink-0"
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
      )}
    </div>
  );
};

export default ThemeSwitcher;
