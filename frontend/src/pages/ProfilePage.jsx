import { useState } from "react";
import { useAuth } from "../store/useAuth";
import { Camera, Mail, User, MessageCircle, Loader2 } from "lucide-react";
import axios from "axios";

export const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuth();
  const [selectedImg, setSelectedImg] = useState(null);
  const [status, setStatus] = useState(authUser.status || "");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(authUser.twoFactorEnabled || false);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleStatusSave = async () => {
    setIsSavingStatus(true);
    await updateProfile({ status });
    setIsSavingStatus(false);
  };

  const handleEnable2FA = async () => {
    setIs2FALoading(true);
    try {
      const res = await axios.post("/api/auth/2fa/enable", {}, { withCredentials: true });
      setQrUrl(res.data.otpauth_url);
      setSecret(res.data.base32);
      setShow2FASetup(true);
    } catch {}
    setIs2FALoading(false);
  };

  const handleDisable2FA = async () => {
    setIs2FALoading(true);
    try {
      await axios.post("/api/auth/2fa/disable", {}, { withCredentials: true });
      setIs2FAEnabled(false);
    } catch {}
    setIs2FALoading(false);
  };

  const handle2FASetupDone = () => {
    setIs2FAEnabled(true);
    setShow2FASetup(false);
    setQrUrl("");
    setSecret("");
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                className="size-32 rounded-full object-cover border-4 "
              />

              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
              <Camera className="w-5 h-5 text-base-200" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUpdatingProfile}
              />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Status Message
              </div>
              <div className="flex gap-2 items-center">
                <input
                  className="input input-bordered input-sm flex-1"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  maxLength={100}
                  placeholder="Set a status..."
                  disabled={isSavingStatus || isUpdatingProfile}
                />
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleStatusSave}
                  disabled={isSavingStatus || isUpdatingProfile}
                >
                  {isSavingStatus ? <Loader2 className="animate-spin w-4 h-4" /> : "Save"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-zinc-700 mt-4">
                <span>Two-Factor Authentication</span>
                {is2FAEnabled ? (
                  <button className="btn btn-xs btn-error" onClick={handleDisable2FA} disabled={is2FALoading}>
                    {is2FALoading ? "Disabling..." : "Disable 2FA"}
                  </button>
                ) : (
                  <button className="btn btn-xs btn-primary" onClick={handleEnable2FA} disabled={is2FALoading}>
                    {is2FALoading ? "Enabling..." : "Enable 2FA"}
                  </button>
                )}
              </div>
              {show2FASetup && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-semibold mb-2">Scan this QR code in your authenticator app:</div>
                  {qrUrl && <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUrl)}&size=180x180`} alt="2FA QR" className="mx-auto mb-2" />}
                  <div className="text-xs text-blue-800 mb-2">Or enter this secret: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{secret}</span></div>
                  <div className="text-xs text-gray-600 mb-2">After scanning, enter the code in your app to finish setup.</div>
                  <button className="btn btn-xs btn-success w-full" onClick={handle2FASetupDone}>Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
