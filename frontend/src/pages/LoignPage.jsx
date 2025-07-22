import { useState } from "react";
import { useAuth} from "../store/useAuth";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import chattyLogo from "../assets/images.jpeg";
import axios from "axios";

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuth();
  const [error, setError] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [pendingLogin, setPendingLogin] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/api/auth/login", formData, { withCredentials: true });
      if (res.data.twoFactorRequired) {
        setShow2FA(true);
        setPendingLogin(formData);
      } else {
        login(formData);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("/api/auth/2fa/verify", { code: twoFACode }, { withCredentials: true });
      login(pendingLogin);
      setShow2FA(false);
      setTwoFACode("");
      setPendingLogin(null);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid 2FA code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-gray-800">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center animate-fade-in transition-shadow duration-300 hover:shadow-blue-500/30">
        <img src={chattyLogo} alt="Chatty Logo" className="w-20 h-20 rounded-full shadow-lg mb-4 animate-bounce-slow" />
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-300 mb-6">Sign in to your account</p>
        {error && <div className="w-full text-center text-red-400 mb-2 animate-fade-in">{error}</div>}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4" autoComplete="on">
          <div className="relative">
            <input
              type="email"
              id="email"
              className="input input-bordered w-full bg-white/20 text-white placeholder-transparent focus:bg-white/40 focus:ring-2 focus:ring-blue-400 transition-all peer"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              autoComplete="email"
              aria-label="Email"
            />
            <label htmlFor="email" className="absolute left-3 top-2 text-gray-300 text-sm pointer-events-none transition-all duration-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-400 peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-300">Email</label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="input input-bordered w-full bg-white/20 text-white placeholder-transparent focus:bg-white/40 focus:ring-2 focus:ring-blue-400 transition-all pr-10 peer"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="current-password"
              aria-label="Password"
            />
            <label htmlFor="password" className="absolute left-3 top-2 text-gray-300 text-sm pointer-events-none transition-all duration-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-blue-400 peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-300">Password</label>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-transform duration-200 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} className="transition-transform duration-200" /> : <Eye size={20} className="transition-transform duration-200" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-xs" />
              Remember me
            </label>
            <a href="/forgot-password" className="text-xs text-blue-400 hover:underline">Forgot password?</a>
          </div>
          <button
            type="submit"
            className="w-full py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all duration-200 shadow-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoggingIn}
            aria-busy={isLoggingIn}
          >
            {isLoggingIn ? <Loader2 className="animate-spin mx-auto" /> : "Sign in"}
          </button>
        </form>
        <div className="mt-6 text-xs text-gray-400">Don't have an account? <Link to="/signup" className="text-blue-400 hover:underline">Create one</Link></div>
      </div>
      {show2FA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center relative">
            <button
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-blue-600 text-2xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-full hover:bg-gray-100 shadow-sm z-20"
              aria-label="Close 2FA"
              onClick={() => setShow2FA(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Two-Factor Authentication</h3>
            <form onSubmit={handle2FAVerify} className="w-full flex flex-col gap-4">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Enter 2FA code"
                value={twoFACode}
                onChange={e => setTwoFACode(e.target.value)}
                required
                autoFocus
                maxLength={6}
              />
              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                Verify
              </button>
            </form>
            {error && <div className="w-full text-center text-red-400 mt-2 animate-fade-in">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
};