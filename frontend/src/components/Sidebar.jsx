import React, { useEffect, useState } from 'react'
import {useAuth} from "../store/useAuth"
import {useChat} from "../store/useChat"
import { SideBarUsers } from './SideBarUsers.jsx'
import { User, X, Users, Plus } from "lucide-react";

export const Sidebar = () => {
  const {onlineUsers} = useAuth()
  const {getUsers, users, selectedUser, setselectedUser, isUserLoading} = useChat()
  const [showOnlineUsers, setshowOnlineUsers] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  
  useEffect(()=>{
    getUsers();
  },[getUsers])
  
  useEffect(() => {
    console.log('All users:', users);
  }, [users]);
  
  const filterUsers = showOnlineUsers ? users.filter((user)=>{
    return onlineUsers.includes(user._id)
  }) : users

  if(isUserLoading) return <div>Loading...</div>

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 bg-gradient-to-b from-blue-950/80 via-slate-900/80 to-blue-900/80 backdrop-blur-md shadow-xl">
      <div className="border-b border-base-300 w-full p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="size-6 text-blue-400" />
          <span className="font-semibold text-white hidden lg:block tracking-wide">Contacts</span>
        </div>
      </div>
      {/* Direct Messages */}
      <div className="overflow-y-auto w-full py-3">
        {filterUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => { setselectedUser(user); }}
            className={`
              w-full p-3 flex items-center gap-3
              rounded-xl transition-all duration-200
              hover:bg-blue-900/40 hover:shadow-lg
              ${selectedUser?._id === user._id ? "bg-blue-900/60 ring-2 ring-blue-500 shadow-xl" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0 cursor-pointer" onClick={e => { e.stopPropagation(); setProfileUser(user); }}>
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full border-2 border-blue-500 shadow-md"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>
            <div className="hidden lg:block text-left min-w-0 cursor-pointer" onClick={e => { e.stopPropagation(); setProfileUser(user); }}>
              <div className="font-semibold truncate text-white">{user.fullName}</div>
              <div className="text-sm text-blue-300">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}
        {filterUsers.length === 0 && (
          <div className="text-center text-zinc-400 py-4">No online users</div>
        )}
      </div>
    </aside>
  )
}