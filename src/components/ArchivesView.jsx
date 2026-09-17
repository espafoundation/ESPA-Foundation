import React, { useState } from 'react';
import { Archive, RefreshCcw } from 'lucide-react';

export default function ArchivesView({ 
  archivedHosts, setArchivedHosts, setHosts, hosts,
  archivedUsers, setArchivedUsers, setUsers, users,
  archivedBatches, setArchivedBatches, setBatches, batches,
  archivedRooms, setArchivedRooms, setRooms, rooms,
  showToast, addLog, setActiveTab 
}) {
  const handleRestore = (item, type) => {
    switch(type) {
      case 'user':
        setArchivedUsers(archivedUsers.filter(u => u.id !== item.id));
        setUsers([...users, { ...item, active: true }]);
        addLog(`Restored user ${item.name}`);
        showToast('User restored successfully', 'success');
        break;
      case 'host':
        setArchivedHosts(archivedHosts.filter(h => h.id !== item.id));
        setHosts([...hosts, { ...item, active: true }]);
        addLog(`Restored host ${item.name}`);
        showToast('Host restored successfully', 'success');
        break;
      // Implement others if needed
    }
  };

  return (
    <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('settings')} className="p-2 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-full transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-black flex items-center gap-2">System Archives</h1>
            <p className="text-stone-500 text-base mt-2 font-medium">Restore previously archived data.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex-1 overflow-auto">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-lg font-bold text-stone-800">Archived Users</h2>
        </div>
        {(!archivedUsers || archivedUsers.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Archives Found</h3>
              <p className="text-stone-500 font-medium">There are currently no items to display in this section.</p>
            </div>
          ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-100 text-stone-400 text-xs tracking-wider bg-stone-50/50">
              <th className="px-6 py-4 font-medium uppercase">Name</th>
              <th className="px-6 py-4 font-medium uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {(archivedUsers || []).map(user => (
              <tr key={user.id} className="hover:bg-stone-50">
                <td className="px-6 py-4 text-sm font-semibold text-stone-900">{user.name} <span className="text-stone-500 font-medium">({user.email})</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleRestore(user, 'user')} className="text-stone-900 hover:text-[#004B36] text-sm font-semibold inline-flex items-center gap-1">
                    <RefreshCcw size={14} /> Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
