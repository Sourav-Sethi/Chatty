import React, { useEffect, useRef, useState } from 'react'
import {useChat} from "../store/useChat"
import {ChatHeader} from "./ChatHeader.jsx"
import {MessageInput} from "./MessageInput.jsx"
import {MessageSkeleton} from "./skeleton/MessageSkeleton.jsx"
import {formatMessageTime} from "../lib/utils.js"
import { useAuth } from '../store/useAuth.js'
import { Check, Smile, CornerUpLeft, X as CloseIcon, Edit2, Trash2, Save, Paperclip, Users } from "lucide-react";

export const ChatContainer = () => {
  const {messages, getMessages, isLoadingMsg, selectedUser, subscribeToMessages, UnsubscribeToMessages, typingUsers, subscribeToTyping, unsubscribeFromTyping, addReaction, removeReaction, setReplyTo, replyTo, clearReplyTo, editMessage, deleteMessage} = useChat()
  const {authUser} = useAuth()
  
  const messageEndRef = useRef(null);
  const [showPickerFor, setShowPickerFor] = useState(null);
  const emojiList = ["👍", "😂", "❤️", "😮", "😢", "🔥", "🎉"];
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  
  // Debug logs to trace invalid user ID errors
  console.log('selectedUser:', selectedUser);
  
  useEffect(() => {
    if (selectedUser && typeof selectedUser === 'object' && selectedUser._id) {
      getMessages(selectedUser._id);
    }
    subscribeToMessages();
    subscribeToTyping();
    return () => {
      UnsubscribeToMessages();
      unsubscribeFromTyping();
    };
  }, [getMessages, selectedUser?._id, subscribeToMessages, UnsubscribeToMessages, subscribeToTyping, unsubscribeFromTyping]);

  useEffect(()=>{
    if(messageEndRef.current && messages) 
      messageEndRef.current.scrollIntoView({ behavior: "smooth" })
  },[messages])
  
  if(isLoadingMsg) return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader/>
      <MessageSkeleton/>
      <MessageInput/>
    </div>
  )

  // Check if selectedUser is typing
  const isTyping = selectedUser && typingUsers.includes(selectedUser._id);

  if (!selectedUser) {
    return <div className="flex-1 flex items-center justify-center text-zinc-400">Select a chat to start messaging.</div>;
  }

  return (
    <div className='flex-1 flex flex-col overflow-auto'>
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          // Group reactions by emoji
          const reactionMap = {};
          (message.reactions || []).forEach(r => {
            if (!reactionMap[r.emoji]) reactionMap[r.emoji] = [];
            reactionMap[r.emoji].push(r.userId);
          });
          const myReaction = (message.reactions || []).find(r => r.userId === authUser._id);
          const isOwn = message.senderId === authUser._id;
          const isEditing = editingId === message._id;
          return (
            <div
              key={message._id}
              className={`chat group ${isOwn ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
              onContextMenu={e => { e.preventDefault(); setReplyTo(message); }}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1 flex items-center gap-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {/* Read receipt for sent messages */}
                {message.senderId === authUser._id && message.read && (
                  <span className="flex items-center gap-1 text-blue-500 text-xs ml-2">
                    <Check size={14} className="inline-block" /> Seen
                  </span>
                )}
              </div>
              <div className="chat-bubble flex flex-col relative group-hover:bg-blue-950/80 transition-colors duration-200">
                {/* Quoted message preview in bubble */}
                {message.replyTo && (
                  <div className="mb-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs border-l-4 border-blue-400">
                    {(() => {
                      const quoted = messages.find(m => m._id === message.replyTo);
                      if (!quoted) return <span>Quoted message</span>;
                      return (
                        <span>
                          {quoted.text ? quoted.text.slice(0, 60) : "[Media]"}
                        </span>
                      );
                    })()}
                  </div>
                )}
                {/* File/media preview */}
                {message.fileUrl && message.fileType && (
                  message.fileType.startsWith("image/") ? (
                    <img
                      src={message.fileUrl}
                      alt={message.fileName || "Image"}
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  ) : message.fileType.startsWith("video/") ? (
                    <video
                      src={message.fileUrl}
                      controls
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  ) : (
                    <a
                      href={message.fileUrl}
                      download={message.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-2 text-blue-800 hover:bg-blue-100 transition-colors"
                    >
                      <Paperclip size={18} />
                      <span className="truncate max-w-[120px]">{message.fileName || "File"}</span>
                      <span className="text-xs text-blue-400">{message.fileType.split("/")[1]?.toUpperCase()}</span>
                    </a>
                  )
                )}
                {message.text && <p>{message.text}</p>}
                {/* Reaction button */}
                <button
                  className="absolute -top-5 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow p-1 border border-gray-200 z-10"
                  onClick={() => setShowPickerFor(showPickerFor === message._id ? null : message._id)}
                  tabIndex={-1}
                  aria-label="Add reaction"
                >
                  <Smile size={18} />
                </button>
                {/* Emoji picker */}
                {showPickerFor === message._id && (
                  <div className="absolute top-[-48px] right-0 bg-white rounded-xl shadow-lg border p-2 flex gap-1 z-20 animate-fade-in">
                    {emojiList.map((emoji) => (
                      <button
                        key={emoji}
                        className="text-xl hover:scale-125 transition-transform"
                        onClick={() => {
                          if (myReaction && myReaction.emoji === emoji) {
                            removeReaction(message._id);
                          } else {
                            addReaction(message._id, emoji);
                          }
                          setShowPickerFor(null);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {/* Reactions display */}
                {Object.keys(reactionMap).length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {Object.entries(reactionMap).map(([emoji, userIds]) => (
                      <span
                        key={emoji}
                        className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 bg-blue-100 border border-blue-200 shadow-sm ${userIds.includes(authUser._id) ? "ring-2 ring-blue-400" : ""}`}
                      >
                        {emoji} <span className="font-bold text-xs">{userIds.length}</span>
                      </span>
                    ))}
                  </div>
                )}
                {/* Reply button */}
                <button
                  className="absolute -top-5 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow p-1 border border-gray-200 z-10"
                  onClick={() => setReplyTo(message)}
                  tabIndex={-1}
                  aria-label="Reply"
                >
                  <CornerUpLeft size={16} />
                </button>
                {/* Edit/Delete buttons for own messages */}
                {isOwn && !isEditing && (
                  <div className="absolute -top-5 right-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      className="bg-white rounded-full shadow p-1 border border-gray-200 hover:bg-blue-100"
                      onClick={() => { setEditingId(message._id); setEditText(message.text); }}
                      tabIndex={-1}
                      aria-label="Edit message"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="bg-white rounded-full shadow p-1 border border-gray-200 hover:bg-red-100"
                      onClick={() => deleteMessage(message._id)}
                      tabIndex={-1}
                      aria-label="Delete message"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                {/* Edit mode */}
                {isEditing ? (
                  <form
                    className="flex gap-2 items-center"
                    onSubmit={async e => {
                      e.preventDefault();
                      await editMessage(message._id, editText);
                      setEditingId(null);
                    }}
                  >
                    <input
                      className="input input-sm rounded-lg flex-1"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-xs btn-primary" aria-label="Save edit">
                      <Save size={14} />
                    </button>
                    <button type="button" className="btn btn-xs btn-ghost" onClick={() => setEditingId(null)} aria-label="Cancel edit">
                      <CloseIcon size={14} />
                    </button>
                  </form>
                ) : (
                  <>
                    {/* ... existing code ... */}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && selectedUser && (
          <div className="flex items-center gap-2 mt-2 animate-pulse">
            <div className="size-8 rounded-full bg-blue-200" />
            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl shadow text-sm font-medium">{selectedUser.fullName} is typing...</div>
          </div>
        )}
      </div>
      {/* Reply preview above input */}
      {replyTo && (
        <div className="flex items-center gap-2 bg-blue-100 border-l-4 border-blue-400 px-4 py-2 mb-2 rounded-lg mx-4">
          <span className="text-blue-800 text-xs font-semibold">Replying to:</span>
          <span className="text-blue-800 text-xs truncate max-w-xs">
            {replyTo.text ? replyTo.text.slice(0, 60) : "[Media]"}
          </span>
          <button className="ml-auto text-blue-400 hover:text-blue-700" onClick={clearReplyTo} aria-label="Cancel reply">
            <CloseIcon size={18} />
          </button>
        </div>
      )}
      <MessageInput />
    </div>
  )
}