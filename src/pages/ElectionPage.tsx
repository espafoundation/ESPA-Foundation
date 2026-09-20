import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const INITIAL_MEMBERS = [
  "Aitzaz Rahim",
  "Ali Hasnain",
  "Ali Sana Ullah",
  "Ashfaq Ullah Jan",
  "Azhan Khan",
  "Rameez Taj",
  "Shabbir Ahmed"
];

const POSITIONS = [
  { id: 'president', label: 'President' },
  { id: 'vicePresident', label: 'Vice President' },
  { id: 'generalSecretary', label: 'General Secretary' },
  { id: 'jointSecretary', label: 'Joint Secretary' },
  { id: 'treasurer', label: 'Treasurer' },
  { id: 'executiveMember1', label: 'Executive Member 1' },
  { id: 'executiveMember2', label: 'Executive Member 2' },
];

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  disabledOptions = [], 
  placeholder, 
  onAddCustom 
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  disabledOptions?: string[];
  placeholder: string;
  onAddCustom?: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options?.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = options?.find(opt => opt.toLowerCase() === search.toLowerCase());

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`w-full px-4 py-3 bg-gray-50 border ${isOpen ? 'border-[#003828] ring-2 ring-[#003828]/20' : 'border-gray-200'} rounded-xl transition-all duration-300 flex items-center justify-between cursor-text`}
        onClick={() => {
          if (!isOpen) {
            setSearch('');
            setIsOpen(true);
          }
        }}
      >
        <input
          type="text"
          className="bg-transparent border-none outline-none w-full text-gray-900 placeholder:text-gray-400 focus:ring-0 p-0"
          placeholder={placeholder}
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
        />
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(opt => {
              const isDisabled = disabledOptions.includes(opt) && opt !== value;
              return (
                <div
                  key={opt}
                  className={`px-4 py-3 cursor-pointer transition-colors ${isDisabled ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-gray-800 hover:bg-[#003828]/5'}`}
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(opt);
                      setIsOpen(false);
                    }
                  }}
                >
                  {opt} {isDisabled && <span className="text-xs ml-2 text-red-400 font-medium">(Already selected)</span>}
                </div>
              );
            })
          ) : (
             <div className="px-4 py-3 text-gray-500 text-sm">No matches found</div>
          )}

          {search.trim() !== '' && !exactMatch && onAddCustom && (
            <div
              className="px-4 py-3 cursor-pointer text-[#003828] font-medium hover:bg-[#003828]/5 border-t border-gray-100 flex items-center"
              onClick={() => {
                const newName = search.trim();
                onAddCustom(newName);
                onChange(newName);
                setIsOpen(false);
              }}
            >
              <span className="bg-[#003828] text-white text-xs px-2 py-1 rounded mr-2 font-bold">ADD</span>
              {search.trim()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ElectionPage() {
  const { t } = useLanguage();
  const [allMembers, setAllMembers] = useState(INITIAL_MEMBERS);
  
  const [formData, setFormData] = useState({
    voterName: '',
    president: '',
    vicePresident: '',
    generalSecretary: '',
    jointSecretary: '',
    treasurer: '',
    executiveMember1: '',
    executiveMember2: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddMember = (newName: string) => {
    if (!allMembers.includes(newName)) {
      setAllMembers([...allMembers, newName].sort((a, b) => a.localeCompare(b)));
    }
  };

  const getDisabledOptions = (currentFieldId: string) => {
    // Collect all selected nominees from OTHER positions to disable them
    return POSITIONS
      .filter(p => p.id !== currentFieldId)
      .map(p => formData[p.id as keyof typeof formData])
      .filter(val => val !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.voterName) {
      setErrorMessage("Please select or enter your Voter Name.");
      setStatus('error');
      return;
    }
    const missingPositions = POSITIONS.filter(p => !formData[p.id as keyof typeof formData]);
    if (missingPositions.length > 0) {
      setErrorMessage("Please select a nominee for all positions.");
      setStatus('error');
      return;
    }
    
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/election', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setStatus('success');
        setFormData({
          voterName: '',
          president: '',
          vicePresident: '',
          generalSecretary: '',
          jointSecretary: '',
          treasurer: '',
          executiveMember1: '',
          executiveMember2: ''
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(errData.error || 'Failed to submit vote.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-[#003828] mb-4">Elections 2026</h1>
          <p className="text-lg text-gray-600">Cast your vote for the board members.</p>
        </div>

        <div className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100">
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#003828]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#003828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Vote Submitted Successfully!</h3>
              <p className="text-gray-600 mb-6">Your vote has been securely recorded.</p>
              <button 
                onClick={() => setStatus('idle')}
                className="bg-[#003828] text-white border border-[#003828] px-6 py-2 rounded-full font-medium hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all cursor-pointer shadow-sm"
              >
                Submit Another Vote
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8 shadow-sm">
                <label className="block text-sm font-bold text-[#003828] mb-2 uppercase tracking-wide">
                  Your Name (Voter)
                </label>
                <CustomSelect
                  value={formData.voterName}
                  onChange={(val) => setFormData(prev => ({ ...prev, voterName: val }))}
                  options={allMembers}
                  placeholder="Select or type your name"
                  onAddCustom={handleAddMember}
                />
              </div>

              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Cast Your Votes</h3>

              {POSITIONS.map((pos) => (
                <div key={pos.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {pos.label}
                  </label>
                  <CustomSelect
                    value={formData[pos.id as keyof typeof formData]}
                    onChange={(val) => setFormData(prev => ({ ...prev, [pos.id]: val }))}
                    options={allMembers}
                    disabledOptions={getDisabledOptions(pos.id)}
                    placeholder="Select or add a nominee"
                    onAddCustom={handleAddMember}
                  />
                </div>
              ))}

              {status === 'error' && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-[#003828] text-white border border-[#003828] font-bold py-4 px-8 rounded-full hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4 text-lg cursor-pointer"
              >
                {status === 'submitting' ? 'Submitting Votes...' : 'Submit Votes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
