import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useAuthStore } from "./store/useAuthStore";
import { ThemeProvider } from "./context/ThemeContext";
import { WallpaperProvider } from "./context/WallpaperContext";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";
import PageLoader from "./components/PageLoader";
import UsernameModal from "./components/UsernameModal";
import { Toaster } from "react-hot-toast";

function AppContent() {
    const { isSignedIn, isLoaded } = useAuth();
    const checkAuth = useAuthStore((state) => state.checkAuth);
    const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
    const disconnectSocket = useAuthStore((state) => state.disconnectSocket);

    useEffect(() => {
        if (isSignedIn) {
            checkAuth();
        } else {
            disconnectSocket();
        }
    }, [isSignedIn, checkAuth, disconnectSocket]);

    if (!isLoaded || (isSignedIn && isCheckingAuth)) {
        return <PageLoader text="Connecting to Chatter..." />;
    }

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "#1e1e22",
                        color: "#e4e4e7",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        padding: "8px 12px",
                    },
                }}
            />
            {isSignedIn && <UsernameModal />}
            {isSignedIn ? <ChatPage /> : <AuthPage />}
        </>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <WallpaperProvider>
                <AppContent />
            </WallpaperProvider>
        </ThemeProvider>
    );
}
