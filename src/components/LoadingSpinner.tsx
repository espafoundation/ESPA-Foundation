import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center min-h-screen">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-[#003828]/10 rounded-full"></div>
        {/* Inner spinning ring */}
        <div className="absolute inset-0 border-4 border-[#003828] border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-[#003828] font-medium text-sm tracking-[0.2em] uppercase animate-pulse">
        Loading
      </p>
    </div>
  );
}
