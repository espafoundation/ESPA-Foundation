import React, { useState } from 'react';
import { Settings, Save, Archive, Shield, Key, Info, CheckCircle2, AlertCircle, Mail, Smartphone, QrCode, Globe, User, Upload, Activity, Wallet, Trash2, Lock, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { verifyTOTP } from './ManagementPortal';
import { ToggleSwitch, ConfirmModal } from './SharedComponents';
import { createPortal } from 'react-dom';
import DraggableModal from './DraggableModal';

const Portal = ({ children }) => { return createPortal(children, document.body); };

export default function SettingsView({ currentUser, setCurrentUser, globalUsers, setUsers, showToast, addLog, twoFactorConfig, setTwoFactorConfig, setActiveTab, onNavigate, funds, setFunds, logs, setLogs }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [settingsTab, setSettingsTab] = useState('profile');
  const [confirm, setConfirm] = useState(null);

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
        if (currentUser.id === 'A01' && oldPassword === currentUser.password) {
            showToast('Admin password changed successfully', 'success');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            addLog('Admin changed their password');
            return;
        }
        showToast('Authentication failed', 'error');
        return;
    }

    if (user.password !== oldPassword) {
      showToast('Incorrect current password', 'error');
      return;
    }

    setUsers((globalUsers || []).map(u => u.id === currentUser.id ? {...u, password: newPassword} : u));
    showToast('Password updated successfully', 'success');
    addLog(`Password changed for ${currentUser.name}`);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-0 h-full flex flex-col tracking-tight relative pb-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-2">Settings</h1>
          <p className="text-stone-500 text-base mt-2 font-medium">Manage Profile Settings, User Preferences, and Authentication.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 border-b border-stone-200 mb-8 shrink-0 overflow-x-auto pb-4">
        {['profile', 'security', 'data', 'funds', 'system'].map(tab => (
          <button 
            key={tab}
            onClick={() => setSettingsTab(tab)}
            className={`px-5 py-2.5 font-semibold text-sm rounded-full transition-colors whitespace-nowrap ${settingsTab === tab ? 'bg-[#003828] text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'}`}
          >
            {tab === 'profile' ? 'Profile Info' : tab === 'security' ? 'Security' : tab === 'data' ? 'Data' : tab === 'funds' ? 'Funds' : 'System Actions'}
          </button>
        ))}
      </div>
      
      <div className="flex-1 w-full">
        {settingsTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 flex flex-col h-full">
            <h2 className="text-lg font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-2">
                <User size={20} className="text-[#003828]" /> Profile
            </h2>
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-[#003828] text-white flex items-center justify-center font-bold text-3xl shadow-sm border-4 border-stone-50 shrink-0 relative overflow-hidden group">
                        {currentUser.avatar ? (
                            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            currentUser.name.charAt(0)
                        )}
                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex flex-col items-center justify-center transition-colors">
                            <label className="cursor-pointer p-1 hover:bg-white/20 rounded-full transition-colors mb-1" title="Upload Photo">
                                <Upload size={18} className="text-white" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                        const result = e.target.result;
                                        const updatedUsers = (globalUsers || []).map(u => u.id === currentUser.id ? {...u, avatar: result} : u);
                                        setUsers(updatedUsers);
                                        if (setCurrentUser) setCurrentUser(updatedUsers.find(u => u.id === currentUser.id));
                                        showToast('Profile picture updated successfully', 'success');
                                        addLog(`Profile picture updated for ${currentUser.name}`);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }} />
                        </label>
                            {currentUser.avatar && (
                                <button 
                                    onClick={() => {
                                        const updatedUsers = (globalUsers || []).map(u => u.id === currentUser.id ? {...u, avatar: null} : u);
                                        setUsers(updatedUsers);
                                        if (setCurrentUser) setCurrentUser(updatedUsers.find(u => u.id === currentUser.id));
                                        showToast('Profile picture removed', 'info');
                                        addLog(`Profile picture removed for ${currentUser.name}`);
                                    }}
                                    className="cursor-pointer p-1 hover:bg-white/20 rounded-full transition-colors text-white" 
                                    title="Remove Photo"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left w-full">
                        {(() => {
                            const isMasterAdmin = Boolean(
                              currentUser?.isMasterAdmin === true || 
                              currentUser?.id === 'A00' || 
                              (currentUser?.role && currentUser.role.toLowerCase() === 'master admin') || 
                              (currentUser?.username && currentUser.username.toLowerCase() === 'developer')
                            );
                            if (isMasterAdmin) {
                                return (
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            defaultValue={currentUser.name} 
                                            onBlur={(e) => {
                                                const newName = e.target.value.trim();
                                                if (newName && newName !== currentUser.name) {
                                                    const updatedUsers = (globalUsers || []).map(u => u.id === currentUser.id ? { ...u, name: newName } : u);
                                                    setUsers(updatedUsers);
                                                    const updatedCurrentUser = { ...currentUser, name: newName };
                                                    if (setCurrentUser) setCurrentUser(updatedCurrentUser);
                                                    try {
                                                        localStorage.setItem('espa_currentUser', JSON.stringify(updatedCurrentUser));
                                                        localStorage.removeItem('ain_currentUser');
                                                        localStorage.setItem('espa_users', JSON.stringify(updatedUsers));
                                                        localStorage.removeItem('ain_users');
                                                        window.dispatchEvent(new CustomEvent('espa_user_changed'));
                                                    } catch (err) {}
                                                    showToast('Master Admin name updated successfully', 'success');
                                                    addLog(`Master Admin changed name to ${newName}`);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#003828]/40 focus:outline-none focus:ring-2 focus:ring-[#003828] font-semibold text-stone-900 bg-white" 
                                            placeholder="Enter full name"
                                        />
                                        <p className="text-[11px] text-[#003828] font-medium mt-1">
                                            Master Admin privilege: You are authorized to change your name.
                                        </p>
                                    </div>
                                );
                            }
                            return (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Full Name</label>
                                        <span className="text-[10px] font-semibold text-stone-400 flex items-center gap-1">
                                            <Lock size={11} /> Locked
                                        </span>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={currentUser.name} 
                                        disabled 
                                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed font-medium select-none" 
                                    />
                                    <p className="text-[11px] text-stone-500 mt-1 font-medium flex items-center gap-1.5">
                                        <AlertCircle size={13} className="text-amber-600 shrink-0" />
                                        Name change is only permitted to the Master Admin. Other than the Master Admin, no one can change their name.
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Email Address</label>
                        <input type="email" defaultValue={currentUser.email || currentUser.username} onBlur={(e) => {
                            if(e.target.value !== (currentUser.email || currentUser.username)) {
                                const updatedUsers = (globalUsers || []).map(u => u.id === currentUser.id ? {...u, email: e.target.value, username: e.target.value} : u);
                                setUsers(updatedUsers);
                                if (setCurrentUser) setCurrentUser(updatedUsers.find(u => u.id === currentUser.id));
                                showToast('Email address updated', 'success');
                                addLog(`Email updated for ${currentUser.name}`);
                            }
                        }} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#003828] font-medium text-stone-800" placeholder="Enter email address" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                        <input type="tel" defaultValue={currentUser.phone || ''} onBlur={(e) => {
                            if(e.target.value !== currentUser.phone) {
                                const updatedUsers = (globalUsers || []).map(u => u.id === currentUser.id ? {...u, phone: e.target.value} : u);
                                setUsers(updatedUsers);
                                if (setCurrentUser) setCurrentUser(updatedUsers.find(u => u.id === currentUser.id));
                                showToast('Phone number updated', 'success');
                                addLog(`Phone number updated for ${currentUser.name}`);
                            }
                        }} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#003828] font-medium text-stone-800" placeholder="+1 (555) 000-0000" />
                    </div>
                </div>
            </div>
          </div>
          </div>
        )}

        {settingsTab === 'security' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 flex flex-col h-full">
            <h2 className="text-lg font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-2">
                <Shield size={20} className="text-[#003828]" /> Security
            </h2>
            <div className="space-y-4 flex-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-stone-800 flex items-center gap-2"><Key size={16} /> Two-Factor Authentication</h3>
                      <p className="text-xs text-stone-500 mt-1">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <div className="space-y-3 pl-6 border-l-2 border-stone-100">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/50">
                      <div className="flex items-center gap-3">
                        <Mail size={18} className={twoFactorConfig.emailEnabled ? "text-[#003828]" : "text-stone-400"} />
                        <div>
                          <p className="font-semibold text-sm text-stone-800">Email Verification</p>
                          <p className="text-xs text-stone-500">Receive codes via email</p>
                        </div>
                      </div>
                      <ToggleSwitch 
                        enabled={Boolean(twoFactorConfig?.emailEnabled)} 
                        onChange={(checked) => {
                          if (checked) {
                            setVerificationCode('');
                            setVerificationError('');
                            setIsEmailModalOpen(true);
                            fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: currentUser.email, purpose: 'management' }) })
                              .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Unable to send verification code.'); showToast('Verification code sent to your email.', 'success'); })
                              .catch(err => { setVerificationError(err.message || 'Unable to send verification code.'); });
                          } else {
                            const newAuthEnabled = Boolean(twoFactorConfig?.authEnabled);
                            setTwoFactorConfig({
                              ...twoFactorConfig, 
                              emailEnabled: false, 
                              enabled: newAuthEnabled, 
                              requireForLogin: newAuthEnabled
                            });
                            if (currentUser) {
                              currentUser.twoFactorEnabled = newAuthEnabled;
                              currentUser.twoFactorEmailEnabled = false;
                              if (!newAuthEnabled) currentUser.twoFactorTotpEnabled = false;
                            }
                            if (setUsers && globalUsers) {
                              setUsers(globalUsers.map(u => u.id === currentUser?.id ? { 
                                ...u, 
                                twoFactorEnabled: newAuthEnabled,
                                twoFactorEmailEnabled: false,
                                ...(newAuthEnabled ? {} : { twoFactorTotpEnabled: false })
                              } : u));
                            }
                            showToast('Email 2FA disabled', 'info');
                            addLog(`Email 2FA disabled for ${currentUser.name}`);
                          }
                        }} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/50">
                      <div className="flex items-center gap-3">
                        <Smartphone size={18} className={twoFactorConfig.authEnabled ? "text-[#003828]" : "text-stone-400"} />
                        <div>
                          <p className="font-semibold text-sm text-stone-800">Authenticator App</p>
                          <p className="text-xs text-stone-500">Use Google/Microsoft Authenticator</p>
                        </div>
                      </div>
                      <ToggleSwitch 
                        enabled={Boolean(twoFactorConfig?.authEnabled)} 
                        onChange={(checked) => {
                          if (checked) {
                            if (!twoFactorConfig?.authSecret) setTwoFactorConfig({...twoFactorConfig, authSecret: randomBase32Secret()});
                            setIsAuthModalOpen(true);
                          } else {
                            const newEmailEnabled = Boolean(twoFactorConfig?.emailEnabled);
                            setTwoFactorConfig({
                              ...twoFactorConfig, 
                              authEnabled: false, 
                              enabled: newEmailEnabled, 
                              requireForLogin: newEmailEnabled
                            });
                            if (currentUser) {
                              currentUser.twoFactorEnabled = newEmailEnabled;
                              currentUser.twoFactorTotpEnabled = false;
                              if (!newEmailEnabled) currentUser.twoFactorEmailEnabled = false;
                            }
                            if (setUsers && globalUsers) {
                              setUsers(globalUsers.map(u => u.id === currentUser?.id ? { 
                                ...u, 
                                twoFactorEnabled: newEmailEnabled,
                                twoFactorTotpEnabled: false,
                                ...(newEmailEnabled ? {} : { twoFactorEmailEnabled: false })
                              } : u));
                            }
                            showToast('Authenticator 2FA disabled', 'info');
                            addLog(`Authenticator 2FA disabled for ${currentUser.name}`);
                          }
                        }} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 mt-4 border-t border-stone-100">
                    <button 
                      onClick={() => setIsChangingPassword(true)}
                      className="w-full px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Key size={16} /> Change Password
                    </button>
                </div>
                
                {isChangingPassword && (
                  <Portal>
                    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" onClick={() => setIsChangingPassword(false)} />
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
                      <DraggableModal className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                          <Shield className="text-[#003828]" size={24} /> Change Password
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Current Password</label>
                            <input 
                              type="password" 
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#003828]"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">New Password</label>
                            <input 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#003828]"
                              placeholder="Enter new password"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#003828]"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-8">
                          <button onClick={() => setIsChangingPassword(false)} className="px-5 py-2.5 text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors">Cancel</button>
                          <button 
                            onClick={() => {
                                handlePasswordChange();
                                setIsChangingPassword(false);
                            }} 
                            className="px-6 py-2.5 bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] text-white rounded-full font-semibold flex items-center gap-2 transition-colors text-sm"
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
          </div>
        )}

        {settingsTab === 'data' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200 col-span-1 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                <Archive className="text-[#003828]" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900">Universal Data Management</h2>
                <p className="text-stone-500 text-sm mt-1">Export or import data across the entire platform.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Data Section</label>
                <select id="data-section-select" className="w-full px-4 py-2.5 rounded-full border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#003828] font-medium text-stone-800 bg-white">
                  <option value="entire">Entire System Data (All Sections)</option>
                  <option value="espa_users">All Members</option>
                  <option value="role_General Member">General Committee</option>
                  <option value="role_Volunteer">Volunteers</option>
                  <option value="role_Ambassador">Ambassadors</option>
                  <option value="role_Partner">Partners</option>
                  <option value="role_Donor">Donors</option>
                  <option value="espa_funds">Funds Data</option>
                </select>
              </div>
              <div className="flex items-end gap-3">
                <button 
                  onClick={() => {
                    const section = document.getElementById('data-section-select').value;
                    
                    if (section === 'entire') {
                        // Export all as JSON
                        const allData = {};
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key.startsWith('espa_') || key.startsWith('ain_') || key === 'library_books') {
                                try {
                                    allData[key] = JSON.parse(localStorage.getItem(key));
                                } catch(e) {
                                    allData[key] = localStorage.getItem(key);
                                }
                            }
                        }
                        const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
                        const link = document.createElement("a");
                        link.setAttribute("href", jsonContent);
                        link.setAttribute("download", `espa_full_backup.json`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        addLog(`Exported Entire System Data to JSON`);
                        showToast('Export successful', 'success');
                        return;
                    }

                    let parsedData = [];
                    if (section.startsWith('role_')) {
                        const role = section.split('_')[1];
                        const allUsers = JSON.parse(localStorage.getItem('espa_users') || localStorage.getItem('ain_users') || '[]');
                        parsedData = allUsers.filter(u => u.role === role);
                    } else {
                        const data = localStorage.getItem(section) || (section === 'espa_users' ? localStorage.getItem('ain_users') : (section === 'espa_funds' ? localStorage.getItem('ain_funds') : null));
                        if (!data) {
                            showToast('No data found for this section', 'error');
                            return;
                        }
                        parsedData = JSON.parse(data);
                    }
                    
                    // Convert to CSV
                    if (!Array.isArray(parsedData) || parsedData.length === 0) {
                        showToast('Data is not in a valid format for export', 'error');
                        return;
                    }
                    
                    const headers = Object.keys(parsedData[0]);
                    const csvContent = "data:text/csv;charset=utf-8," 
                        + headers.join(",") + "\n" 
                        + parsedData.map(row => {
                            return headers.map(header => {
                                let val = row[header];
                                if (val === null || val === undefined) return '""';
                                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                                return `"${String(val).replace(/"/g, '""')}"`;
                            }).join(",");
                        }).join("\n");
                        
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `${section}_export.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    addLog(`Exported ${section} to CSV`);
                    showToast('Export successful', 'success');
                  }}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-semibold transition-colors flex items-center justify-center gap-2 flex-1"
                >
                  <Archive size={18} /> Export
                </button>
                
                <label className="px-6 py-2.5 bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] text-white rounded-full font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1">
                  <Upload size={18} /> Import
                  <input type="file" className="hidden" accept=".csv,.json" onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      
                      const section = document.getElementById('data-section-select').value;
                      
                      const reader = new FileReader();
                      reader.onload = (event) => {
                          try {
                              if (file.name.endsWith('.json')) {
                                  if (section !== 'entire') {
                                      showToast('Please select "Entire System Data" to import JSON backups', 'error');
                                      return;
                                  }
                                  const parsed = JSON.parse(event.target.result);
                                  for (const key in parsed) {
                                      localStorage.setItem(key, JSON.stringify(parsed[key]));
                                  }
                                  showToast('System data restored successfully', 'success');
                                  addLog(`Restored Entire System Data from JSON backup`);
                                  setTimeout(() => window.location.reload(), 1500);
                                  return;
                              }

                              const text = event.target.result;
                              const rows = text.split('\n').filter(row => row.trim().length > 0);
                              if (rows.length < 2) {
                                  showToast('Invalid CSV file', 'error');
                                  return;
                              }
                              
                              const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                              
                              // Strict structure checking based on target section
                              let expectedHeaders = [];
                              const isRole = section.startsWith('role_');
                              if (section === 'espa_users' || section === 'ain_users' || isRole) {
                                  expectedHeaders = ['id', 'name', 'username', 'email', 'role'];
                              } else if (section === 'espa_funds' || section === 'ain_funds') {
                                  expectedHeaders = ['pkr', 'usd', 'transactions'];
                              }
                              
                              const isValid = expectedHeaders.every(h => headers.includes(h));
                              if (!isValid && section !== 'espa_funds' && section !== 'ain_funds') {
                                  showToast('Invalid file structure for the selected section', 'error');
                                  return;
                              }

                              const data = rows.slice(1).map(row => {
                                  // Simple CSV parser that respects quotes
                                  const values = [];
                                  let inQuote = false;
                                  let currentVal = '';
                                  for (let i = 0; i < row.length; i++) {
                                      if (row[i] === '"') {
                                          inQuote = !inQuote;
                                      } else if (row[i] === ',' && !inQuote) {
                                          values.push(currentVal);
                                          currentVal = '';
                                      } else {
                                          currentVal += row[i];
                                      }
                                  }
                                  values.push(currentVal);
                                  
                                  const obj = {};
                                  headers.forEach((header, i) => {
                                      let val = values[i] ? values[i].trim() : '';
                                      if (val.startsWith('"') && val.endsWith('"')) {
                                          val = val.substring(1, val.length - 1).replace(/""/g, '"');
                                      }
                                      try {
                                          obj[header] = JSON.parse(val);
                                      } catch(e) {
                                          obj[header] = val;
                                      }
                                  });
                                  return obj;
                              });
                              
                              if (isRole) {
                                  const role = section.split('_')[1];
                                  const existingUsers = JSON.parse(localStorage.getItem('espa_users') || localStorage.getItem('ain_users') || '[]');
                                  const otherUsers = existingUsers.filter(u => u.role !== role);
                                  const newUsersList = [...otherUsers, ...data];
                                  localStorage.setItem('espa_users', JSON.stringify(newUsersList));
                                  localStorage.removeItem('ain_users');
                                  setUsers(newUsersList);
                                  showToast(`${role} data imported successfully`, 'success');
                                  addLog(`Imported ${data.length} records into ${role}`);
                              } else {
                                  localStorage.setItem(section, JSON.stringify(data));
                                  showToast('Data imported successfully', 'success');
                                  addLog(`Imported ${data.length} records into ${section}`);
                                  if (section === 'espa_users' || section === 'ain_users') {
                                      setUsers(data);
                                      localStorage.setItem('espa_users', JSON.stringify(data));
                                  }
                              }
                          } catch (err) {
                              showToast('Error parsing file', 'error');
                              console.error(err);
                          }
                      };
                      reader.readAsText(file);
                  }} />
                </label>
              </div>
            </div>
          </div>
          </div>
        )}

        {settingsTab === 'funds' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 col-span-1 lg:col-span-2">
            <h2 className="text-lg font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-2">
                <Wallet size={20} className="text-[#003828]" /> Funds Management
            </h2>
            <p className="text-stone-500 text-sm mb-6">Manage recent transactions and remove accidental entries.</p>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {funds?.transactions?.length > 0 ? (
                    <div className="space-y-3">
                        {[...funds.transactions].reverse().map(tx => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-stone-100 bg-stone-50 hover:bg-stone-100/50 transition-colors">
                                <div>
                                    <p className="font-semibold text-sm text-stone-800">{tx.description}</p>
                                    <p className="text-xs text-stone-500 mt-1">{new Date(tx.date || tx.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-bold ${tx.type === 'donation' ? 'text-[#003828]' : 'text-red-600'}`}>
                                        {tx.type === 'donation' ? '+' : '-'}{tx.currency === 'USD' ? '$' : 'Rs'} {(tx.amount || 0).toLocaleString()}
                                    </span>
                                    <button 
                                        onClick={() => {
                                            // Removed window.confirm due to iframe limitations
                                            const updatedTransactions = funds.transactions.filter(t => t.id !== tx.id);
                                            const typeMult = tx.type === 'donation' ? -1 : 1;
                                            
                                            // Handle both old dummy format (amount/currency) and new format (amountPKR/amountUSD)
                                            let pkrDiff = 0;
                                            let usdDiff = 0;
                                            
                                            if (tx.amountPKR !== undefined || tx.amountUSD !== undefined) {
                                                pkrDiff = (tx.amountPKR || 0) * typeMult;
                                                usdDiff = (tx.amountUSD || 0) * typeMult;
                                            } else {
                                                if (tx.currency === 'PKR') pkrDiff = (tx.amount || 0) * typeMult;
                                                if (tx.currency === 'USD') usdDiff = (tx.amount || 0) * typeMult;
                                            }
                                            
                                            const newFunds = {
                                                ...funds,
                                                pkr: funds.pkr + pkrDiff,
                                                usd: funds.usd + usdDiff,
                                                transactions: updatedTransactions
                                            };
                                            setFunds(newFunds);
                                            addLog(`Removed fund transaction: ${tx.id}`);
                                            showToast("Transaction removed successfully", "success");
                                        }}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                        title="Remove Transaction"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-stone-500 italic">No recent transactions found.</p>
                )}
            </div>
          </div>
          </div>
        )}

        {settingsTab === 'system' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div onClick={() => (onNavigate || setActiveTab)('activity')} className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 flex flex-col hover:border-[#003828] hover:shadow-md transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#003828]/10 transition-colors">
                  <Activity size={24} className="text-stone-600 group-hover:text-[#003828] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">Activity Log</h3>
                <p className="text-sm text-stone-500 font-medium">View a detailed system-wide audit trail of all actions performed by users.</p>
              </div>
              <div onClick={() => (onNavigate || setActiveTab)('archives')} className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-8 flex flex-col hover:border-[#003828] hover:shadow-md transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#003828]/10 transition-colors">
                  <Archive size={24} className="text-stone-600 group-hover:text-[#003828] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">System Archives</h3>
                <p className="text-sm text-stone-500 font-medium">Access and restore previously deleted or archived system records.</p>
              </div>
              {(currentUser?.isMasterAdmin === true || currentUser?.id === 'A00' || (currentUser?.role && currentUser.role.toLowerCase() === 'master admin') || (currentUser?.username && currentUser.username.toLowerCase() === 'developer')) && (
                <button type="button" onClick={() => setConfirm({ title: 'Reset Activity Log', message: 'This will permanently clear the activity log. Only the Master Admin can do this. Continue?', confirmText: 'Reset Log', type: 'danger', action: () => { setLogs([]); addLog('Master Admin reset the activity log'); showToast('Activity log reset.', 'success'); } })} className="text-left bg-white rounded-3xl border border-rose-200 shadow-sm p-8 flex flex-col hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-6"><Trash2 size={24} className="text-rose-600" /></div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">Reset Activity Log</h3>
                  <p className="text-sm text-stone-500 font-medium">Permanently clear the audit trail. Restricted to the Master Admin.</p>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(confirm)}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmText={confirm?.confirmText || 'Confirm'}
        type={confirm?.type || 'danger'}
        onClose={() => setConfirm(null)}
        onConfirm={() => { const action = confirm?.action; setConfirm(null); if (action) action(); }}
      />
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
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 font-semibold rounded-full hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (verificationCode.length !== 6) {
                      setVerificationError('Please enter a valid 6-digit code');
                      return;
                    }
                    try {
                      const response = await fetch('/api/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: currentUser.email, otp: verificationCode })
                      });
                      const data = await response.json();
                      if (!response.ok || data?.valid !== true) {
                        setVerificationError(data?.error || 'Invalid Code. Please try again.');
                        return;
                      }
                      setTwoFactorConfig({...twoFactorConfig, emailEnabled: true, enabled: true, requireForLogin: true});
                      if (currentUser) currentUser.twoFactorEnabled = true;
                      if (setUsers && globalUsers) {
                        setUsers(globalUsers.map(u => u.id === currentUser?.id ? { ...u, twoFactorEnabled: true } : u));
                      }
                      setIsEmailModalOpen(false);
                      setVerificationCode('');
                      setVerificationError('');
                      showToast('Two-Factor Authentication is active. Your account is secured.', 'success');
                      addLog(`Email 2FA enabled for ${currentUser.name}`);
                    } catch (err) {
                      setVerificationError(err.message || 'Verification failed.');
                    }
                  }}
                  className="flex-1 px-4 py-3 font-semibold rounded-full transition-colors bg-[#003828] text-white border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828]"
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
                  <QRCodeSVG value={`otpauth://totp/ESPA%20Foundation:${encodeURIComponent(currentUser?.email || currentUser?.username || '')}?secret=${twoFactorConfig?.authSecret || ''}&issuer=ESPA%20Foundation`} size={160} />
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
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 font-semibold rounded-full hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (verificationCode.length === 6) {
                      const secret = twoFactorConfig?.authSecret || randomBase32Secret();
                      const isValid = await verifyTOTP(verificationCode, secret);
                      if (isValid) {
                        setTwoFactorConfig({...twoFactorConfig, authEnabled: true, authSecret: secret, enabled: true, requireForLogin: true});
                        if (currentUser) currentUser.twoFactorEnabled = true;
                        if (setUsers && globalUsers) {
                          setUsers(globalUsers.map(u => u.id === currentUser?.id ? { ...u, twoFactorEnabled: true } : u));
                        }
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
                  className="flex-1 px-4 py-3 font-semibold rounded-full transition-colors bg-[#003828] text-white border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828]"
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
