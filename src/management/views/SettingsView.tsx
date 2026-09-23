import React, { useState } from 'react';
import { Settings, Save, Archive, Shield, Key, Info, CheckCircle2, AlertCircle, Mail, Smartphone, QrCode, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const verifyTOTP = async (code) => {
  try {
    const res = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: code })
    });
    const data = await res.json();
    return !!data.valid;
  } catch (e) {
    return false;
  }
};
import { ToggleSwitch } from '../components/SharedComponents';
import { createPortal } from 'react-dom';
import DraggableModal from '../components/DraggableModal';

const Portal = ({ children }) => { return createPortal(children, document.body); };

export default function SettingsView({ currentUser, globalUsers, setUsers, showToast, addLog, twoFactorConfig, setTwoFactorConfig }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');


  
  const handlePasswordChange = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    
    const user = globalUsers?.find(u => u.id === currentUser.id);
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    if (user.password && user.password !== oldPassword) {
        showToast('Incorrect old password', 'error');
        return;
    }
    
    const updatedUsers = globalUsers.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
    setUsers(updatedUsers);
    showToast('Password updated successfully', 'success');
    addLog(`${currentUser.name} changed their password`);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-8 h-full flex flex-col tracking-tight relative pb-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Settings</h1>
          <p className="text-stone-500 text-sm mt-2 font-medium">Manage Profile Settings, User Preferences, and Authentication.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8 items-stretch">
          <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 flex flex-col h-full">
            <h2 className="text-lg font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-2">
                <Shield size={20} className="text-[#003828]" /> Security
            </h2>
            <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center shrink-0">
                            <Mail size={18} className="text-stone-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-stone-900">Email Address</p>
                            <p className="text-xs text-stone-500 mt-1">Receive OTP for Verification via Email.</p>
                        </div>
                    </div>
                    <ToggleSwitch 
                        enabled={twoFactorConfig?.emailEnabled || false} 
                        onChange={(val) => {
                            if (val) {
                                setIsEmailModalOpen(true);
                            } else {
                                setTwoFactorConfig({...twoFactorConfig, emailEnabled: false, enabled: twoFactorConfig?.authEnabled});
                                addLog(`Email 2FA disabled for ${currentUser.name}`);
                                showToast('Email 2FA Disabled', 'success');
                            }
                        }} 
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center shrink-0">
                            <Smartphone size={18} className="text-stone-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-stone-900">Authenticator</p>
                            <p className="text-xs text-stone-500 mt-1">Receive OTP for Verification via Authenticator.</p>
                        </div>
                    </div>
                    <ToggleSwitch 
                        enabled={twoFactorConfig?.authEnabled || false} 
                        onChange={(val) => {
                            if (val) {
                                setIsAuthModalOpen(true);
                            } else {
                                setTwoFactorConfig({...twoFactorConfig, authEnabled: false, enabled: twoFactorConfig?.emailEnabled});
                                addLog(`Authenticator 2FA disabled for ${currentUser.name}`);
                                showToast('Authenticator 2FA Disabled', 'success');
                            }
                        }} 
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center shrink-0">
                            <Key size={18} className="text-stone-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-stone-900">Password</p>
                            <p className="text-xs text-stone-500 mt-1">Update Your Account Password.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsChangingPassword(!isChangingPassword)} 
                        className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                        Change
                    </button>
                </div>
                
                {isChangingPassword && (
                  <Portal>
                    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" aria-hidden="true" onClick={() => setIsChangingPassword(false)} />
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
                      <DraggableModal className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-3 drag-handle cursor-grab active:cursor-grabbing touch-none">
                          <Key className="text-[#003828] pointer-events-none" size={24} /> <span className="pointer-events-none font-medium">Change Password</span>
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Old Password</label>
                            <input 
                              type="password" 
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#003828] focus:border-[#003828] text-sm"
                              placeholder="Enter old password"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">New Password</label>
                            <input 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#003828] focus:border-[#003828] text-sm"
                              placeholder="Enter new password"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#003828] focus:border-[#003828] text-sm"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                        <div className="mt-8 pt-4 border-t border-stone-100 flex justify-end gap-3 shrink-0">
                          <button onClick={() => setIsChangingPassword(false)} className="px-5 py-2.5 text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors">Cancel</button>
                          <button 
                            onClick={() => {
                                handlePasswordChange();
                                setIsChangingPassword(false);
                            }} 
                            className="px-6 py-2.5 bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] text-white rounded-xl font-semibold flex items-center gap-2 transition-colors text-sm"
                          >
                            <Save size={16} /> Update
                          </button>
                        </div>
                      </DraggableModal>
                    </div>
                  </Portal>
                )}
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 flex flex-col h-full">
            <h2 className="text-lg font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-2">
                <Info size={20} className="text-[#003828]" /> About
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold text-[#003828]">ESPA Management</h2>
                    <p className="text-sm text-stone-500 mt-4">Software Version 1.0.1</p>
                </div>
                
                <div className="w-full max-w-[150px] border-t border-stone-100 my-6"></div>
                
                <div className="flex flex-col items-center justify-center pb-2">
                    <p className="text-sm text-stone-500 mb-4">An Initiative Of</p>
                    
                    <div className="w-32 sm:w-40 h-auto mb-6 font-bold text-xl text-[#003828]">ESPA Foundation</div>
                    
                    <a href="https://linktr.ee/shaaaaabbir" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-stone-100 bg-stone-50 hover:bg-stone-100 transition-colors flex items-center justify-center text-[#003828]">
                        <Globe size={20} strokeWidth={2} />
                    </a>
                </div>
            </div>
          </div>
      </div>
      
      <Portal>
        {isEmailModalOpen && (
          <>
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" aria-hidden="true" onClick={() => setIsEmailModalOpen(false)} />
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
              <DraggableModal className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#003828]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} className="text-[#003828]" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">Verify Email</h3>
                <p className="text-sm text-stone-500 mt-2">Enter the 6-digit session code sent to your email address to activate 2FA.</p>
              </div>
              
              <div className="mb-6">
                <input 
                  type="text" 
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 text-center tracking-[1em] font-mono text-2xl border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003828]"
                  placeholder="••••••"
                  autoFocus
                />
                {verificationError && <p className="text-red-500 text-xs mt-2 text-center">{verificationError}</p>}
              </div>
              
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setVerificationCode('');
                    setVerificationError('');
                  }} 
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (verificationCode.length === 6) {
                      const isValid = await verifyTOTP(verificationCode);
                      if (isValid) {
                        setTwoFactorConfig({...twoFactorConfig, emailEnabled: true, enabled: true, requireForLogin: true});
                        setIsEmailModalOpen(false);
                        setVerificationCode('');
                        showToast('Two-Factor Authentication is active. Your account is secured.', 'success');
                        addLog(`Email 2FA enabled for ${currentUser.name}`);
                      } else {
                        setVerificationError('Invalid Code. Please try again.');
                      }
                    } else {
                      setVerificationError('Please enter a valid 6-digit code');
                    }
                  }} 
                  className="flex-1 px-4 py-3 font-semibold rounded-xl transition-colors bg-[#003828] text-white border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828]"
                >
                  Activate
                </button>
              </div>
              </DraggableModal>
            </div>
          </>
        )}
        
        {isAuthModalOpen && (
          <>
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" aria-hidden="true" onClick={() => setIsAuthModalOpen(false)} />
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
              <DraggableModal className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#003828]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone size={32} className="text-[#003828]" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900">Configure Authenticator</h3>
                <p className="text-sm text-stone-500 mt-2">Scan the QR code below with Google or Microsoft Authenticator, then insert the time-session code to activate 2FA.</p>
              </div>
              
              <div className="flex justify-center mb-6">
                <div className="w-48 h-48 bg-white border-2 border-stone-200 rounded-2xl flex items-center justify-center">
                  <QRCodeSVG value={`otpauth://totp/ESPA%20Management:${currentUser?.email || currentUser?.username}?secret=JBSWY3DPEHPK3PXP&issuer=ESPA%20Management`} size={160} />
                </div>
              </div>
              
              <div className="mb-6">
                <input 
                  type="text" 
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 text-center tracking-[1em] font-mono text-2xl border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003828]"
                  placeholder="••••••"
                />
                {verificationError && <p className="text-red-500 text-xs mt-2 text-center">{verificationError}</p>}
              </div>
              
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setVerificationCode('');
                    setVerificationError('');
                  }} 
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (verificationCode.length === 6) {
                      const isValid = await verifyTOTP(verificationCode);
                      if (isValid) {
                        setTwoFactorConfig({...twoFactorConfig, authEnabled: true, enabled: true, requireForLogin: true});
                        setIsAuthModalOpen(false);
                        setVerificationCode('');
                        showToast('Two-Factor Authentication is active. Your account is secured.', 'success');
                        addLog(`Authenticator 2FA enabled for ${currentUser.name}`);
                      } else {
                        setVerificationError('Invalid Code. Please try again.');
                      }
                    } else {
                      setVerificationError('Please enter a valid 6-digit code');
                    }
                  }} 
                  className="flex-1 px-4 py-3 font-semibold rounded-xl transition-colors bg-[#003828] text-white border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828]"
                >
                  Activate
                </button>
              </div>
              </DraggableModal>
            </div>
          </>
        )}
      </Portal>

    </div>
  );
}
