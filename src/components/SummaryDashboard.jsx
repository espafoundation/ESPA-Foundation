import React, { useMemo, useState } from 'react';
import { 
  LayoutDashboard, Wallet, ArrowRightLeft, Copy, Check, Share2, 
  Globe, HeartHandshake, Briefcase, HandCoins, ExternalLink, 
  Clock, Shield, Award, Users, Download, Calendar, MapPin, 
  Building, TrendingUp, Sparkles, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import DonationTrendsChart from './DonationTrendsChart';

export default function SummaryDashboard({ funds, currentUser, setActiveTab }) {
  const role = currentUser?.role || 'Volunteer';
  const mgmtRoles = ['Admin', 'President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Treasurer', 'Executive Member'];
  const isAdmin = mgmtRoles.includes(role);

  const [copied, setCopied] = useState(false);

  const handleCopyProfileLink = () => {
    const profileSlug = currentUser?.id || currentUser?.username || (currentUser?.name ? currentUser.name.toLowerCase().replace(/\s+/g, '-') : 'profile');
    const profileUrl = `${window.location.origin}/profile/${profileSlug}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(profileUrl)
        .then(() => {
          setCopied(true);
          toast.success('Profile link copied to clipboard!');
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(() => {
          fallbackCopy(profileUrl);
        });
    } else {
      fallbackCopy(profileUrl);
    }
  };

  const fallbackCopy = (text) => {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    setCopied(true);
    toast.success('Profile link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const profileSlug = currentUser?.id || currentUser?.username || (currentUser?.name ? currentUser.name.toLowerCase().replace(/\s+/g, '-') : 'profile');
  const profileUrl = `${window.location.origin}/profile/${profileSlug}`;

  // =========================================================================
  // 1. DEDICATED VOLUNTEER DASHBOARD
  // =========================================================================
  if (role === 'Volunteer') {
    return (
      <div className="space-y-6 h-full flex flex-col tracking-tight relative overflow-y-auto pb-12 pr-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Volunteer Dashboard
              </span>
              <span className="text-xs font-semibold text-stone-500">ESPA Community Force</span>
            </div>
            <h1 className="text-3xl font-bold text-stone-900">
              Welcome back, {currentUser?.name?.split(' ')[0] || 'Volunteer'}!
            </h1>
            <p className="text-stone-500 text-sm mt-1 font-medium">Track your community service hours, active initiatives, and certifications.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyProfileLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{copied ? 'Copied' : 'Share Profile'}</span>
            </button>
          </div>
        </div>

        {/* Volunteer Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Service Hours</span>
              <Clock size={18} className="text-[#003828]" />
            </div>
            <div className="text-3xl font-extrabold text-stone-900">13.5 <span className="text-xs font-semibold text-stone-400">hrs</span></div>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 inline-block">100% Verified Log</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Initiatives</span>
              <HeartHandshake size={18} className="text-[#003828]" />
            </div>
            <div className="text-3xl font-extrabold text-stone-900">3 <span className="text-xs font-semibold text-stone-400">active</span></div>
            <span className="text-[11px] text-stone-500 font-medium mt-1 inline-block">Digital Libraries & Relief</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Certificate Status</span>
              <Award size={18} className="text-[#003828]" />
            </div>
            <div className="text-base font-bold text-emerald-700">Eligible (Bronze)</div>
            <span className="text-[11px] text-stone-500 font-medium mt-1 inline-block">10+ Verified Service Hours</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">ID Verification</span>
              <Shield size={18} className="text-[#003828]" />
            </div>
            <div className="text-sm font-mono font-bold text-stone-900">{currentUser?.id || 'VOL-2026'}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Verified ESPA Volunteer</span>
          </div>
        </div>

        {/* Assigned Projects & Profile Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-stone-900 text-lg">My Active Volunteer Assignments</h3>
              <span className="text-xs text-stone-400 font-medium">Updated weekly</span>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">Primary Focus</span>
                    <h4 className="font-bold text-stone-900 text-sm">ESPA Digital Library Mentorship & Cataloging</h4>
                  </div>
                  <p className="text-xs text-stone-600">Assist students with digital reading tablets and STEM book loans.</p>
                </div>
                <span className="text-xs font-bold text-[#003828] bg-white px-3 py-1.5 rounded-xl border border-stone-200 shrink-0">
                  4 hrs / week
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Field Drive</span>
                    <h4 className="font-bold text-stone-900 text-sm">Community Book Donation & Literacy Campaign</h4>
                  </div>
                  <p className="text-xs text-stone-600">Mobilizing second-hand textbooks and academic journals for rural centers.</p>
                </div>
                <span className="text-xs font-bold text-[#003828] bg-white px-3 py-1.5 rounded-xl border border-stone-200 shrink-0">
                  Weekend Drives
                </span>
              </div>
            </div>
          </div>

          {/* Volunteer Guidelines Card */}
          <div className="bg-[#003828]/5 rounded-3xl p-6 border border-[#003828]/15 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#003828] text-white flex items-center justify-center mb-4 shadow-sm">
                <HeartHandshake size={24} />
              </div>
              <h3 className="font-bold text-[#003828] text-lg">Volunteer Guidelines</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Always display your official NGO badge during on-site field visits.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Submit deployment hours within 48 hours of field session completion.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Report any community emergencies to field coordinators immediately.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#003828]/10 text-xs font-bold text-[#003828] flex items-center gap-1.5">
              <span>Emergency Support:</span>
              <a href="mailto:volunteer@ainmanagement.com" className="hover:underline font-normal text-stone-600">volunteer@ainmanagement.com</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. DEDICATED AMBASSADOR DASHBOARD
  // =========================================================================
  if (role === 'Ambassador') {
    return (
      <div className="space-y-6 h-full flex flex-col tracking-tight relative overflow-y-auto pb-12 pr-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                Ambassador Dashboard
              </span>
              <span className="text-xs font-semibold text-stone-500">Global Youth & Campus Outreach</span>
            </div>
            <h1 className="text-3xl font-bold text-stone-900">
              Ambassador {currentUser?.name || 'Fellow'}
            </h1>
            <p className="text-stone-500 text-sm mt-1 font-medium">Campus engagement metrics, student referrals, and campaign kits.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyProfileLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{copied ? 'Copied' : 'Share Profile'}</span>
            </button>
          </div>
        </div>

        {/* Ambassador Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Students Reached</span>
              <Users size={18} className="text-amber-700" />
            </div>
            <div className="text-3xl font-extrabold text-stone-900">450+</div>
            <span className="text-[11px] text-amber-800 font-bold mt-1 inline-block">Across 3 Campus Drives</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Referral Code</span>
              <Share2 size={18} className="text-amber-700" />
            </div>
            <div className="text-base font-mono font-bold text-stone-900 truncate">
              ESPA-AMB-{currentUser?.name?.slice(0, 3).toUpperCase() || 'PAK'}
            </div>
            <span className="text-[11px] text-[#003828] font-bold mt-1 inline-block">Active for Applications</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Ambassador Tier</span>
              <Award size={18} className="text-amber-700" />
            </div>
            <div className="text-base font-bold text-stone-900">Senior Campus Fellow</div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">Top 10% Regional Lead</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Official Status</span>
              <Shield size={18} className="text-amber-700" />
            </div>
            <div className="text-sm font-bold text-emerald-700">Accredited Ambassador</div>
            <span className="text-[11px] text-stone-400 font-mono mt-1 inline-block">ID: {currentUser?.id || 'AMB-01'}</span>
          </div>
        </div>

        {/* Campaign Assets and Share Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs">
            <h3 className="font-bold text-stone-900 text-lg mb-1">Your Ambassador Referral & Media Link</h3>
            <p className="text-xs text-stone-500 font-medium mb-4">
              Share your direct gateway link for volunteer recruitments, student book donations, and scholarship applications.
            </p>
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-mono text-xs text-stone-700 truncate select-all">
                {window.location.origin}/ambassador
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/ambassador`);
                  toast.success('Ambassador link copied!');
                }}
                className="px-4 py-2 bg-[#003828] text-white rounded-xl text-xs font-bold border border-[#003828] hover:bg-white hover:text-[#003828] transition-all shrink-0 cursor-pointer"
              >
                Copy Link
              </button>
            </div>
          </div>

          <div className="bg-[#003828]/5 rounded-3xl p-6 border border-[#003828]/15 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#003828] text-white flex items-center justify-center mb-4 shadow-sm">
                <Globe size={24} />
              </div>
              <h3 className="font-bold text-[#003828] text-lg">Campus Outreach Guidelines</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Share your verified referral link directly with university cohorts and clubs.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Host monthly informational seminars regarding scholarship opportunities.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Contact regional coordinators for campus booth authorization letters.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#003828]/10 text-xs font-bold text-[#003828] flex items-center gap-1.5">
              <span>Ambassador Secretariat:</span>
              <a href="mailto:ambassadors@espa.com" className="hover:underline font-normal text-stone-600">ambassadors@espa.com</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. DEDICATED PARTNER DASHBOARD
  // =========================================================================
  if (role === 'Partner') {
    return (
      <div className="space-y-6 h-full flex flex-col tracking-tight relative overflow-y-auto pb-12 pr-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-900 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
                Partner Dashboard
              </span>
              <span className="text-xs font-semibold text-stone-500">Corporate & Institutional Alliance</span>
            </div>
            <h1 className="text-3xl font-bold text-stone-900">
              {currentUser?.name || 'Partner Organization'}
            </h1>
            <p className="text-stone-500 text-sm mt-1 font-medium">Bilateral MoUs, joint CSR deliverables, and co-branded impact statistics.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyProfileLink}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{copied ? 'Copied' : 'Share Profile'}</span>
            </button>
          </div>
        </div>

        {/* Partner Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Active MoUs</span>
              <Briefcase size={18} className="text-sky-700" />
            </div>
            <div className="text-3xl font-extrabold text-stone-900">4 <span className="text-xs font-semibold text-stone-400">Agreements</span></div>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 inline-block">All Active & Compliant</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Beneficiaries</span>
              <Users size={18} className="text-sky-700" />
            </div>
            <div className="text-3xl font-extrabold text-stone-900">12,500+</div>
            <span className="text-[11px] text-stone-500 font-medium mt-1 inline-block">Youth & Students Impacted</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Co-Funded Programs</span>
              <Building size={18} className="text-sky-700" />
            </div>
            <div className="text-2xl font-bold text-stone-900">2 Major Drives</div>
            <span className="text-[11px] text-[#003828] font-bold mt-1 inline-block">Digital Libraries & Robotics</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">CSR Compliance</span>
              <Shield size={18} className="text-sky-700" />
            </div>
            <div className="text-base font-bold text-emerald-700">Audit Certified</div>
            <span className="text-[11px] text-stone-500 font-medium mt-1 inline-block">Annual Social Audit 2026</span>
          </div>
        </div>

        {/* Joint Programs Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs">
            <h3 className="font-bold text-stone-900 text-lg mb-1">Active Joint CSR Deployments</h3>
            <p className="text-xs text-stone-500 font-medium mb-4">Milestone progress and live field status of co-sponsored community initiatives.</p>
            <div className="space-y-3">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md uppercase">Technology Pillar</span>
                    <h4 className="font-bold text-stone-900 text-sm mt-1">Digital Library Tablet & Solar Micro-Grid Setup</h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">80% Completed</span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#003828] h-full rounded-full w-4/5"></div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase">Education Pillar</span>
                    <h4 className="font-bold text-stone-900 text-sm mt-1">Secondary School STEM Labs & Robotics Kits</h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Active Cohort</span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full w-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#003828]/5 rounded-3xl p-6 border border-[#003828]/15 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#003828] text-white flex items-center justify-center mb-4 shadow-sm">
                <Briefcase size={24} />
              </div>
              <h3 className="font-bold text-[#003828] text-lg">Institutional Partner Desk</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Access quarterly institutional CSR impact statements and financial audits.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Co-branded media releases require 7-day advance review with PR directorate.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Request formal bilateral MoU renewals through executive board liaison.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#003828]/10 text-xs font-bold text-[#003828] flex items-center gap-1.5">
              <span>Partner Directorate:</span>
              <a href="mailto:partners@espa.com" className="hover:underline font-normal text-stone-600">partners@espa.com</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. DEDICATED DONOR DASHBOARD
  // =========================================================================
  if (role === 'Donor') {
    return (
      <div className="space-y-6 h-full flex flex-col tracking-tight relative overflow-y-auto pb-12 pr-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Donor Dashboard
              </span>
              <span className="text-xs font-semibold text-stone-500">Philanthropic Circle of Honor</span>
            </div>
            <h1 className="text-3xl font-bold text-stone-900">
              Thank you, {currentUser?.name || 'Patron'}!
            </h1>
            <p className="text-stone-500 text-sm mt-1 font-medium">Your donations empower thousands with education, healthcare, and digital libraries.</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/donate"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <HandCoins size={14} /> Donate Again
            </a>
          </div>
        </div>

        {/* Donor Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Lifetime Giving (PKR)</span>
              <Wallet size={18} className="text-[#003828]" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">PKR 750,000</div>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 inline-block">100% Tax Deductible</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Lifetime Giving (USD)</span>
              <Wallet size={18} className="text-[#003828]" />
            </div>
            <div className="text-2xl font-extrabold text-stone-900">$2,800 USD</div>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 inline-block">International Wire</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Honorary Tier</span>
              <Award size={18} className="text-amber-700" />
            </div>
            <div className="text-xl font-bold text-amber-800">Gold Benefactor</div>
            <span className="text-[11px] text-stone-500 font-medium mt-1 inline-block">Permanent Roll of Honor</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex justify-between items-center text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Impact Receipts</span>
              <Download size={18} className="text-[#003828]" />
            </div>
            <div className="text-base font-bold text-stone-900">All Certified</div>
            <button 
              onClick={() => { toast.success('Downloading full tax-deductible donor statement (PDF)...'); }}
              className="text-[11px] text-[#003828] font-bold hover:underline mt-1 inline-block cursor-pointer"
            >
              Download Statement
            </button>
          </div>
        </div>

        {/* Transparent Allocation Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs">
            <h3 className="font-bold text-stone-900 text-lg mb-1">Your Direct Philanthropic Impact</h3>
            <p className="text-xs text-stone-500 font-medium mb-5">Where every single rupee and dollar was deployed in our field programs:</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-stone-800 mb-1.5">
                  <span className="flex items-center gap-1.5"><Building size={14} className="text-[#003828]" /> 18 Community Digital Libraries</span>
                  <span>PKR 375,000 (50%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#003828] h-full rounded-full w-1/2"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-stone-800 mb-1.5">
                  <span className="flex items-center gap-1.5"><Award size={14} className="text-emerald-700" /> Scholarships for 35 Underprivileged Students</span>
                  <span>PKR 225,000 (30%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full w-[30%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-stone-800 mb-1.5">
                  <span className="flex items-center gap-1.5"><HeartHandshake size={14} className="text-sky-700" /> Clean Water Filtration & Health Drives</span>
                  <span>PKR 150,000 (20%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full w-[20%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#003828]/5 rounded-3xl p-6 border border-[#003828]/15 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#003828] text-white flex items-center justify-center mb-4 shadow-sm">
                <HandCoins size={24} />
              </div>
              <h3 className="font-bold text-[#003828] text-lg">Tax & Stewardship Information</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>All contributions qualify for certified tax deductions under NGO statutory registration.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>Official digital stamped donation receipts are issued for each transaction.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#003828] mt-1.5 shrink-0" />
                  <span>100% of earmarked donor funding is deployed directly to designated relief projects.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#003828]/10 text-xs font-bold text-[#003828] flex items-center gap-1.5">
              <span>Donor Relations:</span>
              <a href="mailto:donor-care@espa.com" className="hover:underline font-normal text-stone-600">donor-care@espa.com</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. EXECUTIVE / ADMIN MANAGEMENT DASHBOARD
  // =========================================================================
  const totalDonationsPKR = funds?.transactions?.filter(t => t.type === 'donation' && t.currency === 'PKR').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalDonationsUSD = funds?.transactions?.filter(t => t.type === 'donation' && t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalAllocationsPKR = funds?.transactions?.filter(t => t.type === 'allocation' && t.currency === 'PKR').reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalAllocationsUSD = funds?.transactions?.filter(t => t.type === 'allocation' && t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="space-y-8 h-full flex flex-col tracking-tight relative overflow-y-auto pr-1 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-black flex items-center gap-2">
            Dashboard
          </h1>
          <p className="text-stone-500 text-base mt-1 font-medium">Executive overview of funds, allocations, and organizational health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <Wallet size={32} className="text-[#003828] mb-4" />
          <h2 className="text-xl font-bold text-stone-500 mb-2">Current Funds (PKR)</h2>
          <div className="text-4xl font-bold text-stone-900">PKR {(funds?.pkr || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <Wallet size={32} className="text-[#003828] mb-4" />
          <h2 className="text-xl font-bold text-stone-500 mb-2">Current Funds (USD)</h2>
          <div className="text-4xl font-bold text-stone-900">${(funds?.usd || 0).toLocaleString()}</div>
        </div>
        
        <div className="bg-stone-50 rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-stone-400" /> Total Donations
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-600 font-medium">PKR</span>
              <span className="text-stone-900 font-bold">PKR {(totalDonationsPKR || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600 font-medium">USD</span>
              <span className="text-stone-900 font-bold">${(totalDonationsUSD || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-stone-50 rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-stone-400" /> Total Allocations
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-600 font-medium">PKR</span>
              <span className="text-stone-900 font-bold">PKR {(totalAllocationsPKR || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600 font-medium">USD</span>
              <span className="text-stone-900 font-bold">${(totalAllocationsUSD || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {funds?.transactions && <DonationTrendsChart transactions={funds.transactions} />}
    </div>
  );
}
