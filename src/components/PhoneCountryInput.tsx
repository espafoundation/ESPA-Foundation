import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Country } from 'country-state-city';
import { ChevronDown, Search } from 'lucide-react';

export interface CountryPhoneInfo {
  name: string;
  isoCode: string;
  dialCode: string;
  flag: string;
}

// Generate country phone codes list strictly excluding Israel
export const COUNTRY_PHONE_LIST: CountryPhoneInfo[] = Country.getAllCountries()
  .filter(c => c.name.toLowerCase() !== 'israel' && c.isoCode !== 'IL' && !c.name.toLowerCase().includes('israel'))
  .map(c => ({
    name: (c.name.includes('Palestinian Territory') || c.name.includes('Palestine')) ? 'Palestine' : c.name,
    isoCode: c.isoCode,
    dialCode: c.phonecode ? (c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`) : '',
    flag: c.flag || '🌐'
  }))
  .filter(c => c.dialCode.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

interface PhoneCountryInputProps {
  id?: string;
  name?: string;
  label: string;
  phoneCode: string;
  onPhoneCodeChange: (code: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  onBlur?: () => void;
  rightAction?: React.ReactNode;
}

export default function PhoneCountryInput({
  id = 'phone-input',
  name = 'phone',
  label,
  phoneCode,
  onPhoneCodeChange,
  phoneNumber,
  onPhoneNumberChange,
  placeholder = 'Enter phone number',
  required = false,
  error,
  onBlur,
  rightAction
}: PhoneCountryInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Match currently selected country from dial code or default
  const selectedCountry = useMemo(() => {
    const cleanCode = phoneCode.startsWith('+') ? phoneCode : `+${phoneCode}`;
    return COUNTRY_PHONE_LIST.find(c => c.dialCode === cleanCode) || 
           COUNTRY_PHONE_LIST.find(c => c.isoCode === 'PK') || 
           COUNTRY_PHONE_LIST[0];
  }, [phoneCode]);

  // Filter countries by search query (name, dial code, or isoCode)
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRY_PHONE_LIST;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRY_PHONE_LIST.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.dialCode.includes(q) || 
      c.isoCode.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {rightAction}
      </div>

      <div className="relative" ref={dropdownRef}>
        <div 
          className={`flex items-stretch bg-white border rounded-xl shadow-xs transition-all ${
            error
              ? 'border-red-500 ring-1 ring-red-500'
              : 'border-stone-200 focus-within:border-[#003828] focus-within:ring-1 focus-within:ring-[#003828]'
          }`}
        >
          {/* Country Code Trigger */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3.5 py-3 bg-stone-50/70 hover:bg-stone-100 border-r border-stone-200 text-stone-800 text-sm font-semibold rounded-l-xl transition-colors cursor-pointer shrink-0"
            aria-label="Select country dial code"
            aria-expanded={isOpen}
          >
            <span className="text-base leading-none">{selectedCountry?.flag || '🌐'}</span>
            <span className="text-xs sm:text-sm text-stone-900 font-bold">{selectedCountry?.dialCode || '+92'}</span>
            <ChevronDown size={14} className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Phone Number Input */}
          <input
            id={id}
            type="tel"
            name={name}
            value={phoneNumber}
            maxLength={25}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            className="flex-1 px-4 py-3.5 bg-transparent text-stone-900 text-sm font-medium placeholder-stone-400 focus:outline-none rounded-r-xl"
          />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Search Box */}
            <div className="p-2.5 border-b border-stone-100 bg-stone-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828]"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-stone-50 text-xs">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => {
                  const isSelected = selectedCountry?.isoCode === c.isoCode && selectedCountry?.dialCode === c.dialCode;
                  return (
                    <button
                      key={`${c.isoCode}-${c.dialCode}`}
                      type="button"
                      onClick={() => {
                        onPhoneCodeChange(c.dialCode);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-[#003828]/5 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#003828]/10 font-bold text-[#003828]' : 'text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-base">{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-stone-500 shrink-0">
                        {c.dialCode}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-stone-400">
                  No country found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium animate-in fade-in slide-in-from-top-0.5">
          {error}
        </p>
      )}
    </div>
  );
}
