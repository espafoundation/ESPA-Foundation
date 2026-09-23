import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, ShieldCheck, HeartHandshake, Globe, ArrowLeft, Share2, Mail, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();

  // Look up user from localStorage or mock registry
  const users = (() => {
    try {
      const stored = localStorage.getItem('espa_users') || localStorage.getItem('ain_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  })();

  const member = users.find((u: any) => 
    u.id === id || 
    u.username === id || 
    (u.name && u.name.toLowerCase().replace(/\s+/g, '-') === id?.toLowerCase())
  ) || {
    id: id || 'MB01',
    name: id ? id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Volunteer Member',
    role: id?.toLowerCase().includes('ambassador') ? 'Ambassador' : 'Volunteer',
    email: 'member@espafoundation.org',
    city: 'Global',
    country: 'International',
    dateAdded: new Date().toISOString()
  };

  const isAmbassador = member.role?.toLowerCase() === 'ambassador';
  const isVolunteer = member.role?.toLowerCase() === 'volunteer';

  const handleCopyLink = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success('Profile link copied to clipboard!');
      }).catch(() => {
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = (text: string) => {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    toast.success('Profile link copied to clipboard!');
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{`${member.name} | ESPA Foundation ${member.role}`}</title>
        <meta name="description" content={`Official ${member.role} profile of ${member.name} at ESPA Foundation.`} />
      </Helmet>

      <div className="max-w-3xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-medium text-[#003828] hover:text-[#003828]/70 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs font-semibold text-stone-700 hover:text-[#003828] hover:border-[#003828] transition-colors shadow-2xs"
          >
            <Share2 size={13} />
            Share Profile
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#003828] to-[#00261B] h-32 relative px-8 flex items-end">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-[#003828] bg-stone-100 uppercase">
                {member.name?.charAt(0) || 'E'}
              </div>
            </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-stone-900">{member.name}</h1>
                  <span title="Verified Member" className="text-[#003828]">
                    <CheckCircle size={20} className="fill-emerald-50 text-emerald-600" />
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isAmbassador 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {isAmbassador ? <Globe size={12} /> : <HeartHandshake size={12} />}
                    ESPA {member.role}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">ID: {member.id}</span>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-[#003828] text-white rounded-xl text-xs font-bold hover:bg-[#00261B] transition-colors shadow-xs"
              >
                <Share2 size={14} />
                Copy Profile Link
              </button>
            </div>

            {/* Member Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                <ShieldCheck size={20} className="text-[#003828] shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Affiliation</p>
                  <p className="text-sm font-bold text-stone-900">ESPA Foundation & Digital Library</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                <Calendar size={20} className="text-[#003828] shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-bold text-stone-900">
                    {member.dateAdded ? new Date(member.dateAdded).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2024'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                <MapPin size={20} className="text-[#003828] shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Location</p>
                  <p className="text-sm font-bold text-stone-900">
                    {[member.city, member.country].filter(Boolean).join(', ') || 'Global'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                <Mail size={20} className="text-[#003828] shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Contact</p>
                  <p className="text-sm font-bold text-stone-900 truncate">{member.email}</p>
                </div>
              </div>
            </div>

            {/* Mission Box */}
            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 mb-6">
              <h3 className="text-sm font-bold text-[#003828] mb-1">Empowering Communities Through Education</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                As an active {member.role}, {member.name} supports ESPA Foundation's global initiatives to bridge educational divides, support digital library curation, and champion youth development.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div>
                <p className="text-xs font-bold text-stone-900">Inspired to make a difference?</p>
                <p className="text-xs text-stone-500">Join our team of volunteers and ambassadors worldwide.</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/volunteer"
                  className="px-4 py-2 bg-[#003828] text-white rounded-xl text-xs font-bold hover:bg-[#00261B] transition-colors"
                >
                  Volunteer Now
                </Link>
                <Link
                  to="/ambassador"
                  className="px-4 py-2 bg-white text-[#003828] border border-stone-200 rounded-xl text-xs font-bold hover:bg-stone-50 transition-colors"
                >
                  Ambassador Program
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
