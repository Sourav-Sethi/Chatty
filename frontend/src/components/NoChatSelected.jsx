import { useState } from "react";
import chattyLogo from "../assets/images.jpeg";
import { useChat } from "../store/useChat";

export const NoChatSelected = () => {
  const { users, setselectedUser } = useChat();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()));

  const handleUserClick = (user) => {
    setselectedUser(user);
    setShowModal(false);
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-10 flex flex-col items-center animate-fade-in transition-shadow duration-300 hover:shadow-blue-500/30">
        <img src={chattyLogo} alt="Chatty Logo" className="w-24 h-24 rounded-full shadow-lg mb-4 animate-bounce-slow" />
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Chatty!</h2>
        <p className="text-gray-300 mb-6">Select a conversation from the sidebar or start a new chat to begin messaging.</p>
        <button
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-all duration-200"
          onClick={() => setShowModal(true)}
        >
          Start New Chat
        </button>
      </div>
      {/* Modal for new chat */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center relative">
            <button
              className="absolute top-4 right-6 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-blue-600 text-3xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full hover:bg-gray-100 shadow-sm z-20"
              aria-label="Close modal"
              onClick={() => setShowModal(false)}
              style={{ pointerEvents: 'auto' }}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800 tracking-wide">Start New Chat</h3>
            <div className="relative w-full mb-6">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-400 shadow-sm transition-all duration-200 pr-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 text-xl focus:outline-none"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  &times;
                </button>
              )}
            </div>
            <div className="w-full max-h-56 overflow-y-auto mb-2 space-y-2">
              {filteredUsers.length === 0 && <div className="text-gray-400 text-center py-4">No users found.</div>}
              {filteredUsers.map(user => (
                <button
                  key={user._id}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white hover:bg-blue-50 transition-colors font-medium text-gray-800 shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-200 text-blue-700 font-bold text-lg uppercase shadow-inner">
                    {user.fullName?.[0] || '?'}
                  </div>
                  <span className="text-base font-semibold">{user.fullName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};