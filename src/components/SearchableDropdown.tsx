import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  id?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  disabledMessage?: string;
  error?: string;
  onBlur?: () => void;
  allowCustomOption?: boolean;
  customOptionLabel?: string;
}

export default function SearchableDropdown({
  id,
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
  disabledMessage = 'Disabled',
  error,
  onBlur,
  allowCustomOption = false,
  customOptionLabel = 'Other / Not Listed'
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const safeOptions = useMemo(() => Array.isArray(options) ? options : [], [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return safeOptions.find(opt => opt && opt.value === value);
  }, [safeOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const cleanQuery = (searchQuery || '').toLowerCase().trim();
    if (!cleanQuery) return safeOptions;
    return safeOptions.filter(opt => 
      opt && (
        (opt.label || '').toLowerCase().includes(cleanQuery) || 
        (opt.sublabel && opt.sublabel.toLowerCase().includes(cleanQuery)) ||
        (opt.value || '').toLowerCase().includes(cleanQuery)
      )
    );
  }, [safeOptions, searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          setSearchQuery('');
          if (onBlur) onBlur();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onBlur]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
    if (onBlur) onBlur();
  };

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen && onBlur) {
      onBlur();
    }
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
      if (onBlur) onBlur();
    }
  };

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-4 py-3.5 bg-white border rounded-xl text-left text-sm font-medium transition-all shadow-xs flex items-center justify-between gap-2 ${
          disabled
            ? 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed'
            : error
            ? 'border-red-500 ring-1 ring-red-500 text-stone-900 cursor-pointer'
            : isOpen
            ? 'border-[#003828] ring-1 ring-[#003828] text-stone-900 cursor-pointer'
            : 'border-stone-200 hover:border-stone-300 text-stone-900 cursor-pointer'
        }`}
      >
        <span className={`truncate ${!selectedOption && !value ? 'text-stone-400' : 'text-stone-900'}`}>
          {disabled 
            ? (disabledMessage || placeholder) 
            : (selectedOption ? selectedOption.label : (value || placeholder))}
        </span>
        <ChevronDown 
          size={18} 
          className={`shrink-0 text-stone-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#003828]' : ''
          }`} 
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && !disabled && (
        <div 
          className="absolute z-50 w-full mt-1.5 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
          style={{ minWidth: '240px' }}
        >
          {/* Search Input Bar */}
          <div className="p-2.5 border-b border-stone-100 bg-stone-50/70">
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-stone-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-lg text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-stone-400 hover:text-stone-600 p-0.5"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div 
            className="max-h-60 overflow-y-auto divide-y divide-stone-50 p-1"
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#003828]/10 text-[#003828] font-semibold'
                        : 'text-stone-700 hover:bg-[#003828]/5 hover:text-[#003828]'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check size={16} className="text-[#003828] shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-stone-500 mb-2">
                  No matching results found for "{searchQuery}".
                </p>
                {allowCustomOption && (
                  <button
                    type="button"
                    onClick={() => handleSelect('Other / Not Listed')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003828] text-white text-xs font-semibold border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors cursor-pointer"
                  >
                    Select "{customOptionLabel}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
