import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { WALLPAPERS, getWallpaperById } from "../constants/wallpapers";

const WallpaperContext = createContext(null);

const MAX_CUSTOM_WALLPAPERS = 5;

export function WallpaperProvider({ children }) {
    const [wallpaperId, setWallpaperId] = useState(() => {
        return localStorage.getItem("chatter-wallpaper") || "sonoma-horizon";
    });

    const [customWallpapers, setCustomWallpapers] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("chatter-custom-wallpapers") || "[]");
        } catch {
            return [];
        }
    });

    const [customWallpaperId, setCustomWallpaperId] = useState(() => {
        return localStorage.getItem("chatter-custom-wallpaper-id") || null;
    });

    const isCustom = wallpaperId === "custom";

    const currentWallpaper = wallpaperId === "none"
        ? null
        : isCustom && customWallpaperId
            ? customWallpapers.find((w) => w.id === customWallpaperId) || null
            : getWallpaperById(wallpaperId);

    useEffect(() => {
        localStorage.setItem("chatter-wallpaper", wallpaperId);
    }, [wallpaperId]);

    useEffect(() => {
        localStorage.setItem("chatter-custom-wallpapers", JSON.stringify(customWallpapers));
    }, [customWallpapers]);

    useEffect(() => {
        if (customWallpaperId) {
            localStorage.setItem("chatter-custom-wallpaper-id", customWallpaperId);
        } else {
            localStorage.removeItem("chatter-custom-wallpaper-id");
        }
    }, [customWallpaperId]);

    const addCustomWallpaper = useCallback((dataUrl, name) => {
        const id = "custom-" + Date.now();
        const newWp = { id, name: name || "Custom " + (customWallpapers.length + 1), dataUrl };
        setCustomWallpapers((prev) => {
            const updated = [...prev, newWp];
            if (updated.length > MAX_CUSTOM_WALLPAPERS) {
                return updated.slice(-MAX_CUSTOM_WALLPAPERS);
            }
            return updated;
        });
        setWallpaperId("custom");
        setCustomWallpaperId(id);
        return id;
    }, [customWallpapers.length]);

    const removeCustomWallpaper = useCallback((id) => {
        setCustomWallpapers((prev) => prev.filter((w) => w.id !== id));
        if (customWallpaperId === id) {
            setCustomWallpaperId(null);
            setWallpaperId("sonoma-horizon");
        }
    }, [customWallpaperId]);

    const selectCustomWallpaper = useCallback((id) => {
        setWallpaperId("custom");
        setCustomWallpaperId(id);
    }, []);

    const frameStyle = {};
    if (isCustom && currentWallpaper?.dataUrl) {
        frameStyle.backgroundImage = `url(${currentWallpaper.dataUrl})`;
        frameStyle.backgroundSize = "cover";
        frameStyle.backgroundPosition = "center";
    } else if (currentWallpaper?.background) {
        frameStyle.background = currentWallpaper.background;
    }

    return (
        <WallpaperContext.Provider
            value={{
                wallpaperId,
                setWallpaperId,
                currentWallpaper,
                wallpapers: WALLPAPERS,
                frameStyle,
                isCustom,
                customWallpapers,
                customWallpaperId,
                addCustomWallpaper,
                removeCustomWallpaper,
                selectCustomWallpaper,
            }}
        >
            {children}
        </WallpaperContext.Provider>
    );
}

export function useWallpaper() {
    const context = useContext(WallpaperContext);
    if (!context) {
        throw new Error("useWallpaper must be used within a WallpaperProvider");
    }
    return context;
}
