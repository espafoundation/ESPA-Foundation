import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Plus, History, X, Search, ArrowLeft, Printer, ArrowRightLeft, Send, CheckSquare } from 'lucide-react';
import { ActionMenu, ConfirmModal, SignaturePad, UserLink } from '../components/SharedComponents';
import DraggableModal from '../components/DraggableModal';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function GeneralAgreementsView({ agreements, setAgreements, currentUser, users, showToast, addLog, setActiveTab }) {
  const canAdd = currentUser && ['Admin', 'In-Country Coordinator', 'Deputy Lead Coordinator', 'Lead Coordinator'].includes(currentUser.role);
  const isParticipant = currentUser && ['Intern', 'Camper'].includes(currentUser.role);
  const cohortAgreements = agreements ? agreements.filter(a => a.isCohort).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showRevisions, setShowRevisions] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [showSignaturesModal, setShowSignaturesModal] = useState(false);
  
  const [selectedRevision, setSelectedRevision] = useState(null);

  const activeAgreement = cohortAgreements.length > 0 ? cohortAgreements[0] : null;
  const revisions = cohortAgreements.length > 1 ? cohortAgreements.slice(1) : [];


  const hasSigned = activeAgreement?.signatures?.some(sig => sig.userId === currentUser.id);

  const relevantParticipants = users ? users.filter(u => {
      if (!activeAgreement) return false;
      const matchesRole = ['Intern', 'Camper'].includes(u.role);
      const matchesBatch = activeAgreement.batch ? u.batch === activeAgreement.batch : true;
      const matchesHost = activeAgreement.hostId ? u.hostId === activeAgreement.hostId : true;
      return matchesRole && matchesBatch && matchesHost;
  }) : [];

  const filteredParticipants = relevantParticipants.filter(p => {
    if (!searchTerm) return true;
    return p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.role?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredRevisions = revisions.filter(r => {
    if (!searchTerm) return true;
    return r.title?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDraftSubmit = (e) => {
    e.preventDefault();
    if (!draftText.trim()) return showToast('Please enter agreement text', 'error');
    if (!draftTitle.trim()) return showToast('Please enter a title', 'error');

    const newAgr = {
        id: `AGR-COHORT-${Date.now()}`,
        title: draftTitle,
        roomId: null,
        isCohort: true,
        batch: currentUser?.batch || null,
        hostId: currentUser?.role === 'Host' ? currentUser.id : currentUser?.hostId || null,
        status: 'Active',
        createdBy: currentUser.id,
        rules: [{ id: Date.now(), text: draftText, createdBy: currentUser.id, timestamp: new Date().toISOString(), mutual: false }],
        signatures: [],
        createdAt: new Date().toISOString(),
        history: [{
           id: Date.now() + Math.random(),
           action: 'Created In-House Agreement',
           details: `Draft created`,
           userId: currentUser.id,
           timestamp: new Date().toISOString()
        }]
    };
    setAgreements([...agreements, newAgr]);
    addLog('Drafted new In-House Agreement');
    showToast('In-House Agreement Drafted', 'success');
    setIsDraftModalOpen(false);
    setDraftText('');
    setDraftTitle('');
    setShowRevisions(false);
  };

  const handleSign = () => {
    if (!activeAgreement) return;
    if (!signatureName.trim()) return showToast('Please type your name to sign', 'error');
    
    const newSig = { userId: currentUser.id, date: new Date().toISOString(), signatureName: signatureName.trim() };
    const updatedAgreement = {
        ...activeAgreement,
        signatures: [...(activeAgreement.signatures || []), newSig],
        history: [...(activeAgreement.history || []), {
            id: Date.now() + Math.random(),
            action: 'Signed In-House Agreement',
            details: `Signed digitally as ${signatureName.trim()}`,
            userId: currentUser.id,
            timestamp: new Date().toISOString()
        }]
    };
    setAgreements(agreements.map(a => a.id === activeAgreement.id ? updatedAgreement : a));
    addLog('Signed In-House Agreement');
    showToast('Agreement signed successfully', 'success');
    setSignatureName('');
  };

  const modulesForQuill = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean']
    ],
  };

  return (
    <div className="space-y-8 h-full flex flex-col tracking-tight relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900 flex items-center gap-2">
            <FileText className="text-[#003828]" size={28} /> In-House Agreement
          </h1>
          <p className="text-stone-500 text-sm mt-2 font-medium">View and manage admin-wide agreements.</p>
        </div>
        {canAdd && (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowRevisions(!showRevisions)} className="bg-white border border-stone-200 text-stone-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm flex items-center gap-2">
              <History size={16} className="text-stone-500" /> {showRevisions ? 'Back to Active' : 'Revisions'}
            </button>
            <button onClick={() => setIsDraftModalOpen(true)} className="bg-[#003828] text-[#FDFCFB] px-5 py-2.5 rounded-xl text-sm font-medium border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors shadow-sm flex items-center gap-2">
              <Plus size={16} className="text-[#FDFCFB]" /> Draft
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003828]" size={18} strokeWidth={1.5} />
        <input
          type="text"
          placeholder={showRevisions ? "Search revisions..." : "Search acknowledgments..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm shadow-sm"
        />
      </div>

      {!showRevisions ? (
        <div className="flex-1 bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col p-6 sm:p-8 overflow-y-auto">
           {activeAgreement ? (
             <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                   <div>
                     <h2 className="text-2xl font-bold text-stone-900">{activeAgreement.title || 'In-House Agreement'}</h2>
                   </div>
                </div>
                <div className="prose prose-sm max-w-none text-stone-700 space-y-4 quill-content" dangerouslySetInnerHTML={{ __html: activeAgreement.rules[0]?.text || '' }}>
                </div>
                
                <div className="pt-8 border-t border-stone-100 mt-8">
                    {isParticipant && (
                        <div className="bg-stone-50 p-6 rounded-xl border border-stone-200 flex flex-col items-center justify-center text-center mb-8">
                            <h3 className="text-lg font-bold text-stone-900 mb-2">Sign Agreement</h3>
                            <p className="text-stone-500 text-sm mb-6 max-w-md">By typing your name and clicking the button below, you digitally sign and acknowledge the terms stated in this In-House Agreement.</p>
                            {hasSigned ? (
                                <div className="px-6 py-3 bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] rounded-xl font-semibold flex items-center gap-2">
                                    ✓ Digitally Signed
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                                    <input 
                                        type="text" 
                                        placeholder="Type your full name to sign" 
                                        value={signatureName}
                                        onChange={(e) => setSignatureName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003828] font-medium text-stone-900 text-center"
                                    />
                                    <button onClick={handleSign} className="w-full px-8 py-3 bg-[#003828] text-white rounded-xl font-bold border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={!signatureName.trim()}>
                                        I Acknowledge and Sign
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="mb-8">
                       <h3 className="text-lg font-bold text-stone-900 border-b border-stone-200 pb-2 mb-4">Acknowledgments</h3>
                       <div className="space-y-3">
                         {filteredParticipants.map(participant => {
                           const hasAcknowledged = (activeAgreement?.signatures || []).some(s => s.userId === participant.id);
                           return (
                             <div key={participant.id} className="flex justify-between items-center p-4 bg-stone-50 border border-stone-200 rounded-xl">
                                <div>
                                  <p className="font-semibold text-stone-900">{participant.name || 'Unknown User'}</p>
                                  <p className="text-xs text-stone-500">{participant.role} {participant.batch ? `• ${participant.batch}` : ''}</p>
                                </div>
                                {hasAcknowledged ? (
                                  <div className="px-3 py-1 bg-[#003828]/10 text-[#003828] font-semibold text-xs rounded-full border border-[#003828]/20 uppercase tracking-wide">ACKNOWLEDGED</div>
                                ) : (
                                  <div className="px-3 py-1 bg-red-100 text-red-700 font-semibold text-xs rounded-full border border-red-200 uppercase tracking-wide">NOT ACKNOWLEDGED</div>
                                )}
                             </div>
                           );
                         })}
                         {filteredParticipants.length === 0 && (
                           <p className="text-sm text-stone-500 italic">No Data Available.</p>
                         )}
                       </div>
                    </div>
                </div>
             </div>
           ) : (
             <div className="py-20 text-center text-sm text-stone-500">
                 No Draft Available.
             </div>
           )}
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden">
           <div className="w-full overflow-x-auto pb-16">
              <table className="w-full text-left border-collapse min-w-[700px]">
                 <thead>
                    <tr className="border-b border-stone-100 text-stone-400 text-xs tracking-wider bg-stone-50/50 rounded-t-2xl">
                       <th className="pl-12 pr-6 py-5 font-medium uppercase">Title</th>
                       <th className="px-6 py-5 font-medium uppercase">Date Added</th>
                       <th className="px-6 py-5 font-medium uppercase">Added By</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-stone-100">
                    {filteredRevisions.map(agreement => {
                       const creator = users ? users.find(u => u.id === agreement.createdBy) : null;
                       return (
                          <tr key={agreement.id} className="hover:bg-[#FDFCFB] transition-colors">
                             <td className="pl-12 pr-6 py-4 align-middle text-sm font-semibold whitespace-nowrap">
                                <button onClick={() => setSelectedRevision(agreement)} className="text-stone-900 hover:text-[#003828] font-bold">
                                    {agreement.title || 'Untitled Agreement'}
                                </button>
                             </td>
                             <td className="px-6 py-4 align-middle text-sm font-medium text-stone-500">{new Date(agreement.createdAt).toLocaleDateString()}</td>
                             <td className="px-6 py-4 align-middle text-sm font-medium text-stone-900">{creator?.name || 'Admin'}</td>
                          </tr>
                       );
                    })}
                    {filteredRevisions.length === 0 && (
                       <tr><td colSpan={3} className="py-20 text-center text-sm text-stone-500">No Data Available.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {isDraftModalOpen && createPortal(
        <>
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" aria-hidden="true" onClick={() => setIsDraftModalOpen(false)} />
            <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 pointer-events-none">
                <DraggableModal className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-4 drag-handle cursor-grab active:cursor-grabbing touch-none shrink-0">
                        <h3 className="text-xl font-bold text-stone-900 flex items-center gap-3">
                            <FileText className="text-[#003828] pointer-events-none" size={24} /> 
                            <span className="pointer-events-none">Draft Agreement</span>
                        </h3>
                        <button type="button" onClick={() => setIsDraftModalOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleDraftSubmit} className="flex flex-col gap-6 flex-1 min-h-0">
                        <div className="shrink-0">
                            <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">Agreement Title<span className="text-red-500">*</span></label>
                            <input 
                                required 
                                value={draftTitle}
                                onChange={(e) => setDraftTitle(e.target.value)}
                                placeholder="Enter title..." 
                                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#003828] focus:border-[#003828] outline-none text-sm font-normal text-stone-800" 
                            />
                        </div>
                        <div className="flex-1 flex flex-col min-h-[300px]">
                            <label className="block text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider shrink-0">Agreement Text<span className="text-red-500">*</span></label>
                            <div className="flex-1 border border-stone-200 rounded-xl overflow-hidden bg-white">
                                <ReactQuill 
                                    theme="snow" 
                                    value={draftText} 
                                    onChange={setDraftText} 
                                    modules={modulesForQuill}
                                    className="h-full flex flex-col [&_.ql-container]:flex-1 [&_.ql-editor]:h-full [&_.ql-editor]:min-h-[200px]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 shrink-0">
                            <button type="button" onClick={() => setIsDraftModalOpen(false)} className="px-5 py-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 shadow-sm font-medium rounded-xl transition-colors shrink-0">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 bg-[#003828] text-[#FDFCFB] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] shadow-sm font-medium rounded-xl transition-colors shrink-0">Save Draft</button>
                        </div>
                    </form>
                </DraggableModal>
            </div>
        </>,
        document.body
      )}

      {selectedRevision && createPortal(
        <>
            <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200" aria-hidden="true" onClick={() => setSelectedRevision(null)} />
            <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 pointer-events-none">
                <DraggableModal className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-4 drag-handle cursor-grab active:cursor-grabbing touch-none shrink-0">
                        <h3 className="text-xl font-bold text-stone-900 flex items-center gap-3">
                            <History className="text-[#003828] pointer-events-none" size={24} /> 
                            <span className="pointer-events-none">{selectedRevision.title || 'Agreement Revision'}</span>
                        </h3>
                        <button type="button" onClick={() => setSelectedRevision(null)} className="text-stone-400 hover:text-stone-600 transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="prose prose-sm max-w-none text-stone-700 quill-content" dangerouslySetInnerHTML={{ __html: selectedRevision.rules[0]?.text || '' }}>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-stone-100 shrink-0 mt-6">
                        <button type="button" onClick={() => setSelectedRevision(null)} className="px-5 py-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 shadow-sm font-medium rounded-xl transition-colors shrink-0">Close</button>
                    </div>
                </DraggableModal>
            </div>
        </>,
        document.body
      )}
      
    </div>
  );
}
