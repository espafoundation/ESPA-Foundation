import React, { useState, useEffect } from 'react';
import { Download, Plus, Search, FileText, Calendar, Mail, Phone, Eye, History, X, Shield, ChevronDown } from 'lucide-react';
import DraggableModal from './DraggableModal';
import MemberDetailsModal from './MemberDetailsModal';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => createPortal(children, document.body);

export default function MemberListView({ title, description, icon: Icon, members = [], onUpdateRole }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const draftKey = `ain_draft_${title.toLowerCase()}`;
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '' });
  
  useEffect(() => {
    if (isAddModalOpen) {
      const savedDraft = window.localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          setNewMember(JSON.parse(savedDraft));
        } catch (e) {}
      }
    }
  }, [isAddModalOpen, draftKey]);

  

  
  const isDirty = Object.values(newMember).some(v => typeof v === 'string' && v.trim() !== '') || (newMember.role && newMember.role !== '');
  
  useEffect(() => {
    window.ain_isFormDirty = isAddModalOpen && isDirty;
    return () => { window.ain_isFormDirty = false; };
  }, [isAddModalOpen, isDirty]);

  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const confirmDiscard = () => {
    window.localStorage.removeItem(draftKey);
    setNewMember({ name: '', email: '', phone: '' });
    window.ain_isFormDirty = false;
    setIsAddModalOpen(false);
    setShowDiscardModal(false);
  };

  const handleBackClick = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      setIsAddModalOpen(false);
    }
  };

  const handleSaveDraft = () => {
    window.localStorage.setItem(draftKey, JSON.stringify(newMember));
    // Optional: could show toast if we had access to it, but we can just let it auto-save
    alert("Draft saved successfully!");
  };


  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;
    
    // We would need to pass setUsers here, or just mock it or notify parent.
    window.localStorage.removeItem(draftKey);
    setIsAddModalOpen(false);
    setNewMember({ role: title.endsWith('s') ? title.slice(0, -1) : title });
  };

  const availableRoles = ['Admin', 'President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Treasurer', 'Executive Member', 'General Member', 'Volunteer', 'Ambassador', 'Partner'];

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) return;
    const headers = ['Name', 'Email', 'Role', 'Join Date', 'Phone'];
    const csvContent = [
      headers.join(','),
      ...(filteredMembers || []).map(m => `"${m.name}","${m.email}","${m.role}","${m.joinDate || ''}","${m.phone || ''}"`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (isAddModalOpen) {
    return (
      <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-semibold text-black">Add</h1>
            <p className="text-stone-500 text-base mt-2 font-medium">Fill in the details below to add a new record.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleBackClick} className="px-4 py-2 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-full font-semibold text-sm transition-colors shadow-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
          <div className="flex-1 overflow-auto p-6 md:p-8">
            
              <form onSubmit={handleAddMemberSubmit} className="space-y-4 max-w-3xl mx-auto pb-12">
                {/* Basic Fields - Common */}
                <div>
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">{title === 'Partners' ? 'Organization Name' : 'Full Name'}<span className="text-red-500 font-medium">*</span></label>
                  <input required type="text" value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder={title === 'Partners' ? 'Organization Name' : 'John Doe'} />
                </div>
                <div>
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Email<span className="text-red-500 font-medium">*</span></label>
                  <input required type="email" value={newMember.email || ''} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Phone / WhatsApp</label>
                  <input type="text" value={newMember.phone || ''} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="+1 234 567 890" />
                </div>
                <div>
                  <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">City / Country</label>
                  <input type="text" value={newMember.location || ''} onChange={e => setNewMember({...newMember, location: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="City, Country" />
                </div>

                {/* Role Specific Fields */}
                {title === 'Volunteers' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Age</label>
                        <input type="number" value={newMember.age || ''} onChange={e => setNewMember({...newMember, age: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" />
                        </div>
                        <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Gender</label>
                        <select value={newMember.gender || ''} onChange={e => setNewMember({...newMember, gender: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800 bg-white">
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Areas of Interest</label>
                        <input type="text" value={newMember.interests || ''} onChange={e => setNewMember({...newMember, interests: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="Education, Fundraising, etc." />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Skills</label>
                        <input type="text" value={newMember.skills || ''} onChange={e => setNewMember({...newMember, skills: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="e.g. Graphic Design, Public Speaking" />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Availability</label>
                        <input type="text" value={newMember.availability || ''} onChange={e => setNewMember({...newMember, availability: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="Days / Hours" />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Preferred Work Type</label>
                        <select value={newMember.workType || ''} onChange={e => setNewMember({...newMember, workType: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800 bg-white">
                            <option value="">Select...</option>
                            <option value="Online">Online</option>
                            <option value="In-person">In-person</option>
                            <option value="Both">Both</option>
                        </select>
                    </div>
                  </>
                )}

                {title === 'Ambassadors' && (
                  <>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Institution / Organization</label>
                        <input type="text" value={newMember.institution || ''} onChange={e => setNewMember({...newMember, institution: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="University, Company etc." />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Position / Profession</label>
                        <input type="text" value={newMember.profession || ''} onChange={e => setNewMember({...newMember, profession: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="Student, Manager etc." />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Social Media Handles</label>
                        <input type="text" value={newMember.socialMedia || ''} onChange={e => setNewMember({...newMember, socialMedia: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="@username" />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Areas of Influence</label>
                        <input type="text" value={newMember.influenceArea || ''} onChange={e => setNewMember({...newMember, influenceArea: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="Education, Youth, Media" />
                    </div>
                  </>
                )}

                {title === 'Partners' && (
                  <>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Organization Type</label>
                        <input type="text" value={newMember.orgType || ''} onChange={e => setNewMember({...newMember, orgType: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="NGO, School, Company etc." />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Website</label>
                        <input type="url" value={newMember.website || ''} onChange={e => setNewMember({...newMember, website: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="https://" />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Partnership Type</label>
                        <input type="text" value={newMember.partnershipType || ''} onChange={e => setNewMember({...newMember, partnershipType: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="Educational, Corporate etc." />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Status</label>
                        <select value={newMember.status || 'Prospect'} onChange={e => setNewMember({...newMember, status: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800 bg-white">
                            <option value="Prospect">Prospect</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                  </>
                )}

                {title === 'Donors' && (
                  <>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Donor Type</label>
                        <select value={newMember.donorType || 'Individual'} onChange={e => setNewMember({...newMember, donorType: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800 bg-white">
                            <option value="Individual">Individual</option>
                            <option value="Organization">Organization</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Preferred Cause</label>
                        <input type="text" value={newMember.preferredCause || ''} onChange={e => setNewMember({...newMember, preferredCause: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800" placeholder="Scholarships, General Fund etc." />
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Donation Frequency</label>
                        <select value={newMember.frequency || 'One-time'} onChange={e => setNewMember({...newMember, frequency: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800 bg-white">
                            <option value="One-time">One-time</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annual">Annual</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-normal text-stone-500 mb-1 uppercase tracking-wider">Recognition Preference</label>
                        <select value={newMember.recognition || 'Public'} onChange={e => setNewMember({...newMember, recognition: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#004B36] outline-none text-sm font-medium text-stone-800 bg-white">
                            <option value="Public">Public</option>
                            <option value="Private">Private</option>
                            <option value="Anonymous">Anonymous</option>
                        </select>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
                  <button type="button" onClick={handleSaveDraft} className="px-5 py-2 rounded-full text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">Save Draft</button>
                  <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#004B36] hover:bg-[#003828] transition-colors">Add</button>
                </div>
              </form>

          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-black">{title}</h1>
          <p className="text-stone-500 text-base mt-2 font-medium">{description}</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-2.5 bg-[#004B36] text-white rounded-full text-sm font-medium tracking-wide hover:bg-[#003828] transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Add
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
        <input 
          type="text" 
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="flex-1 overflow-auto">
          {filteredMembers.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50/50 sticky top-0 z-10 border-b border-stone-200 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap hidden md:table-cell">Email</th>
                  <th className="px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap">Join Date</th>
                  <th className="px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(filteredMembers || []).map((member, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900 text-sm">{member.name}</div>
                      <div className="text-xs text-stone-500 md:hidden">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 text-stone-600 text-sm hidden md:table-cell">{member.email}</td>
                    <td className="px-6 py-4 text-stone-600 text-sm">{member.joinDate || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setMemberToChangeRole(member)}
                          className="p-2 text-stone-400 hover:text-[#004B36] hover:bg-[#004B36]/10 rounded-full transition-colors"
                          title="Change Role"
                        >
                          <Shield size={18} />
                        </button>
                        <button 
                          onClick={() => setSelectedMember(member)}
                          className="p-2 text-stone-400 hover:text-[#004B36] hover:bg-[#004B36]/10 rounded-full transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">
              <h3 className="text-xl font-bold text-stone-900 mb-2">No {title} Found</h3>
              <p className="text-stone-500 font-medium">There are currently no items to display in this section.</p>
            </div>
          )}
        </div>
      </div>

      {selectedMember && <MemberDetailsModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
      {memberToChangeRole && (
        <Portal>
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" onClick={() => setMemberToChangeRole(null)} />
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
            <DraggableModal className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Shield className="text-[#004B36]" size={24} /> Change Role
                </h3>
                <button onClick={() => setMemberToChangeRole(null)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-stone-500 mb-6 font-medium">Select a new role for <span className="font-bold text-stone-800">{memberToChangeRole.name}</span>.</p>
              
              <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar pb-2 pr-2">
                {availableRoles.map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      if (onUpdateRole) onUpdateRole(memberToChangeRole.id, role);
                      setMemberToChangeRole(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-full border transition-colors ${memberToChangeRole.role === role ? 'bg-[#004B36]/5 border-[#004B36]/20' : 'bg-white border-stone-100 hover:bg-stone-50 hover:border-stone-200'}`}
                  >
                    <span className={`font-semibold text-sm ${memberToChangeRole.role === role ? 'text-[#004B36]' : 'text-stone-700'}`}>{role}</span>
                    {memberToChangeRole.role === role && <span className="text-[10px] uppercase font-bold tracking-wider text-[#004B36]/60 bg-[#004B36]/10 px-2 py-0.5 rounded-full">Current</span>}
                  </button>
                ))}
              </div>
            </DraggableModal>
          </div>
        </Portal>
      )}

      

    </div>
  );
}
