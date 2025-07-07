import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");

  // Initialize theme from user preferences or localStorage
  useEffect(() => {
    const userTheme = user?.theme as Theme;
    const storedTheme = localStorage.getItem("theme") as Theme;
    const initialTheme = userTheme || storedTheme || "system";
    setTheme(initialTheme);
  }, [user?.theme]);

  // Update effective theme based on theme setting
  useEffect(() => {
    let newEffectiveTheme: "light" | "dark";

    if (theme === "system") {
      newEffectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches 
        ? "dark" 
        : "light";
    } else {
      newEffectiveTheme = theme;
    }

    setEffectiveTheme(newEffectiveTheme);
    
    // Apply theme to document
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newEffectiveTheme);
    
    // Store in localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const newEffectiveTheme = mediaQuery.matches ? "dark" : "light";
      setEffectiveTheme(newEffectiveTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(newEffectiveTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}