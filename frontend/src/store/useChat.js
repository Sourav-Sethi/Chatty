import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';
import { encryptMessage, decryptMessage } from '../lib/utils';

import {create} from "zustand"
import { useAuth } from './useAuth';

export const useChat = create((set,get)=>({
    messages: [],
    users: [],
    isLoadingUser: false,
    isLoadingMsg: false,
    selectedUser: null,
    typingUsers: [], // userIds currently typing
    replyTo: null,

    getUsers: async()=>{
        set({isLoadingUser:true});
        try {
            const res = await axiosInstance.get("/messages/users");
            // console.log("res of GetUser: ",res);
            set({users:res.data})
        } catch (error) {
            console.log("Error in getUsers useChat")
            toast.error(error.response.data.messgae)
        }
        finally{
            set({isLoadingUser:false});
        }
    },

    getMessages: async(userId)=>{
        set({isLoadingMsg:true})
        try {
            const res = await axiosInstance.get(`/messages/${userId}`)
            set({messages:res.data})
            await axiosInstance.post(`/messages/read/${userId}`)
        } catch (error) {
            console.log("Error in getMessages useChat")
            toast.error(error.response.data.messgae)
        }
        finally{
            set({isLoadingMsg:false})
        }
    },

    sendMessages:async(Data)=>{
        const {messages, selectedUser, replyTo, clearReplyTo} = get();
        try {
            const newMsg = await axiosInstance.post(`/messages/send/${selectedUser._id}`,{
                ...Data,
                replyTo: replyTo?._id || null
            })
            set({messages:[...messages,newMsg.data]})
            clearReplyTo();
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },
    // for real time data
    subscribeToMessages: ()=>{
        const {selectedUser, messages} = get()
        if(!selectedUser) return;
        const socket = useAuth.getState().socket
        socket.on('newMessage', (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) {
                // Show toast notification for new message (no JSX)
                toast(`New message from ${newMessage.senderName || "User"}: ${newMessage.text ? newMessage.text.slice(0, 40) : "[Media/File]"}`);
                return;
            }
            set((state)=>({
                messages: [...state.messages, newMessage],
            }))
        })
    },
    UnsubscribeToMessages:()=>{
        const socket = useAuth.getState().socket;
        socket.off('newMessage');
    },
    setselectedUser : async(CurrUser)=>{
        set({selectedUser:CurrUser})
    },
    emitTyping: () => {
        const { selectedUser } = get();
        const socket = useAuth.getState().socket;
        if (!selectedUser || !socket) return;
        socket.emit("typing", { to: selectedUser._id });
    },
    emitStopTyping: () => {
        const { selectedUser } = get();
        const socket = useAuth.getState().socket;
        if (!selectedUser || !socket) return;
        socket.emit("stopTyping", { to: selectedUser._id });
    },
    subscribeToTyping: () => {
        const socket = useAuth.getState().socket;
        if (!socket) return;
        socket.on("typing", ({ from }) => {
            set((state) => ({
                typingUsers: [...new Set([...state.typingUsers, from])],
            }));
        });
        socket.on("stopTyping", ({ from }) => {
            set((state) => ({
                typingUsers: state.typingUsers.filter((id) => id !== from),
            }));
        });
    },
    unsubscribeFromTyping: () => {
        const socket = useAuth.getState().socket;
        if (!socket) return;
        socket.off("typing");
        socket.off("stopTyping");
    },
    addReaction: async (messageId, emoji) => {
        try {
            const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? res.data : msg
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add reaction");
        }
    },
    removeReaction: async (messageId) => {
        try {
            const res = await axiosInstance.delete(`/messages/reaction/${messageId}`);
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? res.data : msg
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to remove reaction");
        }
    },
    setReplyTo: (msg) => set({ replyTo: msg }),
    clearReplyTo: () => set({ replyTo: null }),
    editMessage: async (messageId, text) => {
        try {
            const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId ? res.data : msg
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to edit message");
        }
    },
    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/delete/${messageId}`);
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== messageId),
            }));
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete message");
        }
    },
}))