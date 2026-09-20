import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read saved preference from localStorage, default to true (dark)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("shopsmart_theme");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    // Save selection to localStorage
    localStorage.setItem("shopsmart_theme", JSON.stringify(isDarkMode));

    // Optional: Add/remove 'dark-mode' class on <body> or <html> for global CSS rules
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom Hook to consume theme state
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// ThemeToggle Button Component
export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-sm d-flex align-items-center justify-content-center rounded-circle ${
        isDarkMode ? "btn-outline-light" : "btn-outline-dark"
      }`}
      style={{ width: "36px", height: "36px", cursor: "pointer" }}
      title={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
    >
      <i className={`bi ${isDarkMode ? "bi-sun-fill text-warning" : "bi-moon-stars-fill text-primary"}`}></i>
    </button>
  );
};