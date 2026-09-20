import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit, Download, Upload, User, Users, Shield, MapPin, X, AlertCircle, Eye, EyeOff, FileText } from 'lucide-react';
import { ActionMenu, ConfirmModal, DataModal } from '../components/SharedComponents';
import DraggableModal from '../components/DraggableModal';
import { createPortal } from 'react-dom';
import { countries } from '../countries';
import { countryCodes } from '../countryCodes';

export default function UsersView({
  users, setUsers, globalUsers, batches, roles, hosts, currentUser, 
  archivedUsers, setArchivedUsers, addLog, showToast, onUserClick, setActiveTab
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newUser, setNewUser] = useState<any>({});
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const canViewUser = (targetUser) => {
    if (targetUser.role === 'Admin') return false; 
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    
    const getLvl = (r) => {
        if (r === 'Admin') return 4;
        if (r === 'In-Country Coordinator') return 3;
        if (r === 'Deputy Lead Coordinator') return 2;
        if (r === 'Intern' || r === 'Camper') return 1;
        return 0;
    };
    
    const cLvl = getLvl(currentUser.role);
    const tLvl = getLvl(targetUser.role);
    
    return tLvl <= cLvl;
  };


  const handleMassArchive = () => {
    if (selectedIds.length === 0) return;
    const usersToArchive = (users || []).filter(u => selectedIds.includes(u.id)).map(u => ({ ...u, archivedAt: new Date().toISOString() }));
    setArchivedUsers([...archivedUsers, ...usersToArchive]);
    setUsers(globalUsers.filter(u => !selectedIds.includes(u.id)));
    addLog(`Archived ${selectedIds.length} users`);
    showToast(`Archived ${selectedIds.length} users successfully`, 'success');
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds((filteredUsers || []).map(u => u.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  
  const roleOrder = useMemo(() => ({
    'In-Country Coordinator': 1,
    'Deputy Lead Coordinator': 2,
    'Intern': 3,
    'Camper': 4
  }), []);

  const filteredUsers = useMemo(() => {
    return (users || []).filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.batch?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      const orderA = roleOrder[a.role] || 99;
      const orderB = roleOrder[b.role] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, searchTerm, roleOrder]);

  const handleDeleteUser = (id) => {
    const userToArchive = users?.find(u => u.id === id);
    if (!userToArchive) return;
    setArchivedUsers([...archivedUsers, { ...userToArchive, archivedAt: new Date().toISOString() }]);
    setUsers(globalUsers.filter(u => u.id !== id));
    addLog(`Archived user ${userToArchive.name}`);
    showToast('User archived successfully', 'success');
  };

  const generateUsername = (form) => {
    if (!form.firstName && !form.lastName) return '';
    const f = (form.firstName || '').toLowerCase().replace(/\s+/g, '.');
    const l = (form.lastName || '').toLowerCase().replace(/\s+/g, '.');
    let base = `${f}${f && l ? '.' : ''}${l}`;
    return base;
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.hostId || !newUser.role) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    if (isEditingUser) {
      setUsers((globalUsers || []).map(u => u.id === newUser.id ? { ...newUser, name: `${newUser.firstName} ${newUser.lastName}` } : u));
      addLog(`Updated user ${newUser.firstName} ${newUser.lastName}`);
      showToast('User updated successfully', 'success');
    } else {
      if (globalUsers.some(u => u.username === newUser.username)) {
        return showToast('Username/ID is already in use', 'error');
      }
      const uId = newUser.username || `usr${Date.now()}`;
      const finalUser = {
        ...newUser,
        id: uId,
        name: `${newUser.firstName} ${newUser.lastName}`,
        username: newUser.username,
        active: true,
        dateAdded: new Date().toISOString()
      };
      setUsers([...globalUsers, finalUser]);
      addLog(`Added new user ${finalUser.name}`);
      showToast('User added successfully', 'success');
    }
    setIsModalOpen(false);
    setNewUser({});
    setIsEditingUser(false);
  };

  return (
    <div className="space-y-8 tracking-tight">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Users</h1>
          <p className="text-stone-500 text-sm mt-2 font-medium">Manage Participant Profiles, Account Details, and Batch Classifications.</p>
        </div>
        {selectedIds.length > 0 ? (
          <button 
            onClick={handleMassArchive}
            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm"
          >
            <Trash2 size={16} /> Archive Selected ({selectedIds.length})
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('batches')}
              className="bg-white text-stone-700 border border-stone-200/80 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <Users size={16} className="text-[#003828]" /> Batch
            </button>
            <button 
              onClick={() => { setNewUser({}); setIsEditingUser(false); setIsModalOpen(true); }}
              className="bg-[#003828] text-[#FDFCFB] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#00261B] transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={16} className="text-[#FDFCFB]" /> Add User
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003828]" size={18} strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm shadow-sm"
        />
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden">
        <div className="w-full overflow-x-auto pb-16">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs tracking-wider bg-stone-50/50 rounded-t-2xl">
                <th className="pl-12 pr-6 py-5 font-medium uppercase w-[30%]">Name</th>
                <th className="px-6 py-5 font-medium uppercase w-[50%]">Role</th>
                                                <th className="px-6 py-5 font-medium uppercase text-center w-[20%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(filteredUsers || []).map(user => {
                const host = hosts?.find(h => h.id === user.hostId);
                return (
                  <tr key={user.id} className="hover:bg-[#FDFCFB] transition-colors">
                    <td className="pl-12 pr-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div>
                          {canViewUser(user) ? (
                            <div className="text-stone-900 font-medium text-sm cursor-pointer hover:text-[#003828] focus:outline-none" onClick={() => onUserClick(user)}>{user.name}</div>
                          ) : (
                            <div className="text-stone-900 font-medium text-sm">{user.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle text-sm text-stone-900 font-medium">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 align-middle text-center">
                      <ActionMenu id={user.id} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}>
                        <button onClick={() => {
                          setActiveDropdown(null);
                          setNewUser({
                            ...user, 
                            firstName: user.name?.split(' ')[0] || '',
                            lastName: user.name?.split(' ').slice(1).join(' ') || ''
                          });
                          setIsEditingUser(true);
                          setIsModalOpen(true);
                        }} className="w-full text-left px-4 py-2.5 text-sm text-stone-900 hover:bg-stone-50 font-medium flex items-center gap-2">
                          <Edit size={16} className="text-[#003828]" /> Edit User
                        </button>
                        <button onClick={() => { setActiveDropdown(null); handleDeleteUser(user.id); }} className="w-full text-left px-4 py-2.5 text-sm text-stone-900 hover:bg-stone-50 font-medium flex items-center gap-2">
                          <Trash2 size={16} className="text-red-500" /> Archive User
                        </button>
                      </ActionMenu>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={3} className="py-20 text-center text-sm text-stone-500">No Data Available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)} />
          <DraggableModal className="bg-white rounded-3xl p-8 max-w-2xl max-h-[90vh] w-full shadow-2xl flex flex-col animate-in zoom-in-95 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-3 drag-handle cursor-grab shrink-0">
              <User className="text-[#003828] pointer-events-none" size={24} /> 
              <span className="pointer-events-none font-medium">{isEditingUser ? "Edit User" : "Add User"}</span>
            </h3>
            
            <form onSubmit={handleAddUser} className="flex-1 min-h-0 overflow-y-auto space-y-4 p-1 -mx-1 px-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">BATCH<span className="text-red-500 font-medium">*</span></label>
                  <select value={newUser.batch || ''} onChange={e => setNewUser({...newUser, batch: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-medium text-stone-800 appearance-none">
                    <option value="">Select Batch</option>
                    {batches.filter(b => b.active).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">ROLE<span className="text-red-500 font-medium">*</span></label>
                  <select required value={newUser.role || ''} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-medium text-stone-800 appearance-none">
                    <option value="" disabled>Select Role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">FIRST NAME<span className="text-red-500 font-medium">*</span></label>
                  <input required type="text" placeholder="Enter First Name" value={newUser.firstName || ''} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-normal text-stone-800" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">LAST NAME<span className="text-red-500 font-medium">*</span></label>
                  <input required type="text" placeholder="Enter Last Name" value={newUser.lastName || ''} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-normal text-stone-800" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Username/ID<span className="text-red-500 font-medium">*</span></label>
                  <input required type="text" placeholder="Enter Username/ID" value={newUser.username || ''} onChange={e => setNewUser({...newUser, username: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-normal text-stone-800" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">EMAIL<span className="text-red-500 font-medium">*</span></label>
                  <input required type="email" placeholder="Enter Email" value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-medium text-stone-800" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 relative">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">PASSWORD<span className="text-red-500 font-medium">*</span></label>
                  <div className="relative">
                    <input required={!isEditingUser} type={showPassword ? 'text' : 'password'} placeholder={isEditingUser ? "Leave blank to keep unchanged" : "Enter Password"} value={newUser.password || ''} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-medium text-stone-800 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="col-span-1 relative">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">CONFIRM PASSWORD<span className="text-red-500 font-medium">*</span></label>
                  <div className="relative">
                    <input required={!isEditingUser && newUser.password} type={showConfirmPassword ? 'text' : 'password'} placeholder={isEditingUser ? "Leave blank to keep unchanged" : "Confirm Password"} value={newUser.confirmPassword || ''} onChange={e => setNewUser({...newUser, confirmPassword: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-medium text-stone-800 pr-10" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">HOME COUNTRY<span className="text-red-500 font-medium">*</span></label>
                  <select required value={newUser.nativeCountry || ''} onChange={e => setNewUser({...newUser, nativeCountry: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-medium text-stone-800 appearance-none">
                    <option value="" disabled>Select Home Country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">HOST COUNTRY<span className="text-red-500 font-medium">*</span></label>
                  <select required value={newUser.hostId || ''} onChange={e => {
                    const host = hosts?.find(h => h.id === e.target.value);
                    setNewUser({...newUser, hostId: e.target.value, hostCountry: host ? host.country : ''});
                  }} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-medium text-stone-800 appearance-none">
                    <option value="" disabled>Select Host Country</option>
                    {hosts.map(h => <option key={h.id} value={h.id}>{h.country} - {h.category}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">HOME NUMBER</label>
                  <div className="flex bg-white border border-stone-200 rounded-xl focus-within:ring-1 focus-within:ring-[#003828] focus-within:border-[#003828]">
                    <span className="px-4 py-2.5 bg-stone-50 border-r border-stone-200 text-stone-500 text-sm font-normal rounded-l-xl">
                      {countryCodes[newUser.nativeCountry] || '+'}
                    </span>
                    <input type="tel" placeholder="Enter Home Number" maxLength={15} value={newUser.contact || ''} onChange={e => setNewUser({...newUser, contact: e.target.value.replace(/\D/g, '')})} className="flex-1 w-full px-4 py-2.5 bg-transparent outline-none text-sm font-normal text-stone-800 placeholder:font-normal placeholder:text-stone-400 rounded-r-xl" />
                  </div>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">HOST NUMBER</label>
                  <div className="flex bg-white border border-stone-200 rounded-xl focus-within:ring-1 focus-within:ring-[#003828] focus-within:border-[#003828]">
                    <span className="px-4 py-2.5 bg-stone-50 border-r border-stone-200 text-stone-500 text-sm font-normal rounded-l-xl">
                      {newUser.hostCountry && countryCodes[newUser.hostCountry] ? countryCodes[newUser.hostCountry] : '+'}
                    </span>
                    <input type="tel" placeholder="Enter Host Number" maxLength={15} value={newUser.hostNumber || ''} onChange={e => setNewUser({...newUser, hostNumber: e.target.value.replace(/\D/g, '')})} className="flex-1 w-full px-4 py-2.5 bg-transparent outline-none text-sm font-normal text-stone-800 placeholder:font-normal placeholder:text-stone-400 rounded-r-xl" />
                  </div>
                </div>
              </div>

              {!['In-Country Coordinator', 'Deputy Lead Coordinator', 'Lead Coordinator', 'Admin'].includes(newUser.role) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">HOST INSTITUTION</label>
                    <input type="text" placeholder="Enter Host Institution" value={newUser.institution || ''} onChange={e => setNewUser({...newUser, institution: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-normal text-stone-800" />
                  </div>
                  {newUser.role !== 'Camper' && (
                    <div className="col-span-1">
                      <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">DEPARTMENT</label>
                      <input type="text" placeholder="Enter Department" value={newUser.department || ''} onChange={e => setNewUser({...newUser, department: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-normal text-stone-800" />
                    </div>
                  )}
                  {newUser.role !== 'Camper' && (
                    <div className="col-span-1">
                      <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">POSITION</label>
                      <input type="text" placeholder="Enter Position" value={newUser.position || ''} onChange={e => setNewUser({...newUser, position: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-normal text-stone-800" />
                    </div>
                  )}
                  <div className="col-span-1">
                    <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">{newUser.role === 'Camper' ? 'COORDINATOR' : 'SUPERVISOR'}</label>
                    <input type="text" placeholder={`Enter ${newUser.role === 'Camper' ? 'Coordinator' : 'Supervisor'}`} value={newUser.supervisor || ''} onChange={e => setNewUser({...newUser, supervisor: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-normal text-stone-800" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">MEDICAL DOCUMENT<span className="text-red-500 font-medium">*</span></label>
                  <div className="flex items-center gap-4">
                    {newUser.medicalDocument ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-[#003828]/5 border border-[#003828]/20 rounded-xl text-[#003828] text-sm font-medium">
                        <FileText size={16} />
                        <span className="truncate max-w-[200px]">Medical Document Uploaded</span>
                        <button type="button" onClick={() => setNewUser({...newUser, medicalDocument: ''})} className="ml-2 text-stone-400 hover:text-red-500 focus:outline-none">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors w-full sm:w-auto">
                        <Upload size={16} className="text-stone-400" />
                        <span className="text-sm font-medium text-stone-700">Upload Medical Docs</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setNewUser({...newUser, medicalDocument: reader.result});
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">LEGAL DOCUMENT<span className="text-red-500 font-medium">*</span></label>
                  <div className="flex items-center gap-4">
                    {newUser.legalDocument ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-[#003828]/5 border border-[#003828]/20 rounded-xl text-[#003828] text-sm font-medium">
                        <FileText size={16} />
                        <span className="truncate max-w-[200px]">Document Uploaded</span>
                        <button type="button" onClick={() => setNewUser({...newUser, legalDocument: ''})} className="ml-2 text-stone-400 hover:text-red-500 focus:outline-none">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors w-full sm:w-auto">
                        <Upload size={16} className="text-stone-400" />
                        <span className="text-sm font-medium text-stone-700">Upload Document</span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setNewUser({...newUser, legalDocument: reader.result});
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">IMAGE (1:1 RATIO)<span className="text-red-500 font-medium">*</span></label>
                <div className="flex items-center gap-4">
                  {newUser.photo ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                      <img src={newUser.photo} alt="Profile" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setNewUser({...newUser, photo: ''})} className="absolute top-1 right-1 bg-stone-900/50 text-white p-1 rounded hover:bg-stone-900 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-[#003828] hover:bg-[#003828]/5 transition-colors shrink-0">
                      <Upload size={18} className="text-stone-400" />
                      <span className="text-[10px] font-medium text-stone-500 text-center px-1">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewUser({...newUser, photo: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  )}
                  <p className="text-xs text-stone-500">Upload a 1:1 square profile picture. Images will be cropped to fit.</p>
                </div>
              </div>


              <div className="col-span-1">
                <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">ALLERGIES</label>
                <textarea rows={3} placeholder="List any known allergies..." value={newUser.allergies || ''} onChange={e => setNewUser({...newUser, allergies: e.target.value})} className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] outline-none text-sm font-normal text-stone-800 resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-white bg-[#003828] hover:bg-[#00261B] transition-colors">{isEditingUser ? 'Save Changes' : 'Add User'}</button>
              </div>
            </form>
          </DraggableModal>
        </div>,
        document.body
      )}
    </div>
  );
}
