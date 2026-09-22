import React from 'react';
import { Mail, Phone, Calendar, Briefcase, History, X, MapPin, Building, Globe, ExternalLink, Award } from 'lucide-react';
import DraggableModal from './DraggableModal';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => createPortal(children, document.body);

export default function MemberDetailsModal({ member, onClose }) {
  if (!member) return null;

  const displayOrg = member.organization || member.company || member.institution;
  const displayLocation = member.location || [member.city, member.country].filter(Boolean).join(', ');
  const displayWeb = member.website || member.social || member.socialMedia;
  const keyFocus = member.volunteer_target || member.library_role || member.partnershipType || member.partnership_type || member.area_of_interest || member.department;

  return (
    <Portal>
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
        <DraggableModal className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar border border-stone-100" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6 drag-handle cursor-grab pb-4 border-b border-stone-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#003828]/10 text-[#003828] rounded-2xl flex items-center justify-center font-bold text-2xl uppercase">
                {member.name?.charAt(0) || 'M'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">{member.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {member.role}
                  </span>
                  {displayOrg && (
                    <span className="text-xs text-stone-500 font-medium truncate max-w-xs">
                      • {displayOrg}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 p-5 rounded-2xl border border-stone-100 text-sm">
            <div className="flex gap-3">
              <Mail className="text-stone-400 mt-0.5 shrink-0" size={18} />
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Email Address</div>
                <div className="text-sm font-medium text-stone-900 mt-0.5 break-all">{member.email || 'N/A'}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="text-stone-400 mt-0.5 shrink-0" size={18} />
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Phone / Contact</div>
                <div className="text-sm font-medium text-stone-900 mt-0.5">{member.phone || 'N/A'}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Calendar className="text-stone-400 mt-0.5 shrink-0" size={18} />
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Join / Registered Date</div>
                <div className="text-sm font-medium text-stone-900 mt-0.5">
                  {member.joinDate || (member.dateAdded ? new Date(member.dateAdded).toLocaleDateString() : 'N/A')}
                </div>
              </div>
            </div>
            {displayLocation && (
              <div className="flex gap-3">
                <MapPin className="text-stone-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Location</div>
                  <div className="text-sm font-medium text-stone-900 mt-0.5">{displayLocation}</div>
                </div>
              </div>
            )}
            {keyFocus && (
              <div className="flex gap-3 md:col-span-2">
                <Award className="text-stone-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Target / Key Focus / Role</div>
                  <div className="text-sm font-medium text-stone-900 mt-0.5">{keyFocus}</div>
                </div>
              </div>
            )}
            {displayWeb && (
              <div className="flex gap-3 md:col-span-2">
                <Globe className="text-stone-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Website / Social Profile</div>
                  <a href={displayWeb.startsWith('http') ? displayWeb : `https://${displayWeb}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#003828] hover:underline inline-flex items-center gap-1 mt-0.5">
                    {displayWeb} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
            {member.skills && (
              <div className="flex gap-3 md:col-span-2">
                <Briefcase className="text-stone-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Skills / Expertise</div>
                  <div className="text-sm font-medium text-stone-900 mt-0.5">{member.skills}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-4 pt-4 border-t border-stone-100">
            <History className="text-stone-400 mt-0.5 shrink-0" size={18} />
            <div className="flex-1">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">History & Status</div>
              <div className="text-sm font-medium text-stone-800 mt-0.5">{member.history || 'Registered and active member.'}</div>
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-stone-100 flex justify-end">
            <button onClick={onClose} className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full font-semibold transition-colors cursor-pointer text-sm">
              Close
            </button>
          </div>
        </DraggableModal>
      </div>
    </Portal>
  );
}
