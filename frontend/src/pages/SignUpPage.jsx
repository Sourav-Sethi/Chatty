import React, { useState } from 'react'
import { useAuth } from '../store/useAuth'
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import { Link } from 'react-router-dom';
import AuthImagePattern from '../components/AuthImagePattern.jsx';
import {toast} from 'react-hot-toast';

export const SignUpPage = () => {
  const [form, setform] = useState({
    fullName:"",
    email:"",
    password:""      
  })
  const {isSigningUp, signUpForm} = useAuth();
  const [password, setPassword] = useState(false)
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Object.values(newErrors).forEach(msg => toast.error(msg));
      return false;
    }
    return true;
  };

  const handleSubmit = (e)=>{
    e.preventDefault();
    const validForm = validateForm();
    if(validForm === true)signUpForm(form)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-4xl bg-base-100/90 rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-fade-in">
        <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center mb-8">
              <div className="flex flex-col items-center gap-2 group">
                <div className="size-14 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <MessageSquare className="size-7 text-blue-600"/>
                </div>
                <h1 className="text-3xl font-bold mt-2 text-gray-800">Create Account</h1>
                <p className="text-gray-500">Get Started with a Free Account</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-700">Full Name</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="size-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className={`input input-bordered w-full pl-10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 ${errors.fullName ? 'border-red-400' : ''}`}
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) => setform({ ...form, fullName: e.target.value })}
                  />
                </div>
                {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.fullName}</p>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-700">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="size-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className={`input input-bordered w-full pl-10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 ${errors.email ? 'border-red-400' : ''}`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setform({ ...form, email: e.target.value })}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-gray-700">Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="size-5 text-gray-400" />
                  </div>
                  <input
                    type={password ? "text" : "password"}
                    className={`input input-bordered w-full pl-10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setform({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => setPassword(!password)}
                    tabIndex={-1}
                  >
                    {password ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
              </div>

              <button type="submit" className="btn btn-primary w-full py-3 rounded-lg text-lg font-semibold shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-200" disabled={isSigningUp}>
                {isSigningUp ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-4 text-gray-400 text-sm">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <div className="text-center">
              <p className="text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="link link-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 p-10">
          <div className="w-full max-w-xs bg-base-100/90 rounded-2xl shadow-xl flex flex-col items-center p-8 gap-4 animate-fade-in">
            <div className="bg-blue-600 rounded-full p-4 mb-2 shadow-lg">
              <User className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Join our community</h2>
            <p className="text-base text-blue-100 text-center">Connect with friends, share moments, and stay in touch with your loved ones.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
