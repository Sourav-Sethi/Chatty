import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5000";

export const useAuth = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLogging: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data });
            get().connectSocket();
        } catch (error) {
            console.log("Error in checkAuth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signUpForm: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account Created Successfully");
            get().connectSocket();
        } catch (error) {
            console.error("Error in signup -->", error);
            toast.error(error?.response?.data?.message || "Signup failed. Please try again.");
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLogging: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success("Logged In Successfully");
            get().connectSocket();
        } catch (error) {
            console.error("Error in login -->", error);
            toast.error(error?.response?.data?.message || "Login failed. Please try again.");
        } finally {
            set({ isLogging: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged Out Successfully");
            get().disconnectSocket();
        } catch (error) {
            console.error("Error in logout:", error);
            toast.error(error?.response?.data?.message || "Logout failed. Please try again.");
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error in updateProfile:", error);
            toast.error(error?.response?.data?.message || "Profile update failed.");
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: () => {
        const { authUser, socket } = get();
        if (!authUser || socket?.connected) return;

        const newSocket = io(BASE_URL, {
            query: { userId: authUser._id },
        });

        newSocket.connect();
        set({ socket: newSocket });

        newSocket.on("getOnlineUser", (userIds) => {
            set({ onlineUsers: userIds });
        });
    },

    disconnectSocket: async () => {
        const { socket } = get();
        if (socket?.connected) socket.disconnect();
    },
}));
