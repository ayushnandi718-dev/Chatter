import { createContext, useContext, useEffect, useState } from "react";
import { THEMES } from "../constants/themes";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("chatter-theme") || "dark";
    });

    useEffect(() => {
        localStorage.setItem("chatter-theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
        const selected = THEMES.find((t) => t.id === theme) || THEMES[0];
        document.documentElement.classList.toggle("dark", selected.isDark);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
