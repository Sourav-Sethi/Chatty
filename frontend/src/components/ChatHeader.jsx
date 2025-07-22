import { X } from "lucide-react";
import { useAuth } from "../store/useAuth";
import { useChat } from "../store/useChat";
import { useState, useEffect } from "react";
import axios from "axios";

export const ChatHeader = () => {
  const { selectedUser, setselectedUser } = useChat();
  const { onlineUsers, authUser } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoadingBlock, setIsLoadingBlock] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    if (showProfile && authUser && selectedUser) {
      setIsBlocked(authUser.blockedUsers?.includes(selectedUser._id));
    }
  }, [showProfile, authUser, selectedUser]);

  const handleBlock = async () => {
    setIsLoadingBlock(true);
    try {
      await axios.post("/api/auth/block", { blockId: selectedUser._id }, { withCredentials: true });
      setIsBlocked(true);
    } catch {}
    setIsLoadingBlock(false);
  };
  const handleUnblock = async () => {
    setIsLoadingBlock(true);
    try {
      await axios.post("/api/auth/unblock", { blockId: selectedUser._id }, { withCredentials: true });
      setIsBlocked(false);
    } catch {}
    setIsLoadingBlock(false);
  };
  const handleReport = async () => {
    setIsLoadingBlock(true);
    try {
      await axios.post("/api/auth/report", { reportId: selectedUser._id, reason: reportReason }, { withCredentials: true });
      setShowReport(false);
      setReportReason("");
    } catch {}
    setIsLoadingBlock(false);
  };

  // Handle game challenge
  function handleChallenge(gameName) {
    alert(`Challenge sent to ${selectedUser.fullName} for ${gameName}!`);
    // TODO: Integrate with backend/socket logic
  }

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar cursor-pointer" onClick={() => setShowProfile(true)}>
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} />
            </div>
          </div>
          <div className="cursor-pointer" onClick={() => setShowProfile(true)}>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <button onClick={() => setselectedUser(null)}>
          <X />
        </button>
      </div>
      {/* User Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center relative">
            <button
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-blue-600 text-2xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full hover:bg-gray-100 shadow-sm z-20"
              aria-label="Close profile"
              onClick={() => setShowProfile(false)}
            >
              &times;
            </button>
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              className="size-24 rounded-full object-cover border-4 border-blue-200 shadow mb-4"
              alt="User avatar"
            />
            <h2 className="text-xl font-bold text-gray-800 mb-1">{selectedUser.fullName}</h2>
            <p className="text-blue-600 font-medium mb-2">{onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}</p>
            {selectedUser.status && (
              <p className="text-gray-600 text-center mb-2 px-2">{selectedUser.status}</p>
            )}
            {/* Block/Unblock and Report Buttons */}
            {selectedUser._id !== authUser._id && (
              <div className="flex flex-col gap-2 mt-4 w-full">
                <button
                  className={`btn btn-sm w-full ${isBlocked ? "btn-secondary" : "btn-error"}`}
                  onClick={isBlocked ? handleUnblock : handleBlock}
                  disabled={isLoadingBlock}
                >
                  {isBlocked ? "Unblock" : "Block"}
                </button>
                <button
                  className="btn btn-sm w-full btn-warning"
                  onClick={() => setShowReport(true)}
                  disabled={isLoadingBlock}
                >
                  Report
                </button>
              </div>
            )}
            {/* Report Modal */}
            {showReport && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs flex flex-col items-center relative">
                  <button
                    className="absolute top-2 right-3 text-gray-400 hover:text-red-600 text-xl font-bold"
                    onClick={() => setShowReport(false)}
                  >
                    &times;
                  </button>
                  <h4 className="text-lg font-bold mb-2">Report User</h4>
                  <textarea
                    className="input input-bordered w-full mb-3"
                    placeholder="Reason for report..."
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                  />
                  <button
                    className="btn btn-error w-full"
                    onClick={handleReport}
                    disabled={isLoadingBlock || !reportReason.trim()}
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};