import React, { useState, useEffect } from 'react';
import { Banknote, ArrowUpRight, ArrowDownRight, Plus, X, Search, Eye, Check, Calendar, Mail, Tag, DollarSign, Edit, Save, Trash2 } from 'lucide-react';
import DraggableModal from './DraggableModal';
import MemberDetailsModal from './MemberDetailsModal';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => createPortal(children, document.body);

export default function FundsView({ funds, setFunds, users = [], addLog, showToast }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amountPKR, setAmountPKR] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [isInsufficientFunds, setIsInsufficientFunds] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedMemberModal, setSelectedMemberModal] = useState(null);
  const [isEditingTx, setIsEditingTx] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nameOrReason: '',
    donorEmail: '',
    amountPKR: '',
    amountUSD: '',
    date: ''
  });

  const handleStartEditTx = (tx) => {
    setSelectedTx(tx);
    setIsEditingTx(true);
    setEditFormData({
      nameOrReason: tx.type === 'donation' ? (tx.donorName || '') : (tx.reason || ''),
      donorEmail: tx.donorEmail || (users?.find(u => u.name?.toLowerCase() === (tx.donorName || '').toLowerCase())?.email) || '',
      amountPKR: tx.amountPKR !== undefined ? tx.amountPKR : (tx.currency === 'PKR' ? (tx.amount || 0) : ''),
      amountUSD: tx.amountUSD !== undefined ? tx.amountUSD : (tx.currency === 'USD' ? (tx.amount || 0) : ''),
      date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : ''
    });
  };

  const handleSaveEditTx = () => {
    if (!selectedTx) return;
    const updatedTransactions = (funds?.transactions || []).map(t => {
      if (t.id === selectedTx.id) {
        return {
          ...t,
          donorName: t.type === 'donation' ? editFormData.nameOrReason : t.donorName,
          reason: t.type === 'allocation' ? editFormData.nameOrReason : t.reason,
          donorEmail: editFormData.donorEmail,
          amountPKR: Number(editFormData.amountPKR) || 0,
          amountUSD: Number(editFormData.amountUSD) || 0,
          date: editFormData.date ? new Date(editFormData.date).toISOString() : t.date
        };
      }
      return t;
    });

    const updatedFunds = {
      ...funds,
      transactions: updatedTransactions
    };
    setFunds(updatedFunds);
    window.localStorage.setItem('ain_funds', JSON.stringify(updatedFunds));
    if (addLog) addLog(`Updated fund transaction details: ${selectedTx.id}`);
    if (showToast) showToast('Transaction updated successfully', 'success');
    setSelectedTx(null);
    setIsEditingTx(false);
  };

  const handleDeleteTx = (txId) => {
    const updatedTransactions = (funds?.transactions || []).filter(t => t.id !== txId);
    const updatedFunds = {
      ...funds,
      transactions: updatedTransactions
    };
    setFunds(updatedFunds);
    window.localStorage.setItem('ain_funds', JSON.stringify(updatedFunds));
    if (addLog) addLog(`Removed fund transaction: ${txId}`);
    if (showToast) showToast('Transaction removed successfully', 'success');
    setSelectedTx(null);
    setIsEditingTx(false);
  };

  const handleUserClick = (tx) => {
    const nameToSearch = tx.donorName || (tx.type === 'donation' ? tx.reason : null);
    const emailToSearch = tx.donorEmail;
    const matchedUser = (users || []).find(u => 
      (emailToSearch && u.email?.toLowerCase() === emailToSearch.toLowerCase()) ||
      (nameToSearch && u.name?.toLowerCase() === nameToSearch.toLowerCase())
    );
    if (matchedUser) {
      setSelectedMemberModal(matchedUser);
    } else {
      setSelectedMemberModal({
        name: tx.donorName || tx.reason || 'Anonymous Donor',
        email: tx.donorEmail || (tx.type === 'donation' ? 'donor@ain.org' : 'partner@ain.org'),
        role: tx.type === 'donation' ? 'Donor' : 'Partner',
        joinDate: tx.date ? new Date(tx.date).toLocaleDateString() : 'Recent',
        organization: 'AIN Foundation Supporter',
        status: 'Active'
      });
    }
  };

  // Sync funds to ensure no phantom values exist if transactions are cleared
  useEffect(() => {
    let calculatedPkr = 0;
    let calculatedUsd = 0;
    
    (funds?.transactions || []).forEach(tx => {
       const pkrAmt = tx.amountPKR !== undefined ? tx.amountPKR : (tx.currency === 'PKR' ? (tx.amount || 0) : 0);
       const usdAmt = tx.amountUSD !== undefined ? tx.amountUSD : (tx.currency === 'USD' ? (tx.amount || 0) : 0);
       
       if (tx.type === 'donation') {
           calculatedPkr += pkrAmt;
           calculatedUsd += usdAmt;
       } else {
           calculatedPkr -= pkrAmt;
           calculatedUsd -= usdAmt;
       }
    });
    
    if (funds.pkr !== calculatedPkr || funds.usd !== calculatedUsd) {
        setFunds({ ...funds, pkr: calculatedPkr, usd: calculatedUsd });
    }
  }, [funds.transactions]);

  const [allocationReason, setAllocationReason] = useState('');

  useEffect(() => {
    if (isAdding) {
      const draft = window.localStorage.getItem('ain_draft_add_fund');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setDonorName(parsed.donorName || '');
          setDonorEmail(parsed.donorEmail || '');
          setAmountPKR(parsed.amountPKR || '');
          setAmountUSD(parsed.amountUSD || '');
        } catch (e) {}
      }
    } else if (isAllocating) {
      const draft = window.localStorage.getItem('ain_draft_allocate_fund');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setAllocationReason(parsed.allocationReason || '');
          setAmountPKR(parsed.amountPKR || '');
          setAmountUSD(parsed.amountUSD || '');
        } catch (e) {}
      }
    }
  }, [isAdding, isAllocating]);

  useEffect(() => {
    if (isAdding && (donorName || donorEmail || amountPKR || amountUSD)) {
      window.localStorage.setItem('ain_draft_add_fund', JSON.stringify({ donorName, donorEmail, amountPKR, amountUSD }));
    }
  }, [donorName, donorEmail, amountPKR, amountUSD, isAdding]);

  useEffect(() => {
    if (isAllocating && (allocationReason || amountPKR || amountUSD)) {
      window.localStorage.setItem('ain_draft_allocate_fund', JSON.stringify({ allocationReason, amountPKR, amountUSD }));
    }
  }, [allocationReason, amountPKR, amountUSD, isAllocating]);

  
  const isDirty = (isAdding && (donorName.trim() !== '' || donorEmail.trim() !== '' || amountPKR !== '' || amountUSD !== '')) || 
                  (isAllocating && (allocationReason.trim() !== '' || amountPKR !== '' || amountUSD !== ''));
  
  useEffect(() => {
    window.ain_isFormDirty = (isAdding || isAllocating) && isDirty;
    return () => { window.ain_isFormDirty = false; };
  }, [isAdding, isAllocating, isDirty]);

  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const confirmDiscard = () => {
    window.localStorage.removeItem('ain_draft_add_fund');
    window.localStorage.removeItem('ain_draft_allocate_fund');
    setDonorName(''); setDonorEmail(''); setAmountPKR(''); setAmountUSD(''); setAllocationReason('');
    window.ain_isFormDirty = false;
    setIsAdding(false); setIsAllocating(false);
    setShowDiscardModal(false);
  };

  const handleBackClick = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      setIsAdding(false); setIsAllocating(false);
    }
  };

  const handleSaveAddDraft = () => {
    window.localStorage.setItem('ain_draft_add_fund', JSON.stringify({ donorName, donorEmail, amountPKR, amountUSD }));
    showToast("Add Fund draft saved!", "success");
  };

  const handleSaveAllocateDraft = () => {
    window.localStorage.setItem('ain_draft_allocate_fund', JSON.stringify({ allocationReason, amountPKR, amountUSD }));
    showToast("Allocate Fund draft saved!", "success");
  };

  const handleDonorNameChange = (name) => {
    setDonorName(name);
    if (!donorEmail && users && users.length > 0) {
      const matched = users.find(u => u.name?.toLowerCase() === name.trim().toLowerCase());
      if (matched && matched.email) {
        setDonorEmail(matched.email);
      }
    }
  };

  const handleAddFunds = (e) => {
    e.preventDefault();
    if (!amountPKR && !amountUSD) {
      showToast('Please enter an amount in PKR or USD.', 'error');
      return;
    }
    const valPKR = Number(amountPKR) || 0;
    const valUSD = Number(amountUSD) || 0;
    
    if (valPKR <= 0 && valUSD <= 0) return;

    const resolvedEmail = donorEmail.trim() || (users.find(u => u.name?.toLowerCase() === donorName.trim().toLowerCase())?.email || '');
    
    const newTx = {
      id: Date.now(),
      type: 'donation',
      donorName,
      donorEmail: resolvedEmail,
      amountPKR: valPKR,
      amountUSD: valUSD,
      date: new Date().toISOString()
    };
    
    const updatedFunds = {
      ...funds,
      pkr: funds.pkr + valPKR,
      usd: funds.usd + valUSD,
      transactions: [newTx, ...funds.transactions]
    };
    
    setFunds(updatedFunds);
    setIsAdding(false);
    setDonorName('');
    setDonorEmail('');
    setAmountPKR('');
    setAmountUSD('');
    window.localStorage.removeItem('ain_draft_add_fund');
    showToast('Donation added successfully', 'success');
    addLog(`Donation of PKR ${valPKR} / USD ${valUSD} added from ${donorName}`);
  };

  const handleAllocateFunds = (e) => {
    e.preventDefault();
    if (!amountPKR && !amountUSD) {
      showToast('Please enter an amount in PKR or USD.', 'error');
      return;
    }
    const valPKR = Number(amountPKR) || 0;
    const valUSD = Number(amountUSD) || 0;
    
    if (valPKR <= 0 && valUSD <= 0) return;
    
    if (valPKR > funds.pkr || valUSD > funds.usd) {
      setIsInsufficientFunds(true);
      showToast('Insufficient funds available', 'error');
      return;
    }
    setIsInsufficientFunds(false);
    
    const newTx = {
      id: Date.now(),
      type: 'allocation',
      reason: allocationReason,
      amountPKR: valPKR,
      amountUSD: valUSD,
      date: new Date().toISOString()
    };
    
    const updatedFunds = {
      ...funds,
      pkr: funds.pkr - valPKR,
      usd: funds.usd - valUSD,
      transactions: [newTx, ...funds.transactions]
    };
    
    setFunds(updatedFunds);
    setIsAllocating(false);
    setAllocationReason('');
    setAmountPKR('');
    setAmountUSD('');
    window.localStorage.removeItem('ain_draft_allocate_fund');
    showToast('Funds allocated successfully', 'success');
    addLog(`Allocated PKR ${valPKR} / USD ${valUSD} for ${allocationReason}`);
  };

  if (isAdding || isAllocating) {
    return (
      <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-semibold text-black">{isAdding ? 'Add Funds' : 'Allocate Funds'}</h1>
            <p className="text-stone-500 text-base mt-2 font-medium">Fill in the details below to {isAdding ? 'record a new donation' : 'allocate funds'}.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleBackClick} className="px-4 py-2 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-full font-semibold text-sm transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
          <div className="flex-1 overflow-auto p-6 md:p-8">
            {isAdding ? (
                <form onSubmit={handleAddFunds} className="space-y-4 max-w-2xl mx-auto pb-12">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Donor Name</label>
                    <input type="text" required value={donorName} onChange={e => handleDonorNameChange(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828]" placeholder="Name of donor" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Donor Email (Optional)</label>
                    <input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828]" placeholder="donor@example.com" />
                  </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Amount (PKR)</label>
                      <input type="number" min="0" value={amountPKR} onChange={e => { setAmountPKR(e.target.value); if(!amountUSD && e.target.value) setAmountUSD((Number(e.target.value)/278).toFixed(2)) }} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828]" placeholder="0.00" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Amount (USD)</label>
                      <input type="number" min="0" value={amountUSD} onChange={e => { setAmountUSD(e.target.value); if(!amountPKR && e.target.value) setAmountPKR((Number(e.target.value)*278).toFixed(0)) }} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828]" placeholder="0.00" />
                    </div>
                </div>
                <div className="text-xs text-stone-500 flex justify-end">Available: Rs {(funds?.pkr || 0).toLocaleString()} | $ {(funds?.usd || 0).toLocaleString()}</div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
                  <button type="button" onClick={handleSaveAddDraft} className="px-5 py-2 rounded-full text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer">Save Draft</button>
                  <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors cursor-pointer">Add Donation</button>
                </div>

                </form>
            ) : (
                <form onSubmit={handleAllocateFunds} className="space-y-4 max-w-2xl mx-auto pb-12">

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Allocation Reason / Destination</label>
                  <input type="text" required value={allocationReason} onChange={e => setAllocationReason(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828]" placeholder="Where are these funds going?" />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Amount (PKR)</label>
                      <input type="number" min="0" value={amountPKR} onChange={e => { setAmountPKR(e.target.value); setIsInsufficientFunds(false); if(!amountUSD && e.target.value) setAmountUSD((Number(e.target.value)/278).toFixed(2)) }} className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-colors ${Number(amountPKR) > funds.pkr ? "border-red-500 focus:border-red-500 focus:ring-red-500 text-red-600" : "border-stone-200 focus:border-[#003828] focus:ring-[#003828]"}`} placeholder="0.00" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Amount (USD)</label>
                      <input type="number" min="0" value={amountUSD} onChange={e => { setAmountUSD(e.target.value); setIsInsufficientFunds(false); if(!amountPKR && e.target.value) setAmountPKR((Number(e.target.value)*278).toFixed(0)) }} className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 transition-colors ${Number(amountUSD) > funds.usd ? "border-red-500 focus:border-red-500 focus:ring-red-500 text-red-600" : "border-stone-200 focus:border-[#003828] focus:ring-[#003828]"}`} placeholder="0.00" />
                    </div>
                </div>
                <div className="text-xs text-stone-500 flex flex-col items-end gap-1">
                  {isInsufficientFunds && <span className="text-red-500 font-bold">Insufficient Funds</span>}
                  <span>Available: Rs {(funds?.pkr || 0).toLocaleString()} | $ {(funds?.usd || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
                  <button type="button" onClick={handleSaveAllocateDraft} className="px-5 py-2 rounded-full text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer">Save Draft</button>
                  <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors cursor-pointer">Allocate Funds</button>
                </div>

                </form>
            )}
          </div>
        </div>

        {showDiscardModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
              <h3 className="text-xl font-bold text-stone-900 mb-2">Discard Changes?</h3>
              <p className="text-stone-500 mb-6 text-sm">You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDiscardModal(false)} className="px-4 py-2 font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full text-sm cursor-pointer">Cancel</button>
                <button type="button" onClick={confirmDiscard} className="px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full text-sm cursor-pointer">Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredTransactions = (funds?.transactions || []).filter(tx => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const titleText = tx.type === 'donation' ? (tx.donorName || '') : (tx.reason || '');
    const donorMail = tx.donorEmail || (users?.find(u => u.name?.toLowerCase() === (tx.donorName || '').toLowerCase())?.email) || '';
    return titleText.toLowerCase().includes(term) || donorMail.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-2">
            Funds
          </h1>
          <p className="text-stone-500 text-base mt-2 font-medium">Manage incoming donations and outgoing allocations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => { setIsAdding(true); setAmountPKR(''); setAmountUSD(''); setDonorEmail(''); setIsInsufficientFunds(false); }}
            className="px-5 py-2.5 bg-[#003828] text-white rounded-full text-sm font-medium tracking-wide border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowDownRight size={16} /> Add Funds
          </button>
          <button 
            onClick={() => { setIsAllocating(true); setAmountPKR(''); setAmountUSD(''); setIsInsufficientFunds(false); }}
            className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-full text-sm font-medium tracking-wide hover:bg-stone-200 transition-colors flex items-center gap-2 border border-stone-200 cursor-pointer shadow-sm"
          >
            <ArrowUpRight size={16} /> Allocate Funds
          </button>
        </div>
      </div>

      <div className="relative mb-6 shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
        <input 
          type="text" 
          placeholder="Search funds, donors, or allocations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="flex-1 overflow-auto">
          {filteredTransactions.length > 0 ? (
            <table className="w-full text-left border-collapse table-fixed min-w-[650px]">
              <thead className="bg-stone-50/75 sticky top-0 z-10 border-b border-stone-200 backdrop-blur-sm">
                <tr>
                  <th className="w-[32%] px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-left">Title</th>
                  <th className="w-[28%] px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-left">Email</th>
                  <th className="w-[22%] px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-left">Donation Date</th>
                  <th className="w-[18%] px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.map((tx) => {
                  const donorMail = tx.donorEmail || (users?.find(u => u.name?.toLowerCase() === (tx.donorName || '').toLowerCase())?.email) || '';
                  const titleText = tx.type === 'donation' ? (tx.donorName || 'Donor') : (tx.reason || 'Fund Allocation');
                  const isDonation = tx.type === 'donation';

                  return (
                    <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors group">
                      <td className="w-[32%] px-6 py-4 text-left">
                        <button
                          type="button"
                          onClick={() => handleUserClick(tx)}
                          className="font-semibold text-stone-900 text-sm hover:text-[#003828] hover:underline transition-colors text-left cursor-pointer truncate block"
                          title="View user details"
                        >
                          {titleText}
                        </button>
                        <div className="text-xs font-medium truncate mt-0.5">
                          <span className={isDonation ? 'text-emerald-700' : 'text-rose-600'}>
                            {isDonation ? '+' : '-'} {tx.amountPKR !== undefined ? (
                              (tx.amountPKR ? `Rs ${(tx.amountPKR || 0).toLocaleString()}` : '') + 
                              (tx.amountPKR && tx.amountUSD ? ' / ' : '') + 
                              (tx.amountUSD ? `$${(tx.amountUSD || 0).toLocaleString()}` : '')
                            ) : (
                              tx.currency === 'PKR' ? `Rs ${tx.amount?.toLocaleString()}` : `$${tx.amount?.toLocaleString()}`
                            )}
                          </span>
                          <span className="text-stone-400 ml-1.5">• {isDonation ? 'Donation' : 'Allocation'}</span>
                        </div>
                      </td>
                      <td className="w-[28%] px-6 py-4 text-stone-600 text-sm text-left">
                        <span className="truncate block">{donorMail || '—'}</span>
                      </td>
                      <td className="w-[22%] px-6 py-4 text-stone-600 text-sm text-left">
                        <span className="inline-block">{tx.date ? new Date(tx.date).toLocaleDateString() : 'Recent'}</span>
                      </td>
                      <td className="w-[18%] px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <button 
                            onClick={() => handleStartEditTx(tx)}
                            className="p-2 text-stone-400 hover:text-[#003828] hover:bg-[#003828]/10 rounded-full transition-colors cursor-pointer"
                            title="Edit Fund"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-stone-500 flex flex-col items-center">
              <Banknote size={48} className="text-stone-300 mb-4" />
              <h3 className="font-semibold text-stone-700 text-lg">No transactions recorded</h3>
              <p className="text-sm text-stone-400 mt-1 max-w-sm mx-auto">
                {searchTerm ? 'No transactions match your search keywords.' : 'Add funds or allocate resources to see transaction records here.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Member Details Modal when clicking donor/user name */}
      {selectedMemberModal && (
        <MemberDetailsModal
          member={selectedMemberModal}
          onClose={() => setSelectedMemberModal(null)}
        />
      )}

      {/* Edit/View Transaction Modal */}
      {selectedTx && (
        <Portal>
          <DraggableModal
            isOpen={Boolean(selectedTx)}
            onClose={() => { setSelectedTx(null); setIsEditingTx(false); }}
            title={isEditingTx ? "Edit Fund Transaction" : "Transaction Details"}
          >
            {isEditingTx ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      {selectedTx.type === 'donation' ? 'Donor / Supporter Name' : 'Allocation Destination / Reason'}
                    </label>
                    <input
                      type="text"
                      value={editFormData.nameOrReason}
                      onChange={(e) => setEditFormData({ ...editFormData, nameOrReason: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#003828] focus:bg-white transition-all font-medium text-stone-900"
                      placeholder="Enter name or reason"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.donorEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, donorEmail: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#003828] focus:bg-white transition-all font-medium text-stone-900"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      Amount (PKR)
                    </label>
                    <input
                      type="number"
                      value={editFormData.amountPKR}
                      onChange={(e) => setEditFormData({ ...editFormData, amountPKR: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#003828] focus:bg-white transition-all font-medium text-stone-900"
                      placeholder="Rs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={editFormData.amountUSD}
                      onChange={(e) => setEditFormData({ ...editFormData, amountUSD: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#003828] focus:bg-white transition-all font-medium text-stone-900"
                      placeholder="$"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#003828] focus:bg-white transition-all font-medium text-stone-900"
                  />
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteTx(selectedTx.id)}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedTx(null); setIsEditingTx(false); }}
                      className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEditTx}
                      className="px-5 py-2 bg-[#003828] text-white rounded-full text-xs font-semibold hover:bg-[#00281c] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Save size={15} /> Save Changes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Transaction Type</span>
                    <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedTx.type === 'donation' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {selectedTx.type === 'donation' ? 'Incoming Donation' : 'Fund Allocation'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Status</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 border border-emerald-200">
                      <Check size={12} /> Completed
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-stone-50 rounded-xl">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      {selectedTx.type === 'donation' ? 'Donor Name' : 'Allocation Destination'}
                    </span>
                    <span className="font-semibold text-stone-900 text-sm mt-0.5 block">
                      {selectedTx.type === 'donation' ? (selectedTx.donorName || 'Anonymous') : (selectedTx.reason || 'General Allocation')}
                    </span>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Contact Email
                    </span>
                    <span className="font-semibold text-stone-900 text-sm mt-0.5 block truncate">
                      {selectedTx.donorEmail || (users?.find(u => u.name?.toLowerCase() === (selectedTx.donorName || '').toLowerCase())?.email) || '—'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Amount (PKR)
                    </span>
                    <span className="font-bold text-stone-900 text-base mt-0.5 block">
                      Rs {(selectedTx.amountPKR !== undefined ? selectedTx.amountPKR : (selectedTx.currency === 'PKR' ? selectedTx.amount : 0)).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      Amount (USD)
                    </span>
                    <span className="font-bold text-stone-900 text-base mt-0.5 block">
                      ${(selectedTx.amountUSD !== undefined ? selectedTx.amountUSD : (selectedTx.currency === 'USD' ? selectedTx.amount : 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">Recorded Date & Time</span>
                  <span className="text-stone-800 font-semibold">
                    {selectedTx.date ? new Date(selectedTx.date).toLocaleString() : 'N/A'}
                  </span>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleStartEditTx(selectedTx)}
                    className="px-4 py-2 bg-[#003828] text-white rounded-full text-xs font-semibold hover:bg-[#00281c] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Edit size={14} /> Edit Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTx(null)}
                    className="px-5 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </DraggableModal>
        </Portal>
      )}
    </div>
  );
}