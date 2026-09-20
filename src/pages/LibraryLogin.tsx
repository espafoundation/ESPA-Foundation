import { LibraryLogo } from "../components/LibraryLogo";
import { Helmet } from 'react-helmet-async';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';

export const AINLogo = ({ className = "" }) => (
  <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}><g clipPath="url(#clip0_350_59)"><path d="M188.9 99.9202V203.487H21.8804V299.761H188.9V412.08H0V512H313.618V0H0V99.9202H188.9Z" fill="currentColor"/><path d="M512.211 0V99.9202H303.618V207.863H459.698V304.866H303.618V512H251.001L251 0H512.211Z" fill="currentColor"/></g><defs><clipPath id="clip0_350_59"><rect width="512.211" height="512" fill="white"/></clipPath></defs></svg>
);
export const FontStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
    :root {
      --font-main: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .font-main { font-family: var(--font-main) !important; scrollbar-width: none; -ms-overflow-style: none; }
    ::-webkit-scrollbar { display: none; }
  `}} />
);

export default function LibraryLogin() {
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = window.localStorage.getItem('ain_currentUser');
    if (userStr && userStr !== 'null') {
      navigate('/library/dashboard');
    }
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const usersStr = window.localStorage.getItem("ain_users");
    let users: any[] = [];
    if (usersStr) {
      try { users = JSON.parse(usersStr); } catch (e) {}
    }

    if (isSignUp) {
      const recaptchaToken = recaptchaRef.current?.getValue();
      if (!recaptchaToken) {
        setError('Please complete the reCAPTCHA');
        return;
      }
      
      if (users.find((u: any) => u.email.toLowerCase() === loginEmail.toLowerCase())) {
        setError('Email already exists');
        return;
      }
      
      // Generate OTP and send via backend
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedOtp(generatedOtp);
      setIsSending(true);
      setError('');
      try {
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, otp: generatedOtp, recaptchaToken })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send OTP');
        }
        
        setShowOtpScreen(true);
        toast.success(`OTP sent to ${loginEmail}. Please check your email.`);
      } catch (err: any) {
        setError(err.message || 'Error communicating with server');
        recaptchaRef.current?.reset();
      } finally {
        setIsSending(false);
      }
      return;
    } else {
      const user = users.find((u: any) => 
        (u.email.toLowerCase() === loginEmail.toLowerCase() || 
         (u.username && u.username.toLowerCase() === loginEmail.toLowerCase())) && 
        u.password === loginPassword && u.active !== false
      );

      if (user) {
        window.localStorage.setItem("ain_currentUser", JSON.stringify(user));
        window.dispatchEvent(new Event('ain_user_changed'));
        navigate('/library/dashboard');
      } else {
        setError('Invalid credentials');
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');
    
    if (otpCode !== expectedOtp) {
      setError('Invalid verification code');
      setIsVerifying(false);
      return;
    }
    
    // Complete Sign Up
    const usersStr = window.localStorage.getItem("ain_users");
    let users = [];
    if (usersStr) {
      try { users = JSON.parse(usersStr); } catch (e) {}
    }
    
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: signupName,
      email: loginEmail.toLowerCase(),
      password: loginPassword,
      role: 'libraryReader',
      active: true,
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    users.push(newUser);
    window.localStorage.setItem("ain_users", JSON.stringify(users));
    
    // Auto login
    window.localStorage.setItem("ain_currentUser", JSON.stringify(newUser));
    window.dispatchEvent(new Event('ain_user_changed'));
    setIsVerifying(false);
    navigate('/library/dashboard');
    toast.success('Account created successfully!');
  };


  return (
    <div className="w-full h-[calc(100dvh-80px)] overflow-hidden m-0 p-0 bg-white"><div className="min-h-full flex bg-[#FDFCFB]">
      <Helmet>
        <title>Login | ESPA Digital Library</title>
      </Helmet>
      <FontStyles />
      
      <div className="hidden lg:flex w-1/2 bg-[#003828] relative overflow-hidden flex-col justify-between p-12">
          <div className="relative z-10">
              <LibraryLogo className="text-white w-96 mb-8" />
              
          </div>
          
          <div className="relative z-10 flex gap-4 text-white/60 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
          
          <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-[#005c42] rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute top-[10%] -left-[20%] w-[50%] h-[50%] bg-[#00261B] rounded-full blur-[100px] pointer-events-none"></div>
      </div>
      
      <div className="w-full lg:w-[70%] flex items-center justify-center p-8 lg:p-24 relative bg-[#FDFCFB]">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-12 flex justify-center">
              <LibraryLogo className="text-[#003828] w-96" />
          </div>
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-stone-900 tracking-tight">{isSignUp ? 'Sign Up' : 'Login'}</h2>
            <p className="text-stone-500 mt-2 text-sm font-medium">
              {isSignUp ? 'Create a Digital Library account.' : 'Please enter your details to sign in.'}
            </p>
          </div>

            
            {showOtpScreen ? (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">Verification Code</label>
                  <p className="text-sm text-stone-500 mb-4">We've sent a 6-digit code to {loginEmail}. <br/><span className="text-xs font-mono mt-2 inline-block bg-stone-100 px-2 py-1 rounded text-stone-600 border border-stone-200">Test OTP: {expectedOtp}</span></p>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3.5 text-center tracking-[1em] font-mono text-2xl bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all placeholder-stone-400"
                    placeholder="••••••"
                    required
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                
                <button disabled={isVerifying} type="submit" className="w-full py-3.5 bg-[#003828] text-white border border-[#003828] rounded-full font-bold hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 text-sm mt-8 disabled:opacity-70 disabled:transform-none cursor-pointer">
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => { setShowOtpScreen(false); setOtpCode(''); setError(''); }}
                  className="w-full mt-4 text-sm font-semibold text-stone-500 hover:text-stone-700"
                >
                  Back to Sign Up
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
                      <input 
                        type="text" 
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm font-medium shadow-sm placeholder-stone-400 text-stone-900"
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-black mb-2 uppercase tracking-wider">Email {isSignUp ? '' : 'or Username'}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
                    <input 
                      type="text" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm font-medium shadow-sm placeholder-stone-400 text-stone-900"
                      placeholder={`Enter email${isSignUp ? '' : ' or username'}`}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-black uppercase tracking-wider">Password</label>
                      {!isSignUp && <a href="#" className="text-xs font-semibold text-black hover:underline">Forgot password?</a>}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm font-medium shadow-sm placeholder-stone-400 text-stone-900"
                      placeholder="••••••••"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="flex justify-center">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                    />
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button disabled={isSending} type="submit" className="w-full py-3.5 bg-[#003828] text-white border border-[#003828] rounded-full font-bold hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2 text-sm mt-8 disabled:opacity-70 disabled:transform-none cursor-pointer">
                  {isSending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    <>{isSignUp ? 'Sign Up' : 'Sign In'} <BookOpen size={16} /></>
                  )}
                </button>

                <div className="text-center mt-6">
                  <button 
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                    className="text-[#003828] text-sm font-semibold hover:underline"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
