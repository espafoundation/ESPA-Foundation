import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Save, Edit, X, Calendar, Clock, MapPin, Download, MoreVertical, Plus, PlaneLanding, PlaneTakeoff, Trash2, Bus, Train, Car, Plane } from 'lucide-react';
import DraggableModal from '../components/DraggableModal';
import { ActionMenu, ConfirmModal } from '../components/SharedComponents';
import { countries } from '../countries';
import FlightDetailsForm from '../components/FlightDetailsForm';

export default function ItineraryView({ users, setUsers, globalUsers, showToast, addLog, currentUser }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredUsers.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  
  const handleMassArchive = () => {
    if (selectedIds.length === 0) return;
    const clearedUsers = users.map(u => {
      if (selectedIds.includes(u.id)) {
        return {
          ...u,
          arrivalFromCountry: '', arrivalFromCity: '', arrivalFromAirportCode: '', arrivalFromDate: '', arrivalFromTime: '', arrivalDate: '', arrivalTime: '', arrivalCountry: '', arrivalCity: '', arrivalAirportCode: '', arrivalFlight: '', arrivalConnectingFlights: [],
          departureCountry: '', departureCity: '', departureAirportCode: '', departureDate: '', departureTime: '', departureFlight: '', departureToCountry: '', departureToCity: '', departureToAirportCode: '', departureToDate: '', departureToTime: '', departureConnectingFlights: []
        };
      }
      return u;
    });
    
    setUsers(clearedUsers);
    addLog(`Archived itinerary for ${selectedIds.length} users`);
    showToast(`Archived itinerary for ${selectedIds.length} users successfully`, 'success');
    setSelectedIds([]);
  };

  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  
  if (!['Admin', 'In-Country Coordinator', 'Deputy Lead Coordinator'].includes(currentUser?.role)) {
    return <div className="p-8 text-center text-stone-500">Access Denied</div>;
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (user) => {
    setEditingUser({ 
      ...user, 
      arrivalFromCountry: user.arrivalFromCountry || '',
      arrivalFromCity: user.arrivalFromCity || '',
      arrivalFromAirportCode: user.arrivalFromAirportCode || '',
      arrivalFromDate: user.arrivalFromDate || '',
      arrivalFromTime: user.arrivalFromTime || '',
      arrivalDate: user.arrivalDate || '', 
      arrivalTime: user.arrivalTime || '', 
      arrivalCountry: user.arrivalCountry || '',
      arrivalCity: user.arrivalCity || '',
      arrivalAirportCode: user.arrivalAirportCode || '',
      arrivalFlight: user.arrivalFlight || '',
      arrivalConnectingFlights: user.arrivalConnectingFlights || [],
      departureCountry: user.departureCountry || '',
      departureCity: user.departureCity || '',
      departureAirportCode: user.departureAirportCode || '',
      departureDate: user.departureDate || '', 
      departureTime: user.departureTime || '',
      departureFlight: user.departureFlight || '',
      departureToCountry: user.departureToCountry || '',
      departureToCity: user.departureToCity || '',
      departureToAirportCode: user.departureToAirportCode || '',
      departureToDate: user.departureToDate || '',
      departureToTime: user.departureToTime || '',
      departureConnectingFlights: user.departureConnectingFlights || []
    });
  };

  const handleSaveClick = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Save Changes',
      message: 'Are you sure you want to save changes to this itinerary?',
      onConfirm: () => {
        handleSave();
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleCancelClick = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Edits',
      message: 'Are you sure you want to cancel? Any unsaved changes will be lost.',
      onConfirm: () => {
        setEditingUser(null);
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleSave = () => {
    if (!editingUser) return;
    const newGlobalUsers = globalUsers.map(u => u.id === editingUser.id ? editingUser : u);
    setUsers(newGlobalUsers);
    
    addLog(`Updated itinerary for user ${editingUser.name}`, currentUser.name);
    showToast(`Itinerary updated for ${editingUser.name}`, 'success');
    setEditingUser(null);
  };

  return (
    <div className="space-y-8 h-full flex flex-col tracking-tight relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Itinerary</h1>
          <p className="text-stone-500 text-sm mt-2 font-medium">Manage Comprehensive Travel Timeline, Including Arrivals and Departures of All Participants.</p>
        </div>
        {selectedIds.length > 0 && (
          <button onClick={handleMassArchive} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm">
            <Trash2 size={18} /> Archive Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#003828]" size={18} strokeWidth={1.5} />
        <input 
          type="text" 
          placeholder="Search Participants by Name or Email..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm shadow-sm"
        />
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden">
        <div className="w-full overflow-x-auto pb-16">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs tracking-wider bg-stone-50/50 rounded-t-2xl">
                
                <th className="pl-12 pr-6 py-5 font-medium uppercase w-[25%]">Name</th>
                <th className="px-6 py-5 font-medium uppercase w-[25%]">Arrival</th>
                <th className="px-6 py-5 font-medium uppercase w-[25%]">Departure</th>
                <th className="px-6 py-5 pr-12 font-medium uppercase text-center w-[25%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-sm text-stone-500">No Data Available.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[#FDFCFB] transition-colors group">
                    <td className="pl-12 pr-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div>
                          <button onClick={() => setViewingUser(user)} className="text-stone-900 font-medium text-sm hover:text-[#003828] focus:outline-none transition-colors text-left">
                            {user.name}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      {user.arrivalDate ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-stone-900">
                          <Calendar size={14} className="text-stone-400" />
                          <span>{user.arrivalDate}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Not Specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      {user.departureDate ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-stone-900">
                          <Calendar size={14} className="text-stone-400" />
                          <span>{user.departureDate}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Not Specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 pr-12 align-middle text-center">
                      <ActionMenu id={user.id} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}>
                        <button onClick={() => { setActiveDropdown(null); handleEditClick(user); }} className="w-full text-left px-4 py-2.5 text-sm text-stone-900 hover:bg-stone-50 font-medium flex items-center gap-2">
                           <Edit size={16} className="text-[#003828]"/> Edit Itinerary
                        </button>
                      </ActionMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingUser && createPortal(
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[200] animate-in fade-in flex items-center justify-center p-4" onClick={() => setViewingUser(null)}>
          <DraggableModal className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-3 drag-handle cursor-grab active:cursor-grabbing touch-none shrink-0">
               <MapPin className="text-[#003828] pointer-events-none" size={24} /> <span className="pointer-events-none font-medium">Itinerary Details: {viewingUser.name}</span>
            </h3>
            <div className="space-y-8 flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
              <div className="space-y-4">
                <div className="border-l-2 border-[#003828] pl-3">
                  <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider">Arrival Details (Inbound)</h4>
                </div>
                {viewingUser.arrivalDate || viewingUser.arrivalFromCountry || viewingUser.arrivalCountry ? (
                  <div className="bg-stone-50/50 p-5 rounded-xl border border-stone-100 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between relative">
                      <div className="flex-1">
                        <span className="block text-[10px] font-medium text-stone-500 uppercase tracking-wider mb-1">From</span>
                        <div className="text-sm font-medium text-stone-900 flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 font-medium"><MapPin size={14} className="text-[#003828]" /> {viewingUser.arrivalFromCity || '-'}, {viewingUser.arrivalFromCountry || '-'} {viewingUser.arrivalFromAirportCode && <span className="text-stone-400 font-medium">({viewingUser.arrivalFromAirportCode})</span>}</span>
                          <span className="flex items-center gap-3 text-stone-500 text-xs font-medium">
                            <span className="flex items-center gap-1 font-medium"><Calendar size={12} /> {viewingUser.arrivalFromDate || '-'}</span>
                            <span className="flex items-center gap-1 font-medium"><Clock size={12} /> {viewingUser.arrivalFromTime || '-'}</span>
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-center px-4">
                        <PlaneLanding className="text-[#003828] mb-1" size={20} />
                        <div className="w-16 h-px bg-stone-300"></div>
                        <span className="text-[10px] font-medium text-stone-500 uppercase mt-1">{viewingUser.arrivalFlight || '-'}</span>
                      </div>
                      <div className="flex-1 sm:text-right">
                        <span className="block text-[10px] font-medium text-stone-500 uppercase tracking-wider mb-1">To</span>
                        <div className="text-sm font-medium text-stone-900 flex flex-col gap-1 sm:items-end">
                          <span className="flex items-center gap-1.5 justify-end font-medium"><MapPin size={14} className="text-[#003828]" /> {viewingUser.arrivalCity || '-'}, {viewingUser.arrivalCountry || '-'} {viewingUser.arrivalAirportCode && <span className="text-stone-400 font-medium">({viewingUser.arrivalAirportCode})</span>}</span>
                          <span className="flex items-center gap-3 text-stone-500 text-xs justify-end font-medium">
                            <span className="flex items-center gap-1 font-medium"><Calendar size={12} /> {viewingUser.arrivalDate || '-'}</span>
                            <span className="flex items-center gap-1 font-medium"><Clock size={12} /> {viewingUser.arrivalTime || '-'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                   <div className="text-sm italic text-stone-400">No Data Available.</div>
                )}
              </div>

              <div className="space-y-4">
                <div className="border-l-2 border-[#003828] pl-3">
                  <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider">Departure Details (Outbound)</h4>
                </div>
                {viewingUser.departureDate || viewingUser.departureCountry || viewingUser.departureToCountry ? (
                  <div className="bg-stone-50/50 p-5 rounded-xl border border-stone-100 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between relative">
                      <div className="flex-1">
                        <span className="block text-[10px] font-medium text-stone-500 uppercase tracking-wider mb-1">From</span>
                        <div className="text-sm font-medium text-stone-900 flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 font-medium"><MapPin size={14} className="text-[#003828]" /> {viewingUser.departureCity || '-'}, {viewingUser.departureCountry || '-'} {viewingUser.departureAirportCode && <span className="text-stone-400 font-medium">({viewingUser.departureAirportCode})</span>}</span>
                          <span className="flex items-center gap-3 text-stone-500 text-xs font-medium">
                            <span className="flex items-center gap-1 font-medium"><Calendar size={12} /> {viewingUser.departureDate || '-'}</span>
                            <span className="flex items-center gap-1 font-medium"><Clock size={12} /> {viewingUser.departureTime || '-'}</span>
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-center px-4">
                        <PlaneTakeoff className="text-[#003828] mb-1" size={20} />
                        <div className="w-16 h-px bg-stone-300"></div>
                        <span className="text-[10px] font-medium text-stone-500 uppercase mt-1">{viewingUser.departureFlight || '-'}</span>
                      </div>
                      <div className="flex-1 sm:text-right">
                        <span className="block text-[10px] font-medium text-stone-500 uppercase tracking-wider mb-1">To</span>
                        <div className="text-sm font-medium text-stone-900 flex flex-col gap-1 sm:items-end">
                          <span className="flex items-center gap-1.5 justify-end font-medium"><MapPin size={14} className="text-[#003828]" /> {viewingUser.departureToCity || '-'}, {viewingUser.departureToCountry || '-'} {viewingUser.departureToAirportCode && <span className="text-stone-400 font-medium">({viewingUser.departureToAirportCode})</span>}</span>
                          <span className="flex items-center gap-3 text-stone-500 text-xs justify-end font-medium">
                            <span className="flex items-center gap-1 font-medium"><Calendar size={12} /> {viewingUser.departureToDate || '-'}</span>
                            <span className="flex items-center gap-1 font-medium"><Clock size={12} /> {viewingUser.departureToTime || '-'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                   <div className="text-sm italic text-stone-400">No Data Available.</div>
                )}
              </div>
            </div>
            <button type="button" onClick={() => setViewingUser(null)} className="mt-8 w-full py-3 bg-[#003828] text-[#FDFCFB] border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] shadow-sm font-bold rounded-xl transition-colors shrink-0">Close</button>
          </DraggableModal>
        </div>,
        document.body
      )}

      {editingUser && createPortal(
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[200] animate-in fade-in flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
          <DraggableModal className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-stone-900 mb-6 border-b border-stone-100 pb-4 flex items-center gap-3 drag-handle cursor-grab active:cursor-grabbing touch-none shrink-0">
               <MapPin className="text-[#003828] pointer-events-none" size={24} /> <span className="pointer-events-none font-medium">Edit Itinerary: {editingUser.name}</span>
            </h3>
            <div className="space-y-6 flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
              <div className="space-y-6">
                <FlightDetailsForm title="Inbound" flightType="arrival" state={editingUser} setState={setEditingUser} />
                <FlightDetailsForm title="Outbound" flightType="departure" state={editingUser} setState={setEditingUser} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex justify-end gap-3 mt-4">
              <button 
                onClick={handleCancelClick} 
                className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-200/50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveClick} 
                className="px-4 py-2 text-sm font-semibold bg-[#003828] text-white border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </DraggableModal>
        </div>,
        document.body
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        onConfirm={confirmModal.onConfirm} 
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })} 
      />
    </div>
  );
}
