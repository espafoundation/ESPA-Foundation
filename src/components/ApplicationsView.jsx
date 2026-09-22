import React, { useState, useMemo, useEffect } from 'react';
import { 
  Mail, Phone, Check, X, Search, FileText, Globe, HeartHandshake, 
  Briefcase, ExternalLink, Calendar, MapPin, Building, Award, 
  User, ArrowLeft, Clock, 
  ChevronDown, CheckCircle2, XCircle, AlertCircle, MessageSquare,
  Eye, Edit, Copy
} from 'lucide-react';
import { ActionMenu } from './SharedComponents';

export const normalizeStatus = (raw) => {
  if (!raw) return 'Pending';
  const s = String(raw).trim().toLowerCase();
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  return 'Pending';
};

export function CopyableDetail({ 
  label, 
  value, 
  displayValue, 
  actionIcon, 
  onActionClick, 
  className = "",
  showToast
}) {
  const [copied, setCopied] = useState(false);

  if (!value || value === 'N/A' || value === 'Not specified') return null;

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const str = String(value).trim();
    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(str);
        success = true;
      }
    } catch (err) {}

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = str;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }

    setCopied(true);
    if (showToast) {
      showToast(`${label || 'Detail'} copied to clipboard!`, 'success');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={handleCopy}
      title={`Click to copy ${label || ''}`}
      className={`p-3.5 bg-stone-50 hover:bg-emerald-50/50 rounded-2xl border border-stone-200/60 hover:border-emerald-300 transition-all cursor-pointer group relative active:scale-[0.99] select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-bold text-stone-400 group-hover:text-emerald-800 uppercase tracking-wider block transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {copied ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md animate-in fade-in duration-150">
              <Check size={11} strokeWidth={2.5} />
              Copied!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-400 group-hover:text-emerald-700 opacity-60 group-hover:opacity-100 transition-opacity">
              <Copy size={11} />
              <span className="hidden sm:inline">Copy</span>
            </span>
          )}
          {actionIcon && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onActionClick) onActionClick(e);
              }}
              className="p-0.5 text-stone-400 hover:text-emerald-700 transition-colors cursor-pointer"
              title="Open link"
            >
              {actionIcon}
            </button>
          )}
        </div>
      </div>
      <div className="font-semibold text-stone-900 group-hover:text-[#003828] text-sm break-words transition-colors">
        {displayValue || value}
      </div>
    </div>
  );
}

export default function ApplicationsView({ 
  applications = [], 
  setApplications, 
  users = [], 
  setUsers, 
  showToast, 
  addLog, 
  setActiveTab,
  resetTrigger
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isProcessingStatus, setIsProcessingStatus] = useState(false);

  // Reset to applications hero page whenever navigation tab is clicked
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      setSelectedApp(null);
      if (window.location.pathname.startsWith('/portal/application/')) {
        try {
          window.history.pushState(null, '', '/portal');
        } catch (e) {}
      }
    }
  }, [resetTrigger]);

  useEffect(() => {
    const handleResetHero = () => {
      setSelectedApp(null);
      if (window.location.pathname.startsWith('/portal/application/')) {
        try {
          window.history.pushState(null, '', '/portal');
        } catch (e) {}
      }
    };
    window.addEventListener('ain_reset_applications_hero', handleResetHero);
    return () => window.removeEventListener('ain_reset_applications_hero', handleResetHero);
  }, []);

  // Sync selectedApp with URL path /portal/application/:id on mount & on popstate
  useEffect(() => {
    const checkUrlForApp = () => {
      const path = window.location.pathname;
      const match = path.match(/\/portal\/application\/([^\/]+)/);
      if (match && match[1]) {
        const id = match[1];
        setSelectedApp(prev => {
          if (prev && String(prev.id) === String(id)) return prev;
          const found = applications.find(a => String(a.id) === String(id));
          return found || prev;
        });
      }
    };

    checkUrlForApp();

    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/\/portal\/application\/([^\/]+)/);
      if (match && match[1]) {
        const id = match[1];
        setSelectedApp(prev => {
          if (prev && String(prev.id) === String(id)) return prev;
          const found = applications.find(a => String(a.id) === String(id));
          return found || prev;
        });
      } else {
        setSelectedApp(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keep selectedApp updated if applications array is modified (e.g. status change)
  useEffect(() => {
    if (selectedApp) {
      const current = applications.find(a => 
        String(a.id) === String(selectedApp.id) ||
        (selectedApp.email && a.email && selectedApp.email.toLowerCase().trim() === a.email.toLowerCase().trim() && (selectedApp.type || '').toLowerCase() === (a.type || '').toLowerCase())
      );
      if (current && current.status !== selectedApp.status) {
        const currentNorm = normalizeStatus(current.status);
        const selectedNorm = normalizeStatus(selectedApp.status);
        // Protection: Never revert an Approved or Rejected decision back to Pending!
        if (selectedNorm !== 'Pending' && currentNorm === 'Pending') {
          return;
        }
        setSelectedApp(prev => prev ? { ...prev, ...current, status: current.status } : current);
      }
    }
  }, [applications]);

  // Deduplicate applications by ID and email+type
  const uniqueApplications = useMemo(() => {
    const seenIds = new Set();
    const seenEmailType = new Set();
    const list = [];

    (applications || []).forEach(app => {
      if (!app) return;
      const idKey = app.id ? String(app.id) : null;
      const emailTypeKey = (app.email && app.type) 
        ? `${app.email.toLowerCase().trim()}_${(app.type || '').toLowerCase().trim()}`
        : null;

      if (idKey && seenIds.has(idKey)) return;
      if (emailTypeKey && seenEmailType.has(emailTypeKey)) return;

      if (idKey) seenIds.add(idKey);
      if (emailTypeKey) seenEmailType.add(emailTypeKey);
      list.push(app);
    });

    return list;
  }, [applications]);

  const filteredApps = useMemo(() => {
    return uniqueApplications.filter(app => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (app.name && app.name.toLowerCase().includes(q)) || 
        (app.email && app.email.toLowerCase().includes(q)) ||
        (app.type && app.type.toLowerCase().includes(q)) ||
        (app.organization && app.organization.toLowerCase().includes(q)) ||
        (app.company && app.company.toLowerCase().includes(q)) ||
        (app.institution && app.institution.toLowerCase().includes(q)) ||
        (app.volunteer_target && app.volunteer_target.toLowerCase().includes(q));

      return matchesSearch;
    });
  }, [uniqueApplications, searchTerm]);

  const handleOpenAppPage = (app) => {
    setSelectedApp(app);
    try {
      window.history.pushState(null, '', `/portal/application/${app.id}`);
    } catch (e) {}
  };

  const handleBackToApplications = () => {
    setSelectedApp(null);
    try {
      window.history.pushState(null, '', '/portal');
    } catch (e) {}
  };

  const handleUpdateStatus = async (id, newStatusRaw) => {
    if (isProcessingStatus) return;
    setIsProcessingStatus(true);
    const newStatus = normalizeStatus(newStatusRaw);
    const targetApp = applications.find(a => 
      String(a.id) === String(id) ||
      (selectedApp && String(selectedApp.id) === String(id))
    ) || (selectedApp && String(selectedApp.id) === String(id) ? selectedApp : null);

    const targetEmail = (targetApp?.email || selectedApp?.email || '').toLowerCase().trim();
    const targetType = ((targetApp?.type || selectedApp?.type || '')).toLowerCase().trim();

    // Optimistically update applications list across all matching records
    const updated = (applications || []).map(app => {
      const matchId = String(app.id) === String(id);
      const matchEmailType = targetEmail && app.email && 
        app.email.toLowerCase().trim() === targetEmail && 
        (!targetType || (app.type || '').toLowerCase().trim() === targetType);

      if (matchId || matchEmailType) {
        return { ...app, status: newStatus };
      }
      return app;
    });

    setApplications(updated);
    try {
      localStorage.setItem('ain_applications', JSON.stringify(updated));
    } catch (e) {}

    // Update selected app if currently viewing it
    if (selectedApp && (String(selectedApp.id) === String(id) || (targetEmail && selectedApp.email && selectedApp.email.toLowerCase().trim() === targetEmail))) {
      setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
    }

    // Sync to user directory
    if (targetApp && setUsers) {
      const type = (targetApp.type || '').toLowerCase();
      const targetRole = type === 'volunteer' ? 'Volunteer' : (type === 'ambassador' ? 'Ambassador' : (type === 'partner' ? 'Partner' : null));

      if (targetRole) {
        if (newStatus === 'Approved') {
          setUsers(prevUsers => {
            const list = Array.isArray(prevUsers) ? prevUsers : [];
            const appEmail = (targetApp.email || '').toLowerCase().trim();
            const exists = list.some(u => 
              u.applicationId === targetApp.id || 
              (appEmail && u.email && u.email.toLowerCase().trim() === appEmail && u.role === targetRole)
            );

            if (exists) {
              const updatedList = list.map(u => {
                if (u.applicationId === targetApp.id || (appEmail && u.email && u.email.toLowerCase().trim() === appEmail && u.role === targetRole)) {
                  return { ...u, active: true, status: 'Active' };
                }
                return u;
              });
              try {
                localStorage.setItem('ain_users', JSON.stringify(updatedList));
              } catch (e) {}
              return updatedList;
            }

            const prefix = type === 'volunteer' ? 'V' : (type === 'ambassador' ? 'AM' : 'PA');
            const newMember = {
              id: `${prefix}_${targetApp.id}`,
              applicationId: targetApp.id,
              name: type === 'partner' 
                ? (targetApp.organization || targetApp.company || targetApp.name || 'Partner Organization')
                : (targetApp.name || `${targetApp.first_name || ''} ${targetApp.last_name || ''}`.trim() || 'Member'),
              email: targetApp.email || '',
              phone: targetApp.phone || '',
              whatsapp: targetApp.whatsapp || '',
              photo: '',
              role: targetRole,
              username: (targetApp.email ? targetApp.email.split('@')[0] : `${type}_${targetApp.id}`),
              password: targetApp.password || 'Password123!',
              active: true,
              status: 'Active',
              dateAdded: targetApp.date || new Date().toISOString(),
              joinDate: targetApp.date ? new Date(targetApp.date).toLocaleDateString() : new Date().toLocaleDateString(),
              city: targetApp.city || '',
              country: targetApp.country || '',
              location: [targetApp.city, targetApp.country].filter(Boolean).join(', '),
              gender: targetApp.gender || '',
              dob: targetApp.dob || '',
              volunteer_target: targetApp.volunteer_target || 'ESPA Foundation',
              library_role: targetApp.library_role || '',
              languages: targetApp.languages || [],
              area_of_interest: targetApp.area_of_interest || targetApp.volunteer_target || '',
              interests: targetApp.area_of_interest || targetApp.volunteer_target || '',
              availability: targetApp.availability || '',
              skills: targetApp.skills || '',
              institution: targetApp.institution || targetApp.company || '',
              department: targetApp.department || '',
              current_status: targetApp.current_status || '',
              social: targetApp.social || '',
              socialMedia: targetApp.social || '',
              experience: targetApp.experience || '',
              influenceArea: targetApp.department || 'Education & Youth',
              profession: targetApp.current_status || 'Ambassador Fellow',
              organization: targetApp.organization || targetApp.company || '',
              company: targetApp.organization || targetApp.company || '',
              representative: targetApp.name || '',
              designation: targetApp.designation || 'Representative',
              website: targetApp.website || '',
              partnership_type: targetApp.partnership_type || 'Strategic Partner',
              partnershipType: targetApp.partnership_type || 'Strategic Partner',
              timeline_or_goals: targetApp.timeline_or_goals || '',
              proposal: targetApp.proposal || targetApp.message || '',
              motivation: targetApp.message || targetApp.motivation || '',
              history: `Approved application reflected in ${targetRole}s on ${new Date().toLocaleDateString()}`
            };

            const updatedList = [newMember, ...list];
            try {
              localStorage.setItem('ain_users', JSON.stringify(updatedList));
            } catch (e) {}
            return updatedList;
          });
          if (showToast) showToast(`Application approved and synced to ${targetRole}s directory.`, 'success');
        } else {
          setUsers(prevUsers => {
            const list = Array.isArray(prevUsers) ? prevUsers : [];
            const filtered = list.filter(u => u.applicationId !== targetApp.id);
            try {
              localStorage.setItem('ain_users', JSON.stringify(filtered));
            } catch (e) {}
            return filtered;
          });
          if (showToast) showToast(`Application marked as ${newStatus}`, 'success');
        }
      }
    }

    if (addLog) addLog(`Updated application ${id} status to ${newStatus}`);

    // Persist to backend server API
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          name: targetApp?.name || `${targetApp?.first_name || ''} ${targetApp?.last_name || ''}`.trim(),
          email: targetApp?.email,
          password: targetApp?.password,
          type: targetApp?.type
        })
      });
      const data = await response.json();
      if (data?.emailSent) {
        if (showToast) {
          showToast(newStatus === 'Approved'
            ? `Application approved! Credentials emailed to ${targetApp?.email}.`
            : `Application rejected. Update email sent to ${targetApp?.email}.`,
            'success'
          );
        }
      }
    } catch (e) {
      console.error('Error updating application status:', e);
    } finally {
      setIsProcessingStatus(false);
    }
  };

  const getTypeIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'volunteer':
        return <HeartHandshake size={14} className="text-emerald-700 shrink-0" />;
      case 'ambassador':
        return <Globe size={14} className="text-amber-700 shrink-0" />;
      case 'partner':
        return <Briefcase size={14} className="text-sky-700 shrink-0" />;
      default:
        return <User size={14} className="text-stone-600 shrink-0" />;
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

  // ==========================================
  // DEDICATED APPLICATION DETAIL PAGE VIEW
  // ==========================================
  if (selectedApp) {
    const currentStatus = normalizeStatus(selectedApp.status);
    const isApproved = currentStatus === 'Approved';
    const isRejected = currentStatus === 'Rejected';
    const isPending = currentStatus === 'Pending';

    return (
      <div className="h-full flex flex-col tracking-tight relative overflow-y-auto pr-1 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
          <div>
            <h1 
              onClick={handleBackToApplications}
              className="text-3xl font-semibold text-black flex items-center gap-2 cursor-pointer hover:text-[#003828] transition-colors"
              title="Click to return to Applications Hero page"
            >
              Applications
            </h1>
            <p className="text-stone-500 text-base mt-2 font-medium">
              Review incoming submissions and review volunteer, ambassador, and partner candidates.
            </p>
          </div>

          <button
            onClick={handleBackToApplications}
            className="px-4 py-2 bg-white text-stone-700 rounded-full text-sm font-medium tracking-wide border border-stone-300 hover:bg-stone-50 hover:text-stone-900 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Main Content Stack */}
        <div className="space-y-6">
          {/* Identity Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#003828]/10 text-[#003828] flex items-center justify-center font-bold text-2xl uppercase border border-[#003828]/15 shrink-0">
                  {selectedApp.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 
                      onClick={() => {
                        if (selectedApp.name) {
                          navigator?.clipboard?.writeText?.(selectedApp.name);
                          if (showToast) showToast('Name copied to clipboard!', 'success');
                        }
                      }}
                      className="text-2xl font-bold text-stone-900 cursor-pointer hover:text-[#003828] transition-colors"
                      title="Click to copy name"
                    >
                      {selectedApp.name}
                    </h2>
                    {isApproved && (
                      <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-[11px] font-semibold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
                        Rejected
                      </span>
                    )}
                    {isPending && (
                      <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Exact name ke samne right side pe: Approve and Reject buttons (disappear when Approved or Rejected) */}
              {isPending && (
                <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={isProcessingStatus}
                    onClick={() => handleUpdateStatus(selectedApp.id, 'Approved')}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs bg-[#003828] text-white hover:bg-[#00281c] border border-[#003828] disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Approve Application"
                  >
                    <Check size={15} strokeWidth={2.5} />
                    {isProcessingStatus ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingStatus}
                    onClick={() => handleUpdateStatus(selectedApp.id, 'Rejected')}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer border text-rose-700 bg-white hover:bg-rose-50 border-rose-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Reject Application"
                  >
                    <X size={15} strokeWidth={2.5} />
                    {isProcessingStatus ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 text-sm">
              <CopyableDetail 
                label="Application Type" 
                value={selectedApp.type || 'Volunteer'} 
                displayValue={<span className="capitalize">{selectedApp.type || 'Volunteer'}</span>}
                showToast={showToast}
              />
              <CopyableDetail 
                label="Role" 
                value={selectedApp.volunteer_target || selectedApp.partnership_type || selectedApp.department || 'Alliance Member'} 
                showToast={showToast}
              />
              <CopyableDetail 
                label="Location" 
                value={[selectedApp.city, selectedApp.country].filter(Boolean).join(', ') || 'Not specified'} 
                showToast={showToast}
              />
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 text-emerald-900 font-bold text-sm uppercase tracking-wider">
              <Mail size={16} className="text-emerald-900" />
              <h3>Contact Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <CopyableDetail 
                label="Email Address" 
                value={selectedApp.email} 
                displayValue={<span className="text-[#003828] hover:underline">{selectedApp.email}</span>}
                showToast={showToast}
                actionIcon={<ExternalLink size={12} />}
                onActionClick={() => window.open(`mailto:${selectedApp.email}`, '_self')}
              />

              {selectedApp.phone && (
                <CopyableDetail 
                  label="Phone Number" 
                  value={selectedApp.phone} 
                  showToast={showToast}
                  actionIcon={<ExternalLink size={12} />}
                  onActionClick={() => window.open(`tel:${selectedApp.phone}`, '_self')}
                />
              )}

              {selectedApp.whatsapp && (
                <CopyableDetail 
                  label="WhatsApp Number" 
                  value={selectedApp.whatsapp} 
                  displayValue={<span className="text-emerald-800 hover:underline">{selectedApp.whatsapp}</span>}
                  showToast={showToast}
                  actionIcon={<ExternalLink size={12} />}
                  onActionClick={() => window.open(`https://wa.me/${selectedApp.whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}
                />
              )}

              {(selectedApp.city || selectedApp.country) && (
                <CopyableDetail 
                  label="Location" 
                  value={[selectedApp.city, selectedApp.country].filter(Boolean).join(', ')} 
                  showToast={showToast}
                />
              )}

              {selectedApp.gender && (
                <CopyableDetail 
                  label="Gender" 
                  value={selectedApp.gender} 
                  displayValue={<span className="capitalize">{selectedApp.gender}</span>}
                  showToast={showToast}
                />
              )}

              {selectedApp.dob && (
                <CopyableDetail 
                  label="Date of Birth" 
                  value={selectedApp.dob} 
                  showToast={showToast}
                />
              )}
            </div>
          </div>

          {/* PARTNER SPECIFIC SECTION */}
          {selectedApp.type === 'partner' && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100 text-emerald-900 font-bold text-sm uppercase tracking-wider">
                <Briefcase size={16} className="text-emerald-900" />
                <h3>Partnership & Organization Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <CopyableDetail 
                  label="Organization / Company" 
                  value={selectedApp.organization || selectedApp.company} 
                  showToast={showToast}
                />
                <CopyableDetail 
                  label="Contact Designation" 
                  value={selectedApp.designation || 'Official Representative'} 
                  showToast={showToast}
                />
                {(selectedApp.org_city || selectedApp.org_country) && (
                  <CopyableDetail 
                    label="Headquarters Location" 
                    value={[selectedApp.org_city, selectedApp.org_country].filter(Boolean).join(', ')} 
                    showToast={showToast}
                  />
                )}
                {selectedApp.partnership_type && (
                  <CopyableDetail 
                    label="Partnership Category" 
                    value={selectedApp.partnership_type} 
                    displayValue={<span className="text-sky-800">{selectedApp.partnership_type}</span>}
                    showToast={showToast}
                  />
                )}
                {selectedApp.website && (
                  <CopyableDetail 
                    label="Official Website" 
                    value={selectedApp.website} 
                    displayValue={<span className="text-[#003828] hover:underline inline-flex items-center gap-1">{selectedApp.website}</span>}
                    showToast={showToast}
                    actionIcon={<ExternalLink size={12} />}
                    onActionClick={() => window.open(selectedApp.website, '_blank')}
                  />
                )}
                {selectedApp.timeline_or_goals && (
                  <CopyableDetail 
                    label="Target Timeline / Strategic Goals" 
                    value={selectedApp.timeline_or_goals} 
                    className="col-span-full"
                    showToast={showToast}
                  />
                )}
              </div>
            </div>
          )}

          {/* AMBASSADOR SPECIFIC SECTION */}
          {selectedApp.type === 'ambassador' && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100 text-emerald-900 font-bold text-sm uppercase tracking-wider">
                <Globe size={16} className="text-emerald-900" />
                <h3>Campus & Youth Outreach Profile</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <CopyableDetail 
                  label="University / Institution" 
                  value={selectedApp.institution || selectedApp.company} 
                  showToast={showToast}
                />
                {selectedApp.department && (
                  <CopyableDetail 
                    label="Department / Major" 
                    value={selectedApp.department} 
                    showToast={showToast}
                  />
                )}
                {selectedApp.current_status && (
                  <CopyableDetail 
                    label="Academic Status" 
                    value={selectedApp.current_status} 
                    showToast={showToast}
                  />
                )}
                {selectedApp.social && (
                  <CopyableDetail 
                    label="Social Media / LinkedIn" 
                    value={selectedApp.social} 
                    displayValue={<span className="text-[#003828] hover:underline inline-flex items-center gap-1">{selectedApp.social}</span>}
                    showToast={showToast}
                    actionIcon={<ExternalLink size={12} />}
                    onActionClick={() => window.open(selectedApp.social, '_blank')}
                  />
                )}
                {selectedApp.experience && (
                  <CopyableDetail 
                    label="Leadership & Volunteering Experience" 
                    value={selectedApp.experience} 
                    className="col-span-full"
                    showToast={showToast}
                  />
                )}
              </div>
            </div>
          )}

          {/* VOLUNTEER SPECIFIC SECTION */}
          {selectedApp.type === 'volunteer' && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-100 text-emerald-900 font-bold text-sm uppercase tracking-wider">
                <HeartHandshake size={16} className="text-emerald-900" />
                <h3>Volunteer Service Profile</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <CopyableDetail 
                  label="Volunteering Target" 
                  value={selectedApp.volunteer_target || 'ESPA Foundation'} 
                  displayValue={<span className="text-[#003828]">{selectedApp.volunteer_target || 'ESPA Foundation'}</span>}
                  showToast={showToast}
                />
                {selectedApp.library_role && (
                  <CopyableDetail 
                    label="Digital Library Position" 
                    value={selectedApp.library_role} 
                    displayValue={<span className="text-emerald-900">{selectedApp.library_role}</span>}
                    showToast={showToast}
                  />
                )}
                {selectedApp.area_of_interest && (
                  <CopyableDetail 
                    label="Area of Interest" 
                    value={selectedApp.area_of_interest} 
                    showToast={showToast}
                  />
                )}
                {selectedApp.availability && (
                  <CopyableDetail 
                    label="Availability" 
                    value={selectedApp.availability} 
                    showToast={showToast}
                  />
                )}
                {selectedApp.languages && (
                  <CopyableDetail 
                    label="Languages Spoken" 
                    value={Array.isArray(selectedApp.languages) 
                      ? selectedApp.languages.map(l => typeof l === 'object' && l !== null ? `${l.language} (${l.fluency})` : l).join(', ') 
                      : String(selectedApp.languages)} 
                    displayValue={
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(Array.isArray(selectedApp.languages) ? selectedApp.languages : [selectedApp.languages]).map((lang, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 bg-white text-emerald-900 rounded-full text-xs font-semibold border border-emerald-200">
                            {typeof lang === 'object' && lang !== null ? `${lang.language} (${lang.fluency})` : lang}
                          </span>
                        ))}
                      </div>
                    }
                    className="col-span-full"
                    showToast={showToast}
                  />
                )}
                {selectedApp.skills && (
                  <CopyableDetail 
                    label="Special Skills & Capabilities" 
                    value={selectedApp.skills} 
                    className="col-span-full"
                    showToast={showToast}
                  />
                )}
              </div>
            </div>
          )}

          {/* Motivation / Proposal Statement Box */}
          {(selectedApp.message || selectedApp.motivation || selectedApp.proposal) && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-100 text-emerald-900 font-bold text-sm uppercase tracking-wider">
                <MessageSquare size={16} className="text-emerald-900" />
                <h3>{selectedApp.type === 'partner' ? 'Partnership Proposal Statement' : 'Motivation & Statement of Intent'}</h3>
              </div>
              <CopyableDetail 
                label="Click anywhere to copy statement"
                value={selectedApp.message || selectedApp.motivation || selectedApp.proposal}
                displayValue={
                  <div className="text-stone-800 leading-relaxed text-sm whitespace-pre-wrap font-serif sm:font-sans">
                    "{selectedApp.message || selectedApp.motivation || selectedApp.proposal}"
                  </div>
                }
                showToast={showToast}
                className="bg-stone-50/80 hover:bg-emerald-50/40 p-4"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // APPLICATIONS TABLE LIST VIEW
  // ==========================================
  return (
    <div className="space-y-0 h-full flex flex-col tracking-tight relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-2">
            Applications
          </h1>
          <p className="text-stone-500 text-base mt-2 font-medium">
            Review incoming submissions and review volunteer, ambassador, and partner candidates.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 shrink-0">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by name, email, organization, or focus..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden min-h-0 flex-1">
        <div className="flex-1 overflow-auto">
          {filteredApps.length === 0 ? (
            <div className="p-16 text-center text-stone-500">
              <FileText className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <h3 className="font-semibold text-stone-700 text-lg">No applications found</h3>
              <p className="text-sm text-stone-400 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'Try changing your search keywords.' 
                  : 'New volunteer, ambassador, and partner applications will appear here as soon as they are submitted.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse table-fixed min-w-[650px]">
              <thead className="bg-stone-50/75 sticky top-0 z-10 border-b border-stone-200 backdrop-blur-sm">
                <tr>
                  <th className="w-[32%] px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-left">Title</th>
                  <th className="w-[28%] px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-left">Status</th>
                  <th className="w-[22%] px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-left">Submission Date</th>
                  <th className="w-[18%] px-6 py-4 font-semibold text-stone-600 text-sm whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredApps.map(app => {
                  const appStatus = normalizeStatus(app.status);
                  const isApproved = appStatus === 'Approved';
                  const isRejected = appStatus === 'Rejected';
                  const isPending = appStatus === 'Pending';

                  return (
                    <tr 
                      key={app.id} 
                      className="hover:bg-stone-50/80 transition-colors group cursor-pointer" 
                      onClick={() => handleOpenAppPage(app)}
                    >
                      <td className="w-[32%] px-6 py-4 text-left">
                        <div className="font-semibold text-stone-900 text-sm group-hover:text-[#003828] transition-colors truncate">
                          {app.name}
                        </div>
                      </td>
                      <td className="w-[28%] px-6 py-4 text-left">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isApproved ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                          isRejected ? 'bg-rose-50 text-rose-800 border-rose-200' : 
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isApproved && <Check size={12} className="text-emerald-700" />}
                          {isRejected && <X size={12} className="text-rose-700" />}
                          {isPending && <Clock size={12} className="text-amber-700" />}
                          <span>{appStatus}</span>
                        </span>
                      </td>
                      <td className="w-[22%] px-6 py-4 text-stone-600 text-sm text-left">
                        <span className="inline-block">
                          {app.date ? new Date(app.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                        </span>
                      </td>
                      <td className="w-[18%] px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleOpenAppPage(app)}
                            className="p-2 text-stone-400 hover:text-[#003828] hover:bg-[#003828]/10 rounded-full transition-colors cursor-pointer"
                            title="Edit Application"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
