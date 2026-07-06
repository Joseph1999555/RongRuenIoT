"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type Theme = "dark" | "light" | "system";

type ThemeContextValue = {
  resolvedTheme?: "dark" | "light";
  setTheme: (theme: Theme | ((current: Theme) => Theme)) => void;
  systemTheme?: "dark" | "light";
  theme?: Theme;
};

type ThemeProviderProps = {
  attribute?: "class" | `data-${string}`;
  children: ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
};

const ThemeContext = createContext<ThemeContextValue>({
  setTheme: () => undefined,
});

function getSystemTheme() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(storageKey: string) {
  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    return storedTheme === "dark" || storedTheme === "light" || storedTheme === "system"
      ? storedTheme
      : null;
  } catch {
    return null;
  }
}

function applyTheme(attribute: ThemeProviderProps["attribute"], theme?: "dark" | "light") {
  if (!theme) {
    return;
  }

  const root = document.documentElement;
  root.style.colorScheme = theme;

  if (attribute === "class") {
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    return;
  }

  if (attribute) {
    root.setAttribute(attribute, theme);
  }
}

function resolveTheme(
  theme: Theme,
  systemTheme: "dark" | "light" | undefined,
  enableSystem: boolean,
) {
  if (theme === "system") {
    return enableSystem ? systemTheme : undefined;
  }

  return theme;
}

export function ThemeProvider({
  attribute = "data-theme",
  children,
  defaultTheme = "system",
  enableSystem = true,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light" | undefined>(
    defaultTheme === "dark" || defaultTheme === "light" ? defaultTheme : undefined,
  );

  useEffect(() => {
    const storedTheme = getStoredTheme(storageKey);
    const nextTheme = storedTheme ?? defaultTheme;
    const nextSystemTheme = getSystemTheme();

    setThemeState(nextTheme);
    setSystemTheme(nextSystemTheme);
    applyTheme(attribute, resolveTheme(nextTheme, nextSystemTheme, enableSystem));
  }, [attribute, defaultTheme, enableSystem, storageKey]);

  useEffect(() => {
    if (!enableSystem) {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function handleChange(event: MediaQueryListEvent) {
      const nextSystemTheme = event.matches ? "dark" : "light";
      setSystemTheme(nextSystemTheme);

      if (theme === "system") {
        applyTheme(attribute, nextSystemTheme);
      }
    }

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [attribute, enableSystem, theme]);

  const setTheme = useCallback(
    (nextTheme: Theme | ((current: Theme) => Theme)) => {
      const nextSystemTheme = getSystemTheme();

      if (nextSystemTheme) {
        setSystemTheme(nextSystemTheme);
      }

      setThemeState((currentTheme) => {
        const resolvedNextTheme =
          typeof nextTheme === "function" ? nextTheme(currentTheme) : nextTheme;

        try {
          window.localStorage.setItem(storageKey, resolvedNextTheme);
        } catch {
          // Ignore storage failures; the visible theme still changes.
        }

        applyTheme(
          attribute,
          resolveTheme(resolvedNextTheme, nextSystemTheme, enableSystem),
        );

        return resolvedNextTheme;
      });
    },
    [attribute, enableSystem, storageKey],
  );

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedTheme = resolveTheme(theme, systemTheme, enableSystem);

    return {
      resolvedTheme,
      setTheme,
      systemTheme,
      theme,
    };
  }, [enableSystem, setTheme, systemTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
