import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, X, Check, Search } from 'lucide-react';
import DraggableModal from './DraggableModal';
import { createPortal } from 'react-dom';

export const ActionMenu = ({ id, activeDropdown, setActiveDropdown, items, children }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof setActiveDropdown === 'function';
  const isOpen = isControlled ? activeDropdown === id : internalOpen;
  const menuRef = useRef(null);

  const closeMenu = () => {
    if (isControlled && typeof setActiveDropdown === 'function') {
      setActiveDropdown(null);
    } else {
      setInternalOpen(false);
    }
  };

  const toggleMenu = (e) => {
    e?.stopPropagation();
    if (isControlled && typeof setActiveDropdown === 'function') {
      setActiveDropdown(isOpen ? null : id);
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (isOpen) closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isControlled, setActiveDropdown]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        className="p-2 rounded-full hover:bg-stone-100 transition-colors focus:outline-none cursor-pointer"
      >
        <MoreVertical size={16} className="text-stone-500" />
      </button>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1 overflow-hidden">
          {items && items.length > 0 ? (
            <div className="py-1">
              {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeMenu();
                      if (typeof item.onClick === 'function') {
                        item.onClick(e);
                      }
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-stone-50 transition-colors cursor-pointer ${item.className || 'text-stone-700'}`}
                  >
                    {Icon && <Icon size={16} />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl z-10 relative animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-stone-900 mb-2">{title}</h3>
        <p className="text-stone-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`px-5 py-2.5 rounded-full font-semibold text-white transition-colors ${type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828]'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ToggleSwitch = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-[#003828]' : 'bg-stone-200'}`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export const UserLink = ({ userId, users, onUserClick }) => {
  const user = users?.find(u => u.id === userId);
  if (!user) return <span className="text-stone-500">Admin</span>;
  return (
    <button 
      onClick={() => onUserClick(user)}
      className="text-stone-900 font-semibold hover:text-stone-900 hover:text-[#003828] transition-colors"
    >
      {user.name}
    </button>
  );
};

export const DataModal = ({ isOpen, onClose, title, data, onImport, dateField, showToast }) => {
  const [importDataStr, setImportDataStr] = useState('');
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <DraggableModal className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl z-10 relative flex flex-col max-h-[90vh]">
        <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-3 drag-handle cursor-grab">
           Import Data to {title}
        </h3>
        <div className="flex-1 overflow-y-auto mb-6">
          <textarea 
            value={importDataStr}
            onChange={(e) => setImportDataStr(e.target.value)}
            placeholder="Paste JSON data here..."
            className="w-full h-64 p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003828] font-mono text-sm"
          />
        </div>
        <div className="flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200">Cancel</button>
          <button 
            onClick={() => {
              try {
                const parsed = JSON.parse(importDataStr);
                onImport(parsed);
                onClose();
              } catch(e) {
                showToast('Invalid JSON data', 'error');
              }
            }} 
            className="px-5 py-2.5 rounded-full font-semibold text-white bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828]"
          >
            Import
          </button>
        </div>
      </DraggableModal>
    </div>,
    document.body
  );
};

export const SignaturePad = ({ onSign }) => {
  return (
    <div className="mt-4 p-4 border border-stone-200 rounded-xl bg-stone-50">
      <p className="text-sm text-stone-500 mb-2">Click below to digitally sign</p>
      <button onClick={() => onSign("Signed digitally")} className="px-4 py-2 bg-[#003828] text-white rounded-full font-medium">
        Sign Agreement
      </button>
    </div>
  );
};

export const FontStyles = () => null;
