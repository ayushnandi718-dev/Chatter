import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:3000" : "");

export const axiosInstance = axios.create({
    baseURL: `${API_BASE}/api`,
    withCredentials: true,
});
