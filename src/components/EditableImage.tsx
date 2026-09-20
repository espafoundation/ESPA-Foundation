import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { Edit2, Check, X } from 'lucide-react';
import { logEditHistory } from '../lib/history';

interface EditableImageProps {
 id: string; // Unique identifier for localStorage
 defaultSrc: string;
 alt: string;
 className?: string;
}

export default function EditableImage({ id, defaultSrc, alt, className = '' }: EditableImageProps) {
 const { user } = useAuth();
 const isAdmin = user?.role === 'admin';
 const [src, setSrc] = useState(defaultSrc);
 const [isEditing, setIsEditing] = useState(false);
 const [tempUrl, setTempUrl] = useState('');

 // Load from local storage on mount
 useEffect(() => {
 const savedImg = localStorage.getItem(`cms_img_${id}`);
 if (savedImg) {
 setSrc(savedImg);
 }
 }, [id]);

 const handleSave = () => {
 if (tempUrl.trim()) {
 setSrc(tempUrl.trim());
 localStorage.setItem(`cms_img_${id}`, tempUrl.trim());
 }
 setIsEditing(false);
 };

 const handleCancel = () => {
 setTempUrl('');
 setIsEditing(false);
 };

 const handleReset = () => {
 setSrc(defaultSrc);
 localStorage.removeItem(`cms_img_${id}`);
 logEditHistory(id, 'image', src, defaultSrc, user?.name || 'Admin');
 setIsEditing(false);
 };

 return (
 <div className={`relative group overflow-hidden ${className}`}>
 <img src={src} alt={alt} className="w-full h-full object-cover" />
 
 {isAdmin && (
 <>
 {/* Edit overlay trigger */}
 <div className="absolute inset-0 bg-[#003828]/0 group-hover:bg-[#003828]/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
 <button 
 onClick={() => { setTempUrl(src); setIsEditing(true); }}
 className="bg-white text-[#003828] p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
 title="Edit Image"
 >
 <Edit2 size={20} />
 </button>
 </div>

 {/* Edit form modal */}
 
 {isEditing && createPortal(
            <div
 className="fixed inset-0 bg-[#003828]/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
 >
 <div className="bg-white p-5 rounded-xl shadow-2xl w-full max-w-sm text-left text-base font-sans font-normal tracking-normal normal-case leading-normal" onClick={e => e.stopPropagation()}>
 <h4 className="text-xl font-bold mb-4 text-[#003828] ">Edit Image URL</h4>
 <input 
 type="text" 
 value={tempUrl}
 onChange={(e) => setTempUrl(e.target.value)}
 placeholder="https://..."
 className="w-full px-3 py-2 bg-[#003828]/5 border border-neutral-300 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003828] text-[#003828] "
 />
 <div className="flex justify-between items-center">
 <button 
 onClick={handleReset}
 className="text-xs text-red-500 hover:text-red-700 font-medium"
 >
 Reset to Default
 </button>
 <div className="flex gap-2">
 <button 
 onClick={handleCancel}
 className="p-2 text-[#003828]/60 hover:bg-[#003828]/5 :bg-[#00261B] rounded-full transition-colors"
 >
 <X size={18} />
 </button>
 <button 
 onClick={handleSave}
 className="p-2 text-white bg-[#003828] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] rounded-full transition-colors"
 >
 <Check size={18} />
 </button>
 </div>
 </div>
 </div>
 </div>,
            document.body
          )}
 
 </>
 )}
 </div>
 );
}
