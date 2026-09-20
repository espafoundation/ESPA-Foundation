import React, { useState, useEffect } from 'react';
import { Banknote, ArrowUpRight, ArrowDownRight, Plus, X } from 'lucide-react';
import DraggableModal from './DraggableModal';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => createPortal(children, document.body);

export default function FundsView({ funds, setFunds, addLog, showToast }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [amountPKR, setAmountPKR] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [isInsufficientFunds, setIsInsufficientFunds] = useState(false);

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
    if (isAdding && (donorName || amountPKR || amountUSD)) {
      window.localStorage.setItem('ain_draft_add_fund', JSON.stringify({ donorName, amountPKR, amountUSD }));
    }
  }, [donorName, amountPKR, amountUSD, isAdding]);

  useEffect(() => {
    if (isAllocating && (allocationReason || amountPKR || amountUSD)) {
      window.localStorage.setItem('ain_draft_allocate_fund', JSON.stringify({ allocationReason, amountPKR, amountUSD }));
    }
  }, [allocationReason, amountPKR, amountUSD, isAllocating]);

  
  const isDirty = (isAdding && (donorName.trim() !== '' || amountPKR !== '' || amountUSD !== '')) || 
                  (isAllocating && (allocationReason.trim() !== '' || amountPKR !== '' || amountUSD !== ''));
  
  useEffect(() => {
    window.ain_isFormDirty = (isAdding || isAllocating) && isDirty;
    return () => { window.ain_isFormDirty = false; };
  }, [isAdding, isAllocating, isDirty]);

  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const confirmDiscard = () => {
    window.localStorage.removeItem('ain_draft_add_fund');
    window.localStorage.removeItem('ain_draft_allocate_fund');
    setDonorName(''); setAmountPKR(''); setAmountUSD(''); setAllocationReason('');
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
    window.localStorage.setItem('ain_draft_add_fund', JSON.stringify({ donorName, amountPKR, amountUSD }));
    showToast("Add Fund draft saved!", "success");
  };

  const handleSaveAllocateDraft = () => {
    window.localStorage.setItem('ain_draft_allocate_fund', JSON.stringify({ allocationReason, amountPKR, amountUSD }));
    showToast("Allocate Fund draft saved!", "success");
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
    
    const newTx = {
      id: Date.now(),
      type: 'donation',
      donorName,
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
            <button type="button" onClick={handleBackClick} className="px-4 py-2 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-full font-semibold text-sm transition-colors shadow-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
          <div className="flex-1 overflow-auto p-6 md:p-8">
            {isAdding ? (
                <form onSubmit={handleAddFunds} className="space-y-4 max-w-2xl mx-auto pb-12">

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Donor Name</label>
                  <input type="text" required value={donorName} onChange={e => setDonorName(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828]" placeholder="Name of donor" />
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
                  <button type="button" onClick={handleSaveAddDraft} className="px-5 py-2 rounded-full text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">Save Draft</button>
                  <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors">Add Donation</button>
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
                  <button type="button" onClick={handleSaveAllocateDraft} className="px-5 py-2 rounded-full text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">Save Draft</button>
                  <button type="submit" className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors">Allocate Funds</button>
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
                <button type="button" onClick={() => setShowDiscardModal(false)} className="px-4 py-2 font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full text-sm">Cancel</button>
                <button type="button" onClick={confirmDiscard} className="px-4 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full text-sm">Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-2">Funds & Allocations
          </h1>
          <p className="text-stone-500 text-base mt-2 font-medium">Manage incoming donations and outgoing allocations.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setIsAdding(true); setAmountPKR(''); setAmountUSD(''); setIsInsufficientFunds(false); }}
            className="px-5 py-2.5 bg-[#003828] text-white rounded-full text-sm font-medium tracking-wide border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors flex items-center gap-2"
          >
            <ArrowDownRight size={16} /> Add Funds
          </button>
          <button 
            onClick={() => { setIsAllocating(true); setAmountPKR(''); setAmountUSD(''); setIsInsufficientFunds(false); }}
            className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-full text-sm font-medium tracking-wide hover:bg-stone-200 transition-colors flex items-center gap-2 border border-stone-200"
          >
            <ArrowUpRight size={16} /> Allocate Funds
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="p-4 border-b border-stone-100 shrink-0 bg-stone-50 flex gap-8">
            <div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total PKR Available</div>
                <div className="text-2xl font-bold text-stone-900">Rs {(funds?.pkr || 0).toLocaleString()}</div>
            </div>
            <div>
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Total USD Available</div>
                <div className="text-2xl font-bold text-stone-900">${(funds?.usd || 0).toLocaleString()}</div>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-0">
          {funds.transactions.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 border-b border-stone-200 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap">Type</th>
                  <th className="px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap">Details</th>
                  <th className="px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {funds.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-6 py-4 text-stone-600 text-sm">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {tx.type === 'donation' ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-bold bg-[#003828]/10 text-[#003828] tracking-wide uppercase">
                            Donation
                          </span>
                      ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 tracking-wide uppercase">
                            Allocation
                          </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="font-semibold text-stone-900 text-sm">
                            {tx.type === 'donation' ? `From: ${tx.donorName}` : `For: ${tx.reason}`}
                        </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.type === 'donation' ? 'text-[#003828]' : 'text-red-600'}`}>
                      {tx.type === 'donation' ? '+' : '-'} {tx.amountPKR !== undefined ? (
                        (tx.amountPKR ? `Rs ${(tx.amountPKR || 0).toLocaleString()}` : '') + 
                        (tx.amountPKR && tx.amountUSD ? ' | ' : '') + 
                        (tx.amountUSD ? `$${(tx.amountUSD || 0).toLocaleString()}` : '')
                      ) : (
                        tx.currency === 'PKR' ? `Rs ${tx.amount?.toLocaleString()}` : `$${tx.amount?.toLocaleString()}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center">
              <Banknote size={48} className="text-stone-300 mb-4" />
              <p className="font-medium text-stone-600">No transactions recorded</p>
            </div>
          )}
        </div>
      </div>

      
    </div>
  );
}