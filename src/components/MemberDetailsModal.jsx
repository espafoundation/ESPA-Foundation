import React from 'react';
import { Mail, Phone, Calendar, Briefcase, History, X } from 'lucide-react';
import DraggableModal from './DraggableModal';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => createPortal(children, document.body);

export default function MemberDetailsModal({ member, onClose }) {
  if (!member) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
        <DraggableModal className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center font-bold text-2xl text-stone-700 uppercase">
                {member.name?.charAt(0) || 'M'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">{member.name}</h3>
                <p className="text-sm text-[#003828] font-semibold">{member.role}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-5 rounded-2xl border border-stone-100">
            <div className="flex gap-3">
              <Mail className="text-stone-400 mt-0.5" size={18} />
              <div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Email</div>
                <div className="text-sm font-medium text-stone-900 mt-1 break-all">{member.email}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="text-stone-400 mt-0.5" size={18} />
              <div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Phone</div>
                <div className="text-sm font-medium text-stone-900 mt-1">{member.phone || 'N/A'}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Calendar className="text-stone-400 mt-0.5" size={18} />
              <div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Join Date</div>
                <div className="text-sm font-medium text-stone-900 mt-1">{member.joinDate || 'N/A'}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Briefcase className="text-stone-400 mt-0.5" size={18} />
              <div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">Current Projects</div>
                <div className="text-sm font-medium text-stone-900 mt-1">{member.projects || 'None assigned'}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4 pt-4 border-t border-stone-100">
            <History className="text-stone-400 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">History</div>
              <div className="text-sm font-medium text-stone-900 mt-1">{member.history || 'No history available.'}</div>
            </div>
          </div>
          
          <div className="pt-4 mt-2 border-t border-stone-100 flex justify-end">
            <button onClick={onClose} className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full font-semibold transition-colors">
              Close
            </button>
          </div>
        </DraggableModal>
      </div>
    </Portal>
  );
}
