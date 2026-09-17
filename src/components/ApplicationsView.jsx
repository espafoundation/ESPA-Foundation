import React, { useState } from 'react';
import { Mail, Check, X, Search, FileText } from 'lucide-react';
import { ActionMenu } from './SharedComponents';
import DraggableModal from './DraggableModal';

export default function ApplicationsView({ applications = [], setApplications, showToast, addLog }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const filteredApps = applications.filter(app => 
    (app.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (app.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (app.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateStatus = (id, newStatus) => {
    setApplications(applications.map(app => app.id === id ? { ...app, status: newStatus } : app));
    showToast(`Application marked as ${newStatus}`, 'success');
    addLog(`Updated application ${id} status to ${newStatus}`);
  };

  return (
    <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-2">Applications</h1>
          <p className="text-stone-500 text-base mt-2 font-medium">Review submissions from Volunteers, Ambassadors, and Partners.</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
        <input 
          type="text"
          placeholder="Search by name, email, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          {filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Applications Found</h3>
              <p className="text-stone-500 font-medium">There are currently no items to display in this section.</p>
            </div>
          ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 border-b border-stone-100 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Applicant Details</th>
                <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Role / Type</th>
                <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredApps.map(app => (
                <tr key={app.id} className="hover:bg-stone-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedApp(app)}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-stone-900">{app.name}</div>
                    <div className="text-sm text-stone-500">{app.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 capitalize">
                      {app.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      app.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {app.status === 'Approved' && <Check size={12} />}
                      {app.status === 'Rejected' && <X size={12} />}
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600 whitespace-nowrap">
                    {new Date(app.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionMenu 
                      items={[
                        { label: 'View Details', icon: FileText, onClick: () => setSelectedApp(app) },
                        { label: 'Approve', icon: Check, onClick: () => handleUpdateStatus(app.id, 'Approved'), className: 'text-emerald-600' },
                        { label: 'Reject', icon: X, onClick: () => handleUpdateStatus(app.id, 'Rejected'), className: 'text-rose-600' }
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedApp(null)}>
          <DraggableModal className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-stone-100 drag-handle cursor-grab shrink-0">
              <div>
                <h3 className="text-xl font-bold text-stone-900 capitalize">{selectedApp.type} Application</h3>
                <p className="text-sm text-stone-500 mt-1">Submitted on {new Date(selectedApp.date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 text-stone-400 hover:text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-2 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">Name</span>
                  <div className="font-medium text-stone-900">{selectedApp.name}</div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">Email</span>
                  <div className="font-medium text-stone-900">{selectedApp.email}</div>
                </div>
              </div>

              {selectedApp.phone && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">Phone</span>
                  <div className="font-medium text-stone-900">{selectedApp.phone}</div>
                </div>
              )}

              {selectedApp.area_of_interest && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">Area of Interest</span>
                  <div className="text-stone-800">{selectedApp.area_of_interest}</div>
                </div>
              )}

              {selectedApp.availability && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">Availability</span>
                  <div className="text-stone-800">{selectedApp.availability}</div>
                </div>
              )}

              {selectedApp.message && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">Message / Cover Letter</span>
                  <div className="text-stone-800 p-3 bg-stone-50 rounded-xl whitespace-pre-wrap text-sm">{selectedApp.message}</div>
                </div>
              )}

              {selectedApp.company && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">Company</span>
                  <div className="text-stone-800">{selectedApp.company}</div>
                </div>
              )}

              {selectedApp.website && (
                <div>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">Website</span>
                  <div className="text-stone-800"><a href={selectedApp.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{selectedApp.website}</a></div>
                </div>
              )}

            </div>
            <div className="pt-6 mt-6 border-t border-stone-100 flex gap-3 shrink-0">
               <button onClick={() => { handleUpdateStatus(selectedApp.id, 'Approved'); setSelectedApp(null); }} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-full font-semibold hover:bg-emerald-700 transition-colors">Approve</button>
               <button onClick={() => { handleUpdateStatus(selectedApp.id, 'Rejected'); setSelectedApp(null); }} className="flex-1 bg-rose-50 text-rose-700 py-2.5 rounded-full font-semibold hover:bg-rose-100 transition-colors">Reject</button>
            </div>
          </DraggableModal>
        </div>
      )}
    </div>
  );
}
