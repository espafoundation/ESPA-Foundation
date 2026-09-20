import React, { useState } from 'react';
import { Archive, RefreshCcw } from 'lucide-react';

export default function ArchivesView({ 
  archivedHosts, setArchivedHosts, setHosts, hosts,
  archivedUsers, setArchivedUsers, setUsers, users,
  archivedBatches, setArchivedBatches, setBatches, batches,
  archivedRooms, setArchivedRooms, setRooms, rooms,
  showToast, addLog 
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
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col tracking-tight relative">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900 flex items-center gap-2">
          <Archive className="text-[#003828]" size={28} /> Archives
        </h1>
        <p className="text-stone-500 text-sm mt-2 font-medium">Restore previously archived data.</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-lg font-bold text-stone-800">Archived Users</h2>
        </div>
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
                  <button onClick={() => handleRestore(user, 'user')} className="text-stone-900 hover:text-[#003828] text-sm font-semibold inline-flex items-center gap-1">
                    <RefreshCcw size={14} /> Restore
                  </button>
                </td>
              </tr>
            ))}
            {(!archivedUsers || archivedUsers.length === 0) && (
              <tr><td colSpan={2} className="px-6 py-8 text-center text-stone-500 text-sm">No Data Available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
