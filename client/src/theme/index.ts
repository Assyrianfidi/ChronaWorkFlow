import React, { createContext, useContext, ReactNode } from "react";

interface ThemeContextType {
  mode: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = React.useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return React.createElement(
    ThemeContext.Provider,
    { value: { mode, toggleTheme } },
    React.createElement("div", { className: `theme-${mode}` }, children),
  );
};

export const useTheme = () => useContext(ThemeContext);
