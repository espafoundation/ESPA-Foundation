import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const getFirstName = (u: any) => {
    if (!u) return "Dashboard";
    if (u.first_name && typeof u.first_name === 'string' && u.first_name.trim()) {
      return u.first_name.trim();
    }
    const raw = u.name || u.fullName || '';
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim().split(/\s+/)[0];
    }
    return "Dashboard";
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileMenuOpen]);

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-[999] px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between bg-white shadow-xs border-b border-[#003828]/5"
    >
      <Link to="/" className="flex items-center gap-2 z-50 relative" aria-label="ESPA Foundation Home">
        <svg className="h-[32px] text-[#003828] w-auto" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_350_59)">
            <path d="M188.9 99.9202V203.487H21.8804V299.761H188.9V412.08H0V512H313.618V0H0V99.9202H188.9Z" fill="currentColor"/>
            <path d="M512.211 0V99.9202H303.618V207.863H459.698V304.866H303.618V512H251.001L251 0H512.211Z" fill="currentColor"/>
          </g>
          <defs>
            <clipPath id="clip0_350_59">
              <rect width="512" height="512" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </Link>

      <div className="flex items-center gap-3 sm:gap-4 md:gap-8">
        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          <div className="relative group">
            <span className="cursor-pointer text-sm font-medium text-[#003828] hover:text-[#003828]/60 transition-colors flex items-center gap-1 py-2">
              Services
              <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
            </span>
            <div className="absolute top-full left-0 mt-0 w-48 bg-white border border-[#003828]/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 flex flex-col overflow-hidden z-[100]">
              <a href="https://library.espafoundation.social" className="px-4 py-2.5 text-sm hover:bg-[#003828]/5 transition-colors">Digital Library</a>
              <a href="https://esign.espafoundation.social" className="px-4 py-2.5 text-sm hover:bg-[#003828]/5 transition-colors">Digital Signature</a>
              <a href="https://pos.espafoundation.social" className="px-4 py-2.5 text-sm hover:bg-[#003828]/5 transition-colors">Point-of-Sale</a>
              <a href="https://ecard.espafoundation.social" className="px-4 py-2.5 text-sm hover:bg-[#003828]/5 transition-colors">Virtual Card</a>
            </div>
          </div>
          
          <Link to="/about" className="text-sm font-medium text-[#003828] hover:text-[#003828]/60 transition-colors flex items-center gap-1 py-2">
            About Us
          </Link>

          <Link to="/contact" className="text-sm font-medium text-[#003828] hover:text-[#003828]/60 transition-colors flex items-center gap-1 py-2">
            Contact Us
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/donate" className="hidden md:flex text-sm font-medium tracking-wide text-white bg-[#003828] border border-[#003828] px-5 py-2.5 rounded-full hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all items-center gap-2">Donate</Link>
          {isAuthenticated ? (
            <Link 
              to={user?.role?.includes("library") ? "/library/dashboard" : "/portal"}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('espa_activeTab', JSON.stringify('dashboard'));
                  window.localStorage.removeItem('ain_activeTab');
                }
              }}
              className="hidden md:flex text-sm font-medium tracking-wide text-[#003828] bg-white border border-[#003828] px-5 py-2.5 rounded-full hover:bg-[#003828] hover:text-white hover:border-[#003828] transition-all items-center gap-2"
            >
              {getFirstName(user)}
            </Link>
          ) : (
            <Link to="/portal" className="hidden md:flex text-sm font-medium tracking-wide text-[#003828] bg-white border border-[#003828] px-5 py-2.5 rounded-full hover:bg-[#003828] hover:text-white hover:border-[#003828] transition-all items-center gap-2">
              Login
            </Link>
          )}
          <button 
            className="md:hidden p-2 rounded-full transition-colors text-[#003828] hover:bg-[#003828]/5 touch-manipulation cursor-pointer" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} color="#003828" /> : <Menu size={24} color="#003828" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 top-[65px] bg-black/20 z-[998] md:hidden backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className="absolute top-full left-0 right-0 bg-white border-b border-[#003828]/10 shadow-xl flex flex-col py-5 px-6 gap-4 md:hidden z-[999] animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex flex-col gap-2">
              <Link to="/donate" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-white bg-[#003828] border border-[#003828] px-4 py-3 rounded-full hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all text-center mb-2 block touch-manipulation">Donate</Link>
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link to={user?.role?.includes("library") ? "/library/dashboard" : "/portal"} onClick={() => { setIsMobileMenuOpen(false); if (typeof window !== 'undefined') { window.localStorage.setItem('espa_activeTab', JSON.stringify('dashboard')); window.localStorage.removeItem('ain_activeTab'); } }} className="text-sm font-medium text-[#003828] bg-white border border-[#003828] px-4 py-3 rounded-full hover:bg-[#003828] hover:text-white hover:border-[#003828] transition-all text-center touch-manipulation">
                    {getFirstName(user)}
                  </Link>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                    className="text-sm font-medium text-red-600 bg-red-50 px-4 py-3 rounded-full hover:bg-red-100 transition-colors text-center touch-manipulation"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <Link to="/portal" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#003828] bg-white border border-[#003828] px-4 py-3 rounded-full hover:bg-[#003828] hover:text-white hover:border-[#003828] transition-all text-center mb-2 touch-manipulation">
                  Login
                </Link>
              )}
              <span className="text-xs font-bold text-[#003828]/50 uppercase tracking-wider mb-2 mt-4 block">
                Services
              </span>
              <a href="https://library.espafoundation.social" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#003828] hover:text-[#003828]/80 transition-colors py-1">Digital Library</a>
              <a href="https://esign.espafoundation.social" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#003828] hover:text-[#003828]/80 transition-colors py-1">Digital Signature</a>
              <a href="https://pos.espafoundation.social" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#003828] hover:text-[#003828]/80 transition-colors py-1">Point-of-Sale</a>
              <a href="https://ecard.espafoundation.social" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#003828] hover:text-[#003828]/80 transition-colors py-1">Virtual Card</a>
            </div>
            
            <div className="flex flex-col gap-3 pt-3 border-t border-stone-100">
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#003828] hover:text-[#003828]/80 transition-colors font-bold py-1">About Us</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-[#003828] hover:text-[#003828]/80 transition-colors font-bold py-1">Contact Us</Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
