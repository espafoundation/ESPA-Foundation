import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function ServiceLogin() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center -mt-20">
      <div className="w-full max-w-[400px] px-6 flex flex-col items-center">
        
        {/* Exact ESPA Logo from Footer */}
        <div className="mb-10 text-[#003828]">
          
        </div>

        <form className="w-full flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#003828]/60 tracking-wider">
              USERNAME/ID<span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="Enter Username/ID"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] text-stone-900 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#003828]/60 tracking-wider">
              PASSWORD<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] text-stone-900 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-stone-900 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            className="w-full mt-2 bg-[#003828] text-white border border-[#003828] font-bold py-3.5 rounded-full hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all cursor-pointer shadow-sm"
          >
            Login
          </button>

          <div className="text-center mt-2">
            <a href="#" className="text-[#003828]/60 font-medium hover:text-[#003828] text-sm transition-colors">
              Sign Up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
