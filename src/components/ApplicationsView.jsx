import React, { useState, useMemo } from 'react';
import { Mail, Phone, Check, X, Search, FileText, Globe, HeartHandshake, Briefcase, ExternalLink, Calendar, MapPin, Building, Award, User } from 'lucide-react';
import { ActionMenu } from './SharedComponents';
import DraggableModal from './DraggableModal';

export default function ApplicationsView({ applications = [], setApplications, showToast, addLog }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'Pending').length,
      approved: applications.filter(a => a.status === 'Approved').length,
      rejected: applications.filter(a => a.status === 'Rejected').length,
      volunteers: applications.filter(a => a.type === 'volunteer').length,
      ambassadors: applications.filter(a => a.type === 'ambassador').length,
      partners: applications.filter(a => a.type === 'partner').length,
    };
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = 
        (app.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (app.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.company || app.organization || app.institution || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || app.type?.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || (app.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [applications, searchTerm, typeFilter, statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    const updated = applications.map(app => app.id === id ? { ...app, status: newStatus } : app);
    setApplications(updated);
    try {
      localStorage.setItem('ain_applications', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {}

    if (showToast) showToast(`Application marked as ${newStatus}`, 'success');
    if (addLog) addLog(`Updated application ${id} status to ${newStatus}`);
  };

  const getTypeIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'volunteer':
        return <HeartHandshake size={14} className="text-emerald-700" />;
      case 'ambassador':
        return <Globe size={14} className="text-amber-700" />;
      case 'partner':
        return <Briefcase size={14} className="text-sky-700" />;
      default:
        return <User size={14} className="text-stone-600" />;
    }
  };

  const getTypeBadgeStyle = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'volunteer':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'ambassador':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'partner':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-2">
            Applications
          </h1>
          <p className="text-stone-500 text-base mt-2 font-medium">
            Review and manage incoming submissions from Volunteers, Ambassadors, and Partners in real time.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
          <input 
            type="text"
            placeholder="Search by applicant name, organization, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm shadow-2xs"
          />
        </div>

        {/* Type Filter */}
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by Application Type"
          className="px-3 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#003828] shadow-2xs"
        >
          <option value="all">All Roles ({stats.total})</option>
          <option value="volunteer">Volunteers ({stats.volunteers})</option>
          <option value="ambassador">Ambassadors ({stats.ambassadors})</option>
          <option value="partner">Partners ({stats.partners})</option>
        </select>

        {/* Status Filter */}
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by Application Status"
          className="px-3 py-2.5 bg-white border border-stone-200/80 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#003828] shadow-2xs"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          {filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-1">No Applications Found</h3>
              <p className="text-stone-500 font-medium text-sm max-w-sm">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No applications match your active filters. Try clearing your search.' 
                  : 'New volunteer, ambassador, and partner applications will appear here as soon as they are submitted.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 border-b border-stone-100 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Applicant / Organization</th>
                  <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Alliance Role</th>
                  <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Key Focus / Target</th>
                  <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap">Submission Date</th>
                  <th className="px-6 py-4 font-semibold text-stone-400 text-xs uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredApps.map(app => {
                  const displayOrg = app.organization || app.company || app.institution;
                  const keyFocus = app.volunteer_target || app.partnership_type || app.department || app.area_of_interest || 'General Alliance';

                  return (
                    <tr 
                      key={app.id} 
                      className="hover:bg-stone-50/70 transition-colors group cursor-pointer" 
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-stone-900 text-sm">{app.name}</div>
                        <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                          <span>{app.email}</span>
                          {displayOrg && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-stone-700">{displayOrg}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeBadgeStyle(app.type)}`}>
                          {getTypeIcon(app.type)}
                          <span className="capitalize">{app.type}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-stone-700 max-w-xs truncate">
                        {keyFocus}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          app.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          app.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {app.status === 'Approved' && <Check size={12} />}
                          {app.status === 'Rejected' && <X size={12} />}
                          {app.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500 whitespace-nowrap">
                        {app.date ? new Date(app.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu 
                          items={[
                            { label: 'View Details', icon: FileText, onClick: () => setSelectedApp(app) },
                            { label: 'Approve', icon: Check, onClick: () => handleUpdateStatus(app.id, 'Approved'), className: 'text-emerald-600' },
                            { label: 'Reject', icon: X, onClick: () => handleUpdateStatus(app.id, 'Rejected'), className: 'text-rose-600' }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedApp(null)}>
          <DraggableModal className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 pointer-events-auto border border-stone-100" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-stone-100 drag-handle cursor-grab shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#003828]/10 text-[#003828] flex items-center justify-center font-bold text-xl uppercase">
                  {selectedApp.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-stone-900">{selectedApp.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTypeBadgeStyle(selectedApp.type)}`}>
                      {getTypeIcon(selectedApp.type)}
                      <span className="capitalize">{selectedApp.type} Application</span>
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                    <Calendar size={13} />
                    Submitted on {new Date(selectedApp.date || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedApp(null)} 
                className="p-2 text-stone-400 hover:text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1 min-h-0 text-sm">
              {/* Contact Information Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <Mail size={16} className="text-[#003828]" />
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Email Address</span>
                    <a href={`mailto:${selectedApp.email}`} className="font-semibold text-stone-800 hover:text-[#003828] transition-colors">{selectedApp.email}</a>
                  </div>
                </div>
                {selectedApp.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={16} className="text-[#003828]" />
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Phone / WhatsApp</span>
                      <span className="font-semibold text-stone-800">{selectedApp.phone}</span>
                    </div>
                  </div>
                )}
                {(selectedApp.city || selectedApp.country) && (
                  <div className="flex items-center gap-2.5">
                    <MapPin size={16} className="text-[#003828]" />
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Location</span>
                      <span className="font-semibold text-stone-800">
                        {[selectedApp.city, selectedApp.country].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </div>
                )}
                {selectedApp.status && (
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Current Status</span>
                    <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      selectedApp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      selectedApp.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {selectedApp.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Specific Fields by Type */}
              {/* PARTNER APPLICATION SPECIFIC FIELDS */}
              {selectedApp.type === 'partner' && (
                <div className="space-y-3 p-4 bg-sky-50/50 rounded-2xl border border-sky-100">
                  <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase size={14} /> Partnership Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-stone-500 font-medium block">Organization / Company</span>
                      <div className="font-bold text-stone-900">{selectedApp.organization || selectedApp.company || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-500 font-medium block">Contact Designation</span>
                      <div className="font-semibold text-stone-900">{selectedApp.designation || 'Representative'}</div>
                    </div>
                    {selectedApp.partnership_type && (
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Partnership Category</span>
                        <div className="font-semibold text-sky-800">{selectedApp.partnership_type}</div>
                      </div>
                    )}
                    {selectedApp.website && (
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Official Website</span>
                        <a href={selectedApp.website} target="_blank" rel="noreferrer" className="font-semibold text-[#003828] hover:underline inline-flex items-center gap-1">
                          {selectedApp.website} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                  {selectedApp.timeline_or_goals && (
                    <div className="pt-2 border-t border-sky-100">
                      <span className="text-[11px] text-stone-500 font-medium block">Target Timeline / Goals</span>
                      <div className="font-medium text-stone-800 mt-1">{selectedApp.timeline_or_goals}</div>
                    </div>
                  )}
                </div>
              )}

              {/* AMBASSADOR APPLICATION SPECIFIC FIELDS */}
              {selectedApp.type === 'ambassador' && (
                <div className="space-y-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={14} /> Campus & Outreach Profile
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-stone-500 font-medium block">University / Institution</span>
                      <div className="font-bold text-stone-900">{selectedApp.institution || selectedApp.company || 'N/A'}</div>
                    </div>
                    {selectedApp.department && (
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Department / Major</span>
                        <div className="font-semibold text-stone-900">{selectedApp.department}</div>
                      </div>
                    )}
                    {selectedApp.current_status && (
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Academic Status</span>
                        <div className="font-semibold text-stone-800">{selectedApp.current_status}</div>
                      </div>
                    )}
                    {selectedApp.social && (
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Social Media / LinkedIn</span>
                        <a href={selectedApp.social} target="_blank" rel="noreferrer" className="font-semibold text-[#003828] hover:underline inline-flex items-center gap-1">
                          {selectedApp.social} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                  {selectedApp.experience && (
                    <div className="pt-2 border-t border-amber-100">
                      <span className="text-[11px] text-stone-500 font-medium block">Leadership & Volunteering Experience</span>
                      <div className="font-medium text-stone-800 mt-1">{selectedApp.experience}</div>
                    </div>
                  )}
                </div>
              )}

              {/* VOLUNTEER APPLICATION SPECIFIC FIELDS */}
              {selectedApp.type === 'volunteer' && (
                <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartHandshake size={14} /> Volunteer Service Profile
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-stone-500 font-medium block">Volunteering With</span>
                      <div className="font-bold text-[#003828]">{selectedApp.volunteer_target || 'ESPA Foundation'}</div>
                    </div>
                    {selectedApp.library_role && (
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Digital Library Position</span>
                        <div className="font-semibold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200 inline-block">
                          {selectedApp.library_role}
                        </div>
                      </div>
                    )}
                    {selectedApp.area_of_interest && (
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Area of Interest</span>
                        <div className="font-medium text-stone-800">{selectedApp.area_of_interest}</div>
                      </div>
                    )}
                    {selectedApp.availability && (
                      <div>
                        <span className="text-[11px] text-stone-500 font-medium block">Availability</span>
                        <div className="font-medium text-stone-800">{selectedApp.availability}</div>
                      </div>
                    )}
                  </div>
                  {selectedApp.languages && (
                    <div className="pt-2 border-t border-emerald-100">
                      <span className="text-[11px] text-stone-500 font-medium block mb-1">Languages Spoken</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(selectedApp.languages) ? selectedApp.languages : [selectedApp.languages]).map((lang, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 bg-white text-emerald-900 rounded-full text-xs font-semibold border border-emerald-200">
                            {typeof lang === 'object' && lang !== null ? `${lang.language} (${lang.fluency})` : lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedApp.skills && (
                    <div className="pt-2 border-t border-emerald-100">
                      <span className="text-[11px] text-stone-500 font-medium block">Special Skills & Expertise</span>
                      <div className="font-medium text-stone-800 mt-1">{selectedApp.skills}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Motivation / Proposal / Message Box */}
              {(selectedApp.message || selectedApp.motivation || selectedApp.proposal) && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                    {selectedApp.type === 'partner' ? 'Partnership Proposal' : 'Motivation & Statement of Interest'}
                  </span>
                  <p className="text-stone-700 whitespace-pre-wrap leading-relaxed text-sm bg-white p-3 rounded-xl border border-stone-200/60">
                    {selectedApp.message || selectedApp.motivation || selectedApp.proposal}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-5 mt-5 border-t border-stone-100 flex gap-3 shrink-0">
              <button 
                onClick={() => { handleUpdateStatus(selectedApp.id, 'Approved'); setSelectedApp(null); }} 
                className="flex-1 bg-[#003828] text-white py-2.5 rounded-full font-semibold border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Check size={16} /> Approve Application
              </button>
              <button 
                onClick={() => { handleUpdateStatus(selectedApp.id, 'Rejected'); setSelectedApp(null); }} 
                className="flex-1 bg-rose-50 text-rose-700 py-2.5 rounded-full font-semibold hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <X size={16} /> Reject Application
              </button>
            </div>
          </DraggableModal>
        </div>
      )}
    </div>
  );
}
