import { Routes, Route, Navigate } from "react-router-dom";
import {SettingsPage} from "./pages/SettingsPage.jsx"
import {LoginPage} from "./pages/LoignPage.jsx"
import {SignUpPage} from "./pages/SignUpPage.jsx"
import {HomePage} from "./pages/HomePage.jsx"
import {ProfilePage} from "./pages/ProfilePage.jsx"
import {Navbar} from "./components/Navbar.jsx"
import { useAuth } from "./store/useAuth.js";
import { useEffect } from "react";
import {Toaster} from "react-hot-toast";
import { useTheme } from "./store/useThemes.js";
import chattyLogo from "./assets/images.jpeg";
const App = ()=>{
  const{theme} = useTheme();
  const {checkAuth, authUser, isCheckingAuth, onlineUsers} = useAuth();
  useEffect(()=>{
    checkAuth()
  },[checkAuth])
  // console.log("authUser: ",authUser);
  // console.log("Online users: ",onlineUsers)
  if(isCheckingAuth && !authUser){
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-fade-in font-sans">
        <div className="flex flex-col items-center gap-7 w-full">
          <div className="relative flex flex-col items-center">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-0">
              <div className="glow-circle"></div>
            </div>
            <div className="z-10">
              <img src={chattyLogo} alt="Chatty Logo" className="w-20 h-20 rounded-full shadow-lg animate-bounce-slow object-cover bg-white" />
            </div>
          </div>
          <div className="text-5xl font-extrabold text-white animate-fade-in-slow tracking-wide drop-shadow-lg font-logo">Chatty</div>
          <div className="text-lg text-gray-400 animate-fade-in-slow">Connecting you to your conversations...</div>
          <div className="mt-4">
            <span className="inline-block animate-spin-pro rounded-full border-4 border-t-blue-500 border-b-blue-500 border-x-transparent h-12 w-12"></span>
          </div>
          <div className="mt-8 text-xs text-gray-500 animate-fade-in-slow">Powered by Chatty &bull; Secure &bull; Fast &bull; Modern</div>
        </div>
      </div>
    )
  }
  return (
    <div data-theme = {theme}>
      <Navbar/>
      <Routes>
        <Route path="/" element={authUser ? <HomePage/> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage/> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage/> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage/>} />
        <Route path="/profile" element={authUser ? <ProfilePage/> : <Navigate to="/login" />} />
      </Routes>
      <Toaster/>
    </div>
  )
}
export default App;

/*
Add to your global CSS (e.g., styles.css):
.font-logo { font-family: 'Poppins', 'Inter', sans-serif; letter-spacing: 0.04em; }
.font-sans { font-family: 'Inter', sans-serif; }
.glow-circle { width: 120px; height: 60px; border-radius: 50%; background: radial-gradient(circle, #3b82f6 0%, #2563eb 60%, transparent 100%); filter: blur(32px) brightness(1.2); opacity: 0.7; }
.animate-bounce-slow { animation: bounceSlow 2.2s infinite; }
@keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
.animate-spin-pro { animation: spin 1.1s linear infinite; }
.animate-fade-in { animation: fadeIn 0.7s ease; }
.animate-fade-in-slow { animation: fadeIn 1.5s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
*/