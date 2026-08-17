import { createContext, useContext, useEffect, useState } from "react";
import { WALLPAPERS, getWallpaperById } from "../constants/wallpapers";

const WallpaperContext = createContext(null);

export function WallpaperProvider({ children }) {
    const [wallpaperId, setWallpaperId] = useState(() => {
        return localStorage.getItem("chatter-wallpaper") || "sonoma-horizon";
    });

    const currentWallpaper = getWallpaperById(wallpaperId);

    useEffect(() => {
        localStorage.setItem("chatter-wallpaper", wallpaperId);
    }, [wallpaperId]);

    const frameStyle = {
        background: currentWallpaper.background,
    };

    return (
        <WallpaperContext.Provider
            value={{
                wallpaperId,
                setWallpaperId,
                currentWallpaper,
                wallpapers: WALLPAPERS,
                frameStyle,
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
